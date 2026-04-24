const prisma = require('../../shared/config/database');

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

async function getAnalyticsOverview() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [playsThisMonth, playsThisWeek, newUsersThisMonth, revenueAgg] = await Promise.all([
    prisma.playHistory.count({ where: { playedAt: { gte: thirtyDaysAgo } } }),
    prisma.playHistory.count({ where: { playedAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.donation.aggregate({ where: { status: 'success' }, _sum: { amount: true } }),
  ]);

  return {
    playsThisMonth,
    playsThisWeek,
    newUsersThisMonth,
    totalRevenue: Number(revenueAgg._sum.amount || 0),
  };
}

async function getTopSongs({ limit = 10, period = 30 } = {}) {
  const since = new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000);

  const grouped = await prisma.playHistory.groupBy({
    by: ['songId'],
    where: { playedAt: { gte: since } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: Number(limit),
  });

  // Cold-start fallback
  if (!grouped.length) {
    const songs = await prisma.song.findMany({
      where: { status: 'published' },
      select: {
        id: true, title: true, playCount: true, coverUrl: true,
        artist: { select: { id: true, user: { select: { displayName: true } } } },
      },
      orderBy: { playCount: 'desc' },
      take: Number(limit),
    });
    return songs.map((s, i) => ({ rank: i + 1, song: s, playCount: s.playCount }));
  }

  const songIds = grouped.map((g) => g.songId);
  const songs = await prisma.song.findMany({
    where: { id: { in: songIds } },
    select: {
      id: true, title: true, playCount: true, coverUrl: true,
      artist: { select: { id: true, user: { select: { displayName: true } } } },
    },
  });
  const songMap = Object.fromEntries(songs.map((s) => [s.id, s]));

  return grouped
    .map((g, i) => ({ rank: i + 1, song: songMap[g.songId] || null, playCount: g._count.id }))
    .filter((r) => r.song);
}

async function getTopArtists({ limit = 10, period = 30 } = {}) {
  const since = new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000);

  const plays = await prisma.playHistory.groupBy({
    by: ['songId'],
    where: { playedAt: { gte: since } },
    _count: { id: true },
  });

  if (!plays.length) {
    const artists = await prisma.artist.findMany({
      select: {
        id: true,
        user: { select: { displayName: true, avatarUrl: true } },
        _count: { select: { followers: true } },
      },
      take: Number(limit),
    });
    return artists.map((a, i) => ({
      rank: i + 1,
      artist: { id: a.id, displayName: a.user.displayName, avatarUrl: a.user.avatarUrl, followerCount: a._count.followers },
      playCount: 0,
    }));
  }

  const songIds = plays.map((p) => p.songId);
  const songs = await prisma.song.findMany({ where: { id: { in: songIds } }, select: { id: true, artistId: true } });

  const artistPlayMap = {};
  songs.forEach((song) => {
    const entry = plays.find((p) => p.songId === song.id);
    if (!entry) return;
    artistPlayMap[song.artistId] = (artistPlayMap[song.artistId] || 0) + entry._count.id;
  });

  const topArtistIds = Object.entries(artistPlayMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, Number(limit))
    .map(([id]) => id);

  const artists = await prisma.artist.findMany({
    where: { id: { in: topArtistIds } },
    select: {
      id: true,
      user: { select: { displayName: true, avatarUrl: true } },
      _count: { select: { followers: true } },
    },
  });
  const artistMap = Object.fromEntries(artists.map((a) => [a.id, a]));

  return topArtistIds
    .map((id, i) => {
      const a = artistMap[id];
      if (!a) return null;
      return {
        rank: i + 1,
        artist: { id: a.id, displayName: a.user.displayName, avatarUrl: a.user.avatarUrl, followerCount: a._count.followers },
        playCount: artistPlayMap[id] || 0,
      };
    })
    .filter(Boolean);
}

async function getPlaysOverTime({ days = 30 } = {}) {
  const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC('day', "playedAt")::date::text AS day,
      COUNT(*)::int AS count
    FROM "PlayHistory"
    WHERE "playedAt" >= ${since}
    GROUP BY day
    ORDER BY day
  `;

  return rows.map((r) => ({ date: r.day, count: r.count }));
}

async function getNewUsersOverTime({ days = 30 } = {}) {
  const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC('day', "createdAt")::date::text AS day,
      COUNT(*)::int AS count
    FROM "User"
    WHERE "createdAt" >= ${since}
    GROUP BY day
    ORDER BY day
  `;

  return rows.map((r) => ({ date: r.day, count: r.count }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// DONATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const donationSelect = {
  id: true,
  amount: true,
  currency: true,
  paymentMethod: true,
  status: true,
  transactionId: true,
  createdAt: true,
  completedAt: true,
  user: { select: { id: true, displayName: true, email: true } },
  artist: { select: { id: true, user: { select: { displayName: true } } } },
};

async function getDonationsList({ page = 1, limit = 20, status } = {}) {
  const take = Math.min(Number(limit), 50);
  const skip = (Number(page) - 1) * take;
  const where = {};
  if (status) where.status = status;

  const [donations, total] = await Promise.all([
    prisma.donation.findMany({ where, select: donationSelect, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.donation.count({ where }),
  ]);

  return {
    donations: donations.map((d) => ({ ...d, amount: Number(d.amount) })),
    pagination: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) },
  };
}

async function getDonationStats() {
  const [totalAgg, byStatus, byMethod, topArtists] = await Promise.all([
    prisma.donation.aggregate({ where: { status: 'success' }, _sum: { amount: true }, _count: { id: true } }),
    prisma.donation.groupBy({ by: ['status'], _count: { id: true }, _sum: { amount: true } }),
    prisma.donation.groupBy({
      by: ['paymentMethod'],
      where: { status: 'success' },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.donation.groupBy({
      by: ['artistId'],
      where: { status: 'success' },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    }),
  ]);

  const topArtistIds = topArtists.map((t) => t.artistId);
  const artists = await prisma.artist.findMany({
    where: { id: { in: topArtistIds } },
    select: { id: true, user: { select: { displayName: true } } },
  });
  const artistMap = Object.fromEntries(artists.map((a) => [a.id, a.user.displayName]));

  return {
    totalRevenue: Number(totalAgg._sum.amount || 0),
    totalTransactions: totalAgg._count.id,
    byStatus: Object.fromEntries(
      byStatus.map((s) => [s.status, { count: s._count.id, amount: Number(s._sum.amount || 0) }])
    ),
    byMethod: Object.fromEntries(
      byMethod.map((m) => [m.paymentMethod, { count: m._count.id, amount: Number(m._sum.amount || 0) }])
    ),
    topArtists: topArtists.map((t) => ({
      artistId: t.artistId,
      name: artistMap[t.artistId] || 'Unknown',
      revenue: Number(t._sum.amount || 0),
    })),
  };
}

module.exports = {
  getAnalyticsOverview, getTopSongs, getTopArtists, getPlaysOverTime, getNewUsersOverTime,
  getDonationsList, getDonationStats,
};
