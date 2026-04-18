const prisma = require('../../shared/config/database');
const { createError } = require('../../shared/utils/response.helper');
const { sendSongReviewEmail } = require('../../shared/utils/email.helper');

// ─── Shared select ────────────────────────────────────────────────────────────

const pendingSongSelect = {
  id: true,
  title: true,
  duration: true,
  fileUrl: true,
  coverUrl: true,
  status: true,
  rejectionReason: true,
  uploadedAt: true,
  artist: {
    select: {
      id: true,
      user: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
    },
  },
  genre: { select: { id: true, name: true } },
  album: { select: { id: true, title: true } },
};

// ─── Pending songs ────────────────────────────────────────────────────────────

async function getPendingSongs({ page = 1, limit = 20 } = {}) {
  const take = Math.min(Number(limit), 50);
  const skip = (Number(page) - 1) * take;

  const [songs, total] = await Promise.all([
    prisma.song.findMany({
      where: { status: 'pending' },
      select: pendingSongSelect,
      orderBy: { uploadedAt: 'asc' },
      skip,
      take,
    }),
    prisma.song.count({ where: { status: 'pending' } }),
  ]);

  return {
    songs,
    pagination: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) },
  };
}

// ─── Review song ──────────────────────────────────────────────────────────────

async function reviewSong(adminId, songId, { action, reason }) {
  if (!['approved', 'rejected'].includes(action)) {
    throw createError('Action must be approved or rejected', 400, 'INVALID_ACTION');
  }
  if (action === 'rejected' && !reason) {
    throw createError('Reason is required when rejecting', 400, 'MISSING_REASON');
  }

  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: {
      id: true,
      title: true,
      status: true,
      artist: { select: { user: { select: { email: true } } } },
    },
  });
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');
  if (song.status !== 'pending') throw createError('Song is not pending review', 400, 'INVALID_STATUS');

  const newStatus = action === 'approved' ? 'published' : 'rejected';

  const [updatedSong] = await prisma.$transaction([
    prisma.song.update({
      where: { id: songId },
      data: {
        status: newStatus,
        rejectionReason: action === 'rejected' ? reason : null,
        publishedAt: action === 'approved' ? new Date() : null,
      },
      select: { id: true, title: true, status: true, publishedAt: true, rejectionReason: true },
    }),
    prisma.songApprovalLog.create({
      data: { songId, adminId, action, reason: reason || null },
    }),
  ]);

  // Notify artist async
  sendSongReviewEmail(song.artist.user.email, song.title, action, reason).catch(() => {});

  return updatedSong;
}

// ─── Users ────────────────────────────────────────────────────────────────────

async function getUsers({ page = 1, limit = 20, role, search } = {}) {
  const take = Math.min(Number(limit), 50);
  const skip = (Number(page) - 1) * take;

  const where = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { displayName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, pagination: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) } };
}

async function updateUserStatus(userId, { isActive }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!user) throw createError('User not found', 404, 'NOT_FOUND');
  if (user.role === 'admin') throw createError('Cannot modify admin users', 400, 'INVALID_OPERATION');

  return prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: { id: true, email: true, displayName: true, role: true, isActive: true },
  });
}

// ─── Delete song (hard) ───────────────────────────────────────────────────────

async function deleteSong(songId) {
  const song = await prisma.song.findUnique({ where: { id: songId }, select: { id: true } });
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');

  await prisma.$transaction([
    prisma.songApprovalLog.deleteMany({ where: { songId } }),
    prisma.song.delete({ where: { id: songId } }),
  ]);
}

// ─── Platform stats ───────────────────────────────────────────────────────────

async function getStats() {
  const [userCount, songCount, pendingCount, artistCount] = await Promise.all([
    prisma.user.count(),
    prisma.song.count({ where: { status: 'published' } }),
    prisma.song.count({ where: { status: 'pending' } }),
    prisma.artist.count(),
  ]);

  return { userCount, songCount, pendingCount, artistCount };
}

module.exports = { getPendingSongs, reviewSong, getUsers, updateUserStatus, deleteSong, getStats };
