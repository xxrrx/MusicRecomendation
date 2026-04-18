const prisma = require('../../shared/config/database');
const redis = require('../../shared/config/redis');
const { createError } = require('../../shared/utils/response.helper');

// ─── Follow artist ─────────────────────────────────────────────────────────────

async function followArtist(userId, artistId) {
  const artist = await prisma.artist.findUnique({ where: { id: artistId }, select: { id: true } });
  if (!artist) throw createError('Artist not found', 404, 'NOT_FOUND');

  const existing = await prisma.followArtist.findUnique({
    where: { userId_artistId: { userId, artistId } },
  });
  if (existing) throw createError('Already following this artist', 409, 'CONFLICT');

  await prisma.followArtist.create({ data: { userId, artistId } });
  await redis.del(`artist:${artistId}`);
}

// ─── Unfollow artist ──────────────────────────────────────────────────────────

async function unfollowArtist(userId, artistId) {
  const existing = await prisma.followArtist.findUnique({
    where: { userId_artistId: { userId, artistId } },
  });
  if (!existing) throw createError('Not following this artist', 404, 'NOT_FOUND');

  await prisma.followArtist.delete({ where: { userId_artistId: { userId, artistId } } });
  await redis.del(`artist:${artistId}`);
}

// ─── Check follow status ──────────────────────────────────────────────────────

async function isFollowing(userId, artistId) {
  const existing = await prisma.followArtist.findUnique({
    where: { userId_artistId: { userId, artistId } },
    select: { userId: true },
  });
  return { following: !!existing };
}

// ─── Get following list ───────────────────────────────────────────────────────

async function getFollowing(userId, { page = 1, limit = 20 } = {}) {
  const take = Math.min(Number(limit), 50);
  const skip = (Number(page) - 1) * take;

  const [follows, total] = await Promise.all([
    prisma.followArtist.findMany({
      where: { userId },
      select: {
        createdAt: true,
        artist: {
          select: {
            id: true,
            bio: true,
            user: { select: { displayName: true, avatarUrl: true } },
            _count: { select: { followers: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.followArtist.count({ where: { userId } }),
  ]);

  const artists = follows.map((f) => ({
    id: f.artist.id,
    displayName: f.artist.user.displayName,
    avatarUrl: f.artist.user.avatarUrl,
    bio: f.artist.bio,
    followerCount: f.artist._count.followers,
    followedAt: f.createdAt,
  }));

  return {
    artists,
    pagination: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) },
  };
}

module.exports = { followArtist, unfollowArtist, isFollowing, getFollowing };
