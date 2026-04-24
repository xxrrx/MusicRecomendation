/**
 * seed-jamendo.js
 * Seed 150 bài hát từ Jamendo API vào database.
 * - Mỗi bài hát có 1 artist riêng tương ứng
 * - Audio + Cover được download và upload lên S3
 *
 * Cách chạy:
 *   node prisma/seed-jamendo.js
 *
 * Yêu cầu trong .env:
 *   DATABASE_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
 *   AWS_REGION, AWS_S3_BUCKET
 */

'use strict';

require('dotenv').config();

const https = require('https');
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const prisma = new PrismaClient();

const JAMENDO_CLIENT_ID = '5c964ec6';
const TARGET_SONGS = 150;

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const S3_BUCKET = process.env.AWS_S3_BUCKET;

// ─── Genre map: Jamendo tag → slug trong DB ───────────────────────────────
const GENRE_MAP = {
  pop: 'v-pop',
  vpop: 'v-pop',
  indie: 'indie',
  rock: 'rock',
  electronic: 'electronic',
  electronica: 'electronic',
  electro: 'electronic',
  jazz: 'jazz',
  classical: 'classical',
  folk: 'folk',
  hiphop: 'hip-hop',
  'hip-hop': 'hip-hop',
  rap: 'hip-hop',
  rnb: 'r-and-b',
  'r&b': 'r-and-b',
  soul: 'r-and-b',
  ballad: 'ballad',
};

const MOODS = ['happy', 'sad', 'energetic', 'calm', 'romantic', 'melancholic', 'chill', 'dreamy'];
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// ─── Helpers ─────────────────────────────────────────────────────────────
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}
function randomDateInPast(days) {
  return new Date(Date.now() - randomInt(0, days) * 86400000);
}
function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 40);
}

// ─── HTTP/HTTPS fetch helpers ─────────────────────────────────────────────
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      // Follow redirect
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error')); }
      });
    }).on('error', reject);
  });
}

