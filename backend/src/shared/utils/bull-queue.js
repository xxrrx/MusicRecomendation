const Bull = require('bull');
const env = require('../config/env');

// ─── Queue definitions ────────────────────────────────────────────────────────

const playCountQueue = new Bull('playCount', env.REDIS_URL);

// ─── Processor: increment play_count ──────────────────────────────────────────

playCountQueue.process(async (job) => {
  const prisma = require('../config/database');
  const { songId } = job.data;
  await prisma.song.update({
    where: { id: songId },
    data: { playCount: { increment: 1 } },
  });
});

playCountQueue.on('failed', (job, err) => {
  console.error(`[playCountQueue] Job ${job.id} failed:`, err.message);
});

module.exports = { playCountQueue };
