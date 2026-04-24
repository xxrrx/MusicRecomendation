'use strict';

/**
 * seed-topup.js
 * Top-up seed: thêm ~150 bài mới từ Jamendo + bổ sung play history / behaviors
 * để đạt target Phase 7: ~300 songs, ~1500 play history, ~800 behaviors
 *
 * Chạy: node prisma/seed-topup.js
 */

require('dotenv').config();

const https = require('https');
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const prisma = new PrismaClient();

const JAMENDO_CLIENT_ID = '5c964ec6';
const TARGET_NEW_SONGS = 150;

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const S3_BUCKET = process.env.AWS_S3_BUCKET;

const GENRE_MAP = {
  pop: 'v-pop', vpop: 'v-pop', indie: 'indie', rock: 'rock',
  electronic: 'electronic', electronica: 'electronic', electro: 'electronic',
  jazz: 'jazz', classical: 'classical', folk: 'folk',
  hiphop: 'hip-hop', 'hip-hop': 'hip-hop', rap: 'hip-hop',
  rnb: 'r-and-b', 'r&b': 'r-and-b', soul: 'r-and-b', ballad: 'ballad',
};
const MOODS = ['happy', 'sad', 'energetic', 'calm', 'romantic', 'melancholic', 'chill', 'dreamy'];
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomFloat(min, max) { return Math.random() * (max - min) + min; }
function randomDateInPast(days) { return new Date(Date.now() - randomInt(0, days) * 86400000); }
function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 40);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('JSON parse error')); }
      });
    }).on('error', reject);
  });
}

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function uploadToS3(buffer, s3Key, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: buffer,
    ContentType: contentType,
  }));
  return `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
}

async function fetchJamendoTracks(offset, limit) {
  const url =
    `https://api.jamendo.com/v3.0/tracks/` +
    `?client_id=${JAMENDO_CLIENT_ID}` +
    `&format=json&limit=${limit}&offset=${offset}` +
    `&audioformat=mp32&include=musicinfo&order=popularity_month`;
  const res = await fetchJson(url);
  if (res.headers.status !== 'success') throw new Error('Jamendo API: ' + JSON.stringify(res.headers));
  return res.results || [];
}

function resolveGenreSlug(track) {
  const tags = track.musicinfo?.tags?.genres || [];
  for (const tag of tags) {
    const slug = GENRE_MAP[tag.toLowerCase()];
    if (slug) return slug;
  }
  return null;
}

function resolveMood(track) {
  const vartags = track.musicinfo?.tags?.vartags || [];
  for (const tag of vartags) {
    if (MOODS.includes(tag.toLowerCase())) return tag.toLowerCase();
  }
  return randomItem(MOODS);
}

