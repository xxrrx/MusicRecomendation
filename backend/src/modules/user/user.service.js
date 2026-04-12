const prisma = require('../../shared/config/database');
const { createError } = require('../../shared/utils/response.helper');

function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw createError('User not found', 404, 'NOT_FOUND');
  return formatUser(user);
}

async function patchMe(userId, body) {
  const { displayName, avatarUrl, bio } = body;

  const updateData = {};
  if (displayName !== undefined) updateData.displayName = displayName;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

  const user = await prisma.user.update({ where: { id: userId }, data: updateData });

  // Update bio on Artist record if provided and user is an artist
  if (bio !== undefined && user.role === 'artist') {
    await prisma.artist.update({ where: { userId }, data: { bio } });
  }

  return formatUser(user);
}

async function saveOnboarding(userId, genreIds) {
  // Verify all genres exist
  const genres = await prisma.genre.findMany({ where: { id: { in: genreIds } } });
  if (genres.length !== genreIds.length) {
    throw createError('One or more genreIds are invalid', 422, 'VALIDATION_ERROR');
  }

  // Replace all preferences for this user
  await prisma.$transaction([
    prisma.userPreference.deleteMany({ where: { userId } }),
    ...genreIds.map((genreId) =>
      prisma.userPreference.create({ data: { userId, genreId, weight: 1.0 } })
    ),
  ]);

  return { message: 'Preferences saved' };
}

async function getHistory(userId, page, limit) {
  const skip = (page - 1) * limit;

  const [total, records] = await Promise.all([
    prisma.playHistory.count({ where: { userId } }),
    prisma.playHistory.findMany({
      where: { userId },
      orderBy: { playedAt: 'desc' },
      skip,
      take: limit,
      include: {
        song: {
          include: {
            artist: { include: { user: { select: { displayName: true, avatarUrl: true } } } },
          },
        },
      },
    }),
  ]);

  const data = records.map((h) => ({
    playedAt: h.playedAt,
    completionRate: h.completionRate,
    song: {
      id: h.song.id,
      title: h.song.title,
      coverUrl: h.song.coverUrl,
      duration: h.song.duration,
      artist: {
        id: h.song.artistId,
        displayName: h.song.artist.user.displayName,
        avatarUrl: h.song.artist.user.avatarUrl,
      },
    },
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = { getMe, patchMe, saveOnboarding, getHistory };