// Download binary file → Buffer
function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      // Follow redirect
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// Upload buffer lên S3, trả về public URL
async function uploadToS3(buffer, s3Key, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: buffer,
    ContentType: contentType,
  }));
  return `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
}

// ─── Jamendo API ──────────────────────────────────────────────────────────
async function fetchJamendoTracks(offset, limit) {
  const url =
    `https://api.jamendo.com/v3.0/tracks/` +
    `?client_id=${JAMENDO_CLIENT_ID}` +
    `&format=json` +
    `&limit=${limit}` +
    `&offset=${offset}` +
    `&audioformat=mp32` +
    `&include=musicinfo` +
    `&order=popularity_total`;

  const res = await fetchJson(url);
  if (res.headers.status !== 'success') {
    throw new Error('Jamendo API error: ' + JSON.stringify(res.headers));
  }
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

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting Jamendo seed (150 songs)...\n');

  // Validate S3 config
  if (!S3_BUCKET || !process.env.AWS_ACCESS_KEY_ID) {
    throw new Error('Missing AWS config in .env (AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)');
  }

  // 1. Load genres từ DB
  const genresInDb = await prisma.genre.findMany();
  if (genresInDb.length === 0) {
    throw new Error('No genres found in DB. Run "npx prisma db seed" first.');
  }
  const genreBySlug = Object.fromEntries(genresInDb.map((g) => [g.slug, g.id]));
  const genreIds = genresInDb.map((g) => g.id);
  console.log(`✅ Found ${genresInDb.length} genres in DB`);

  // 2. Fetch tracks từ Jamendo
  console.log('\n📡 Fetching tracks from Jamendo API...');
  const batch1 = await fetchJamendoTracks(0, 200);
  // Lọc tracks có audiodownload URL hợp lệ
  const validTracks = batch1.filter((t) => t.audiodownload && t.audiodownload.startsWith('http'));

  // Nếu chưa đủ 150, fetch thêm
  let allTracks = validTracks;
  if (allTracks.length < TARGET_SONGS) {
    const batch2 = await fetchJamendoTracks(200, 100);
    const valid2 = batch2.filter((t) => t.audiodownload && t.audiodownload.startsWith('http'));
    allTracks = [...allTracks, ...valid2];
  }

  const tracks = allTracks.slice(0, TARGET_SONGS);
  console.log(`✅ Got ${tracks.length} valid tracks`);

  // 3. Tạo Users + Artists (1 artist per track = 150 artists)
  console.log('\n👤 Creating artists...');
  const artistPassword = await bcrypt.hash('Artist@123456', 12);
  // trackId → { user, artist }
  const trackArtistMap = {};

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const artistName = track.artist_name || `Artist ${i + 1}`;
    const slug = toSlug(artistName);
    // Dùng track.id để đảm bảo mỗi bài có artist riêng biệt
    const email = `artist_${track.id}@jamendo.seed`;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: artistPassword,
          role: 'artist',
          displayName: artistName,
          avatarUrl: null,
          isVerified: true,
          isActive: true,
        },
      });
    }

    let artist = await prisma.artist.findUnique({ where: { userId: user.id } });
    if (!artist) {
      artist = await prisma.artist.create({
        data: { userId: user.id, bio: `Artist on Jamendo: ${artistName}` },
      });
    }

    trackArtistMap[track.id] = { user, artist };

    if ((i + 1) % 10 === 0) process.stdout.write(`  ${i + 1}/${tracks.length} artists created\r`);
  }
  console.log(`\n✅ Created ${tracks.length} artists`);

  // 4. Tạo Albums (1 album per track, linked to track's artist)
  console.log('\n💿 Creating albums...');
  const trackAlbumMap = {};

  for (const track of tracks) {
    const artistRecord = trackArtistMap[track.id];

    let year = null;
    if (track.album_releasedate) {
      const parsed = parseInt(track.album_releasedate.slice(0, 4));
      if (parsed > 1900 && parsed <= 2026) year = parsed;
    }

    // Cover art: upload lên S3 nếu có
    let coverUrl = null;
    if (track.album_image) {
      try {
        const imgBuffer = await downloadBuffer(track.album_image);
        const s3Key = `covers/jamendo_${track.id}.jpg`;
        coverUrl = await uploadToS3(imgBuffer, s3Key, 'image/jpeg');
      } catch (e) {
        coverUrl = null; // bỏ qua nếu lỗi download
      }
    }

    const album = await prisma.album.create({
      data: {
        title: track.album_name || `Album of ${track.name}`,
        artistId: artistRecord.artist.id,
        coverUrl,
        year,
      },
    });

    trackAlbumMap[track.id] = album.id;
  }
  console.log(`✅ Created ${tracks.length} albums`);

  // 5. Tạo Songs (download audio → S3)
  console.log('\n🎵 Creating songs (downloading audio to S3)...');
  const songIds = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const artistRecord = trackArtistMap[track.id];
    const albumId = trackAlbumMap[track.id] || null;

    const genreSlug = resolveGenreSlug(track);
    const genreId = genreSlug ? (genreBySlug[genreSlug] || null) : null;
    const bpm = track.musicinfo?.bpm ? parseInt(track.musicinfo.bpm) : null;
    const mood = resolveMood(track);
    const key = randomItem(KEYS);

    // Download audio → upload S3
    let fileUrl = null;
    try {
      process.stdout.write(`  [${i + 1}/${tracks.length}] Downloading: ${track.name.slice(0, 40)}...\r`);
      const audioBuffer = await downloadBuffer(track.audiodownload);
      const s3Key = `songs/jamendo_${track.id}.mp3`;
      fileUrl = await uploadToS3(audioBuffer, s3Key, 'audio/mpeg');
    } catch (e) {
      failCount++;
      console.log(`\n  ⚠️  Skip "${track.name}" — download failed: ${e.message}`);
      continue;
    }

    // Cover art (đã upload ở bước album, dùng lại)
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    const coverUrl = album?.coverUrl || null;

    const song = await prisma.song.create({
      data: {
        title: track.name || `Track ${track.id}`,
        artistId: artistRecord.artist.id,
        albumId,
        genreId,
        duration: parseInt(track.duration) || 180,
        bpm: bpm && bpm > 0 ? bpm : null,
        mood,
        key,
        year: null,
        fileUrl,
        lyricsUrl: null,
        coverUrl,
        playCount: 0,
        status: 'published',
        publishedAt: randomDateInPast(730),
      },
    });

    songIds.push(song.id);
    successCount++;
  }
  console.log(`\n✅ Created ${successCount} songs (${failCount} skipped due to download errors)`);

  if (songIds.length === 0) {
    console.error('❌ No songs created — cannot seed users/behaviors');
    return;
  }

  // 6. Tạo seed Users (thường)
  console.log('\n👥 Creating seed users...');
  const userPassword = await bcrypt.hash('User@123456', 12);

  const userGroups = [
    { count: 5, label: 'cold', minPlays: 3, maxPlays: 9 },
    { count: 10, label: 'warm', minPlays: 10, maxPlays: 50 },
    { count: 5, label: 'hot', minPlays: 51, maxPlays: 100 },
  ];

  const seedUsers = [];
  const usersWithPlays = [];
  let userIndex = 1;

  for (const group of userGroups) {
    for (let i = 0; i < group.count; i++) {
      const email = `seeduser${userIndex}@musicapp.vn`;
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            passwordHash: userPassword,
            role: 'user',
            displayName: `Seed User ${userIndex} (${group.label})`,
            isVerified: true,
            isActive: true,
          },
        });
      }
      seedUsers.push(user);
      usersWithPlays.push({
        userId: user.id,
        targetPlays: randomInt(group.minPlays, group.maxPlays),
      });
      userIndex++;
    }
  }
  console.log(`✅ Created ${seedUsers.length} seed users`);

  // 7. UserPreferences
  console.log('\n🎯 Creating user preferences...');
  let prefCount = 0;
  for (const user of seedUsers) {
    const count = randomInt(2, 4);
    const picked = [...genreIds].sort(() => Math.random() - 0.5).slice(0, count);
    for (const genreId of picked) {
      const exists = await prisma.userPreference.findFirst({ where: { userId: user.id, genreId } });
      if (!exists) {
        await prisma.userPreference.create({ data: { userId: user.id, genreId, weight: 1.0 } });
        prefCount++;
      }
    }
  }
  console.log(`✅ Created ${prefCount} user preferences`);

  // 8. PlayHistory
  console.log('\n▶️  Creating play history...');
  let playCount = 0;
  for (const { userId, targetPlays } of usersWithPlays) {
    const picked = [...songIds].sort(() => Math.random() - 0.5).slice(0, targetPlays);
    for (const songId of picked) {
      const completionRate = parseFloat(randomFloat(0.1, 1.0).toFixed(2));
      await prisma.playHistory.create({
        data: {
          userId,
          songId,
          playedAt: randomDateInPast(90),
          durationPlayed: randomInt(30, 300),
          completionRate,
        },
      });
      playCount++;
    }
  }
  console.log(`✅ Created ${playCount} play history records`);

  // 9. UserBehaviors
  console.log('\n👍 Creating user behaviors...');
  let behaviorCount = 0;
  for (const { userId, targetPlays } of usersWithPlays) {
    const count = Math.floor(targetPlays * 0.6);
    const picked = [...songIds].sort(() => Math.random() - 0.5).slice(0, count);
    for (const songId of picked) {
      const exists = await prisma.userBehavior.findFirst({ where: { userId, songId } });
      if (!exists) {
        const rand = Math.random();
        const action = rand < 0.5 ? 'like' : rand < 0.7 ? 'dislike' : 'skip';
        await prisma.userBehavior.create({
          data: { userId, songId, action, createdAt: randomDateInPast(90) },
        });
        behaviorCount++;
      }
    }
  }
  console.log(`✅ Created ${behaviorCount} user behavior records`);

  // 10. Update playCount
  console.log('\n🔢 Updating song play counts...');
  const playCounts = await prisma.playHistory.groupBy({
    by: ['songId'],
    _count: { songId: true },
  });
  for (const { songId, _count } of playCounts) {
    await prisma.song.update({ where: { id: songId }, data: { playCount: _count.songId } });
  }
  console.log(`✅ Updated play counts for ${playCounts.length} songs`);

  // Summary
  console.log('\n' + '─'.repeat(45));
  console.log('✅ Jamendo seed complete!');
  console.log('─'.repeat(45));
  console.log(`  Artists (1 per song) : ${successCount}`);
  console.log(`  Albums               : ${successCount}`);
  console.log(`  Songs (on S3)        : ${successCount}`);
  console.log(`  Songs skipped        : ${failCount}`);
  console.log(`  Seed users           : ${seedUsers.length}`);
  console.log(`  Play history         : ${playCount}`);
  console.log(`  User behaviors       : ${behaviorCount}`);
  console.log('─'.repeat(45));
  console.log('\nSeed user credentials:');
  console.log('  Email    : seeduser1@musicapp.vn ... seeduser20@musicapp.vn');
  console.log('  Password : User@123456');
  console.log('\nArtist credentials (per song):');
  console.log('  Email    : artist_{jamendo_track_id}@jamendo.seed');
  console.log('  Password : Artist@123456');
}

main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