async function main() {
  console.log('🌱 Starting top-up seed...\n');

  if (!S3_BUCKET || !process.env.AWS_ACCESS_KEY_ID) {
    throw new Error('Missing AWS config in .env');
  }

  // 1. Genres
  const genresInDb = await prisma.genre.findMany();
  const genreBySlug = Object.fromEntries(genresInDb.map((g) => [g.slug, g.id]));
  const genreIds = genresInDb.map((g) => g.id);
  console.log(`✅ ${genresInDb.length} genres`);

  // 2. Load existing Jamendo track IDs để skip duplicate
  const existingSongs = await prisma.song.findMany({ select: { fileUrl: true } });
  const existingTrackIds = new Set(
    existingSongs.map((s) => {
      const m = s.fileUrl && s.fileUrl.match(/jamendo_(\d+)/);
      return m ? m[1] : null;
    }).filter(Boolean)
  );
  console.log(`✅ ${existingTrackIds.size} songs already in DB (will skip duplicates)`);

  // 3. Fetch tracks from Jamendo (offset 300+ để lấy bài mới)
  console.log('\n📡 Fetching new tracks from Jamendo...');
  let allNew = [];
  const offsets = [300, 500, 700, 900];
  for (const offset of offsets) {
    if (allNew.length >= TARGET_NEW_SONGS * 2) break;
    const batch = await fetchJamendoTracks(offset, 200);
    const valid = batch.filter(
      (t) => t.audiodownload &&
        t.audiodownload.startsWith('http') &&
        !existingTrackIds.has(String(t.id))
    );
    console.log(`  offset=${offset}: ${valid.length} new valid tracks`);
    allNew = [...allNew, ...valid];
  }

  const tracks = allNew.slice(0, TARGET_NEW_SONGS);
  console.log(`✅ Will seed ${tracks.length} new tracks`);

  if (tracks.length === 0) {
    console.log('No new tracks found — skipping song seed');
  }

  // 4. Artists + Songs
  const artistPassword = await bcrypt.hash('Artist@123456', 12);
  const newSongIds = [];
  let successCount = 0;
  let failCount = 0;

  console.log('\n🎵 Creating artists + songs...');
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const artistName = track.artist_name || `Artist topup ${i + 1}`;
    const email = `artist_${track.id}@jamendo.seed`;

    // User / Artist
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email, passwordHash: artistPassword, role: 'artist',
          displayName: artistName, isVerified: true, isActive: true,
        },
      });
    }
    let artist = await prisma.artist.findUnique({ where: { userId: user.id } });
    if (!artist) {
      artist = await prisma.artist.create({ data: { userId: user.id, bio: `Jamendo: ${artistName}` } });
    }

    // Album cover
    let coverUrl = null;
    if (track.album_image) {
      try {
        const imgBuf = await downloadBuffer(track.album_image);
        coverUrl = await uploadToS3(imgBuf, `covers/jamendo_${track.id}.jpg`, 'image/jpeg');
      } catch (_) { /* ignore */ }
    }

    // Album
    let year = null;
    if (track.album_releasedate) {
      const y = parseInt(track.album_releasedate.slice(0, 4));
      if (y > 1900 && y <= 2026) year = y;
    }
    const album = await prisma.album.create({
      data: { title: track.album_name || `Album of ${track.name}`, artistId: artist.id, coverUrl, year },
    });

    // Audio → S3
    let fileUrl = null;
    try {
      process.stdout.write(`  [${i + 1}/${tracks.length}] ${track.name.slice(0, 40)}\r`);
      const audioBuf = await downloadBuffer(track.audiodownload);
      fileUrl = await uploadToS3(audioBuf, `songs/jamendo_${track.id}.mp3`, 'audio/mpeg');
    } catch (e) {
      failCount++;
      console.log(`\n  ⚠️  Skip "${track.name}": ${e.message}`);
      continue;
    }

    const genreSlug = resolveGenreSlug(track);
    const genreId = genreSlug ? (genreBySlug[genreSlug] || null) : null;
    const bpm = track.musicinfo?.bpm ? parseInt(track.musicinfo.bpm) : null;

    const song = await prisma.song.create({
      data: {
        title: track.name || `Track ${track.id}`,
        artistId: artist.id,
        albumId: album.id,
        genreId,
        duration: parseInt(track.duration) || 180,
        bpm: bpm && bpm > 0 ? bpm : null,
        mood: resolveMood(track),
        key: randomItem(KEYS),
        fileUrl,
        coverUrl,
        playCount: 0,
        status: 'published',
        publishedAt: randomDateInPast(730),
      },
    });

    newSongIds.push(song.id);
    successCount++;
  }
  console.log(`\n✅ Created ${successCount} new songs (${failCount} skipped)`);

  // 5. Load ALL song IDs (existing + new) cho play history
  const allSongs = await prisma.song.findMany({ where: { status: 'published' }, select: { id: true } });
  const allSongIds = allSongs.map((s) => s.id);
  console.log(`\nTotal published songs now: ${allSongIds.length}`);

  // 6. Load existing users
  const allUsers = await prisma.user.findMany({ where: { role: 'user' }, select: { id: true } });
  const userIds = allUsers.map((u) => u.id);
  console.log(`Total users: ${userIds.length}`);

  // 7. Top-up PlayHistory → target 1500
  const currentPlays = await prisma.playHistory.count();
  const playsNeeded = Math.max(0, 1500 - currentPlays);
  console.log(`\n▶️  Play history: ${currentPlays} existing, need ${playsNeeded} more`);

  if (playsNeeded > 0) {
    let added = 0;
    const perUser = Math.ceil(playsNeeded / userIds.length);
    for (const userId of userIds) {
      const count = Math.min(perUser, randomInt(20, 80));
      const picked = [...allSongIds].sort(() => Math.random() - 0.5).slice(0, count);
      for (const songId of picked) {
        await prisma.playHistory.create({
          data: {
            userId, songId,
            playedAt: randomDateInPast(90),
            durationPlayed: randomInt(30, 300),
            completionRate: parseFloat(randomFloat(0.1, 1.0).toFixed(2)),
          },
        });
        added++;
        if (added >= playsNeeded) break;
      }
      if (added >= playsNeeded) break;
    }
    console.log(`✅ Added ${added} play history records`);
  }

  // 8. Top-up UserBehaviors → target 800
  const currentBehaviors = await prisma.userBehavior.count();
  const behaviorsNeeded = Math.max(0, 800 - currentBehaviors);
  console.log(`\n👍 Behaviors: ${currentBehaviors} existing, need ${behaviorsNeeded} more`);

  if (behaviorsNeeded > 0) {
    let added = 0;
    const perUser = Math.ceil(behaviorsNeeded / userIds.length);
    for (const userId of userIds) {
      const count = Math.min(perUser, randomInt(15, 50));
      const picked = [...allSongIds].sort(() => Math.random() - 0.5).slice(0, count);
      for (const songId of picked) {
        const exists = await prisma.userBehavior.findFirst({ where: { userId, songId } });
        if (!exists) {
          const rand = Math.random();
          const action = rand < 0.5 ? 'like' : rand < 0.7 ? 'dislike' : 'skip';
          await prisma.userBehavior.create({
            data: { userId, songId, action, createdAt: randomDateInPast(90) },
          });
          added++;
        }
        if (added >= behaviorsNeeded) break;
      }
      if (added >= behaviorsNeeded) break;
    }
    console.log(`✅ Added ${added} behavior records`);
  }

  // 9. Update playCount
  console.log('\n🔢 Updating play counts...');
  const playCounts = await prisma.playHistory.groupBy({ by: ['songId'], _count: { songId: true } });
  for (const { songId, _count } of playCounts) {
    await prisma.song.update({ where: { id: songId }, data: { playCount: _count.songId } });
  }
  console.log(`✅ Updated ${playCounts.length} songs`);

  // Final summary
  const [finalSongs, finalPlays, finalBehaviors] = await Promise.all([
    prisma.song.count({ where: { status: 'published' } }),
    prisma.playHistory.count(),
    prisma.userBehavior.count(),
  ]);

  console.log('\n' + '─'.repeat(40));
  console.log('✅ Top-up seed complete!');
  console.log('─'.repeat(40));
  console.log(`  Published songs  : ${finalSongs} (target: 300)`);
  console.log(`  Play history     : ${finalPlays} (target: 1500)`);
  console.log(`  User behaviors   : ${finalBehaviors} (target: 800)`);
  console.log('─'.repeat(40));
}

main()
  .catch((e) => { console.error('\n❌ Failed:', e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
