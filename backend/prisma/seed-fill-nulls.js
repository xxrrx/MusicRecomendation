'use strict';

/**
 * seed-fill-nulls.js
 * Điền dữ liệu bpm và year cho các bài hát đang null.
 *
 * Chạy: node prisma/seed-fill-nulls.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// BPM hợp lý theo genre slug
const BPM_BY_GENRE = {
  'v-pop':       [90,  130],
  'pop':         [90,  130],
  'indie':       [80,  130],
  'rock':        [110, 160],
  'electronic':  [120, 145],
  'jazz':        [60,  120],
  'classical':   [50,  120],
  'folk':        [70,  110],
  'hip-hop':     [75,  115],
  'r-and-b':     [70,  110],
  'ballad':      [55,   90],
};

function bpmForGenre(genreSlug) {
  const range = BPM_BY_GENRE[genreSlug] || [75, 140];
  return randomInt(range[0], range[1]);
}

async function main() {
  console.log('🌱 Filling null bpm / year for songs...\n');

  // Lấy tất cả song bị null bpm hoặc null year, kèm genre và album
  const songs = await prisma.song.findMany({
    where: {
      OR: [{ bpm: null }, { year: null }],
    },
    select: {
      id: true,
      bpm: true,
      year: true,
      genre: { select: { slug: true } },
      album: { select: { year: true } },
      uploadedAt: true,
    },
  });

  console.log(`Found ${songs.length} songs with null bpm or year.\n`);

  if (songs.length === 0) {
    console.log('Nothing to update.');
    return;
  }

  let updated = 0;
  for (const song of songs) {
    const data = {};

    if (song.bpm === null) {
      data.bpm = bpmForGenre(song.genre?.slug ?? null);
    }

    if (song.year === null) {
      // Ưu tiên year từ album, rồi mới random
      if (song.album?.year) {
        data.year = song.album.year;
      } else {
        // Random trong khoảng hợp lý dựa trên uploadedAt
        const maxYear = Math.min(
          new Date(song.uploadedAt).getFullYear(),
          2025
        );
        data.year = randomInt(2010, maxYear);
      }
    }

    await prisma.song.update({ where: { id: song.id }, data });
    updated++;

    if (updated % 50 === 0) {
      process.stdout.write(`  Updated ${updated}/${songs.length}\r`);
    }
  }

  console.log(`\n✅ Done! Updated ${updated} songs.`);

  // Summary
  const remaining = await prisma.song.count({
    where: { OR: [{ bpm: null }, { year: null }] },
  });
  console.log(`Songs still null: ${remaining}`);
}

main()
  .catch((e) => { console.error('\n❌ Error:', e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
