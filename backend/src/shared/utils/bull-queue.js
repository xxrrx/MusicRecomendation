const Bull = require('bull');
const env = require('../config/env');

// ─── Queue definitions ────────────────────────────────────────────────────────

const playCountQueue = new Bull('playCount', env.REDIS_URL);
const chartQueue = new Bull('charts', env.REDIS_URL);

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

// ─── Processor: recompute charts ──────────────────────────────────────────────

chartQueue.process(async (job) => {
  const { computeAndCacheChart } = require('../../modules/charts/charts.service');
  const { type } = job.data;
  await computeAndCacheChart(type);
  console.log(`[chartQueue] Recomputed ${type} chart`);
});

chartQueue.on('failed', (job, err) => {
  console.error(`[chartQueue] Job ${job.id} failed:`, err.message);
});

// ─── Cron jobs: recompute charts on schedule ──────────────────────────────────

// Daily chart: every day at midnight
chartQueue.add({ type: 'daily' }, { repeat: { cron: '0 0 * * *' }, jobId: 'daily-chart' });
// Weekly chart: every Monday at midnight
chartQueue.add({ type: 'weekly' }, { repeat: { cron: '0 0 * * 1' }, jobId: 'weekly-chart' });
// Monthly chart: 1st of every month at midnight
chartQueue.add({ type: 'monthly' }, { repeat: { cron: '0 0 1 * *' }, jobId: 'monthly-chart' });

module.exports = { playCountQueue, chartQueue };
