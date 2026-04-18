const { v4: uuidv4 } = require('uuid');
const prisma = require('../../shared/config/database');
const { createError } = require('../../shared/utils/response.helper');
const { uploadToS3, deleteFromS3 } = require('../../shared/utils/s3.helper');
const { sendSongPendingEmail } = require('../../shared/utils/email.helper');

// ─── Helper: get artist by userId ─────────────────────────────────────────────

async function getArtistByUserId(userId) {
  const artist = await prisma.artist.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!artist) throw createError('Artist profile not found', 404, 'NOT_FOUND');
  return artist;
}

// ─── Shared select ────────────────────────────────────────────────────────────

const mySongSelect = {
  id: true,
  title: true,
  duration: true,
  bpm: true,
  mood: true,
  key: true,
  year: true,
  fileUrl: true,
  coverUrl: true,
  lyricsUrl: true,
  playCount: true,
  status: true,
  rejectionReason: true,
  uploadedAt: true,
  publishedAt: true,
  album: { select: { id: true, title: true } },
  genre: { select: { id: true, name: true } },
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

async function getMyDashboard(userId) {
  const artist = await prisma.artist.findUnique({
    where: { userId },
    select: {
      id: true,
      bio: true,
      totalEarnings: true,
      user: { select: { displayName: true, avatarUrl: true, email: true } },
      _count: { select: { followers: true, songs: true } },
    },
  });
  if (!artist) throw createError('Artist profile not found', 404, 'NOT_FOUND');

  const [playCountAgg, songsByStatus] = await Promise.all([
    prisma.song.aggregate({
      where: { artistId: artist.id },
      _sum: { playCount: true },
    }),
    prisma.song.groupBy({
      by: ['status'],
      where: { artistId: artist.id },
      _count: { id: true },
    }),
  ]);

  const statusCounts = { pending: 0, published: 0, rejected: 0 };
  songsByStatus.forEach(({ status, _count }) => {
    statusCounts[status] = _count.id;
  });

  return {
    id: artist.id,
    displayName: artist.user.displayName,
    avatarUrl: artist.user.avatarUrl,
    email: artist.user.email,
    bio: artist.bio,
    totalEarnings: Number(artist.totalEarnings),
    followerCount: artist._count.followers,
    totalSongs: artist._count.songs,
    totalPlayCount: playCountAgg._sum.playCount || 0,
    songsByStatus: statusCounts,
  };
}

// ─── List my songs ────────────────────────────────────────────────────────────

async function getMySongs(userId, { page = 1, limit = 20, status } = {}) {
  const artist = await getArtistByUserId(userId);
  const take = Math.min(Number(limit), 50);
  const skip = (Number(page) - 1) * take;
  const where = { artistId: artist.id };
  if (status) where.status = status;

  const [songs, total] = await Promise.all([
    prisma.song.findMany({ where, select: mySongSelect, orderBy: { uploadedAt: 'desc' }, skip, take }),
    prisma.song.count({ where }),
  ]);

  return {
    songs,
    pagination: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) },
  };
}

// ─── Get one song ─────────────────────────────────────────────────────────────

async function getMySongById(userId, songId) {
  const artist = await getArtistByUserId(userId);
  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: { ...mySongSelect, artistId: true },
  });
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');
  if (song.artistId !== artist.id) throw createError('Forbidden', 403, 'FORBIDDEN');
  const { artistId: _removed, ...rest } = song;
  return rest;
}

// ─── Upload song ──────────────────────────────────────────────────────────────

async function createSong(userId, data, files = {}) {
  const artist = await getArtistByUserId(userId);

  if (!files.audio) throw createError('Audio file is required', 400, 'MISSING_AUDIO');

  const audioKey = `audio/${uuidv4()}.mp3`;
  await uploadToS3(audioKey, files.audio.buffer, files.audio.mimetype);

  let coverKey = null;
  if (files.cover) {
    const ext = files.cover.originalname.split('.').pop();
    coverKey = `covers/${uuidv4()}.${ext}`;
    await uploadToS3(coverKey, files.cover.buffer, files.cover.mimetype);
  }

  const song = await prisma.song.create({
    data: {
      title: data.title,
      artistId: artist.id,
      albumId: data.albumId || null,
      genreId: data.genreId || null,
      duration: Number(data.duration),
      bpm: data.bpm ? Number(data.bpm) : null,
      mood: data.mood || null,
      key: data.key || null,
      year: data.year ? Number(data.year) : null,
      fileUrl: audioKey,
      coverUrl: coverKey,
      lyricsUrl: data.lyricsUrl || null,
      status: 'pending',
    },
    select: mySongSelect,
  });

  // Notify admins async (fire-and-forget)
  _notifyAdminsNewSong(song.title, artist.id).catch(() => {});

  return song;
}

async function _notifyAdminsNewSong(songTitle, artistId) {
  const admins = await prisma.user.findMany({ where: { role: 'admin' }, select: { email: true } });
  const artistRecord = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { user: { select: { displayName: true } } },
  });
  const artistName = artistRecord?.user?.displayName || 'Unknown';
  await Promise.all(admins.map((a) => sendSongPendingEmail(a.email, songTitle, artistName)));
}

// ─── Update song ──────────────────────────────────────────────────────────────

async function updateSong(userId, songId, data) {
  const artist = await getArtistByUserId(userId);
  const song = await prisma.song.findUnique({ where: { id: songId }, select: { artistId: true } });
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');
  if (song.artistId !== artist.id) throw createError('Forbidden', 403, 'FORBIDDEN');

  const allowed = ['title', 'albumId', 'genreId', 'bpm', 'mood', 'key', 'year', 'lyricsUrl'];
  const updateData = {};
  allowed.forEach((field) => {
    if (data[field] !== undefined) updateData[field] = data[field];
  });

  return prisma.song.update({ where: { id: songId }, data: updateData, select: mySongSelect });
}

// ─── Delete song ──────────────────────────────────────────────────────────────

async function deleteSong(userId, songId) {
  const artist = await getArtistByUserId(userId);
  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: { artistId: true, status: true, fileUrl: true, coverUrl: true },
  });
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');
  if (song.artistId !== artist.id) throw createError('Forbidden', 403, 'FORBIDDEN');
  if (song.status === 'published') {
    throw createError('Cannot delete a published song', 400, 'INVALID_STATUS');
  }

  if (song.fileUrl) deleteFromS3(song.fileUrl).catch(() => {});
  if (song.coverUrl) deleteFromS3(song.coverUrl).catch(() => {});

  await prisma.song.delete({ where: { id: songId } });
}

// ─── Albums ───────────────────────────────────────────────────────────────────

async function createAlbum(userId, data, coverFile) {
  const artist = await getArtistByUserId(userId);

  let coverKey = null;
  if (coverFile) {
    const ext = coverFile.originalname.split('.').pop();
    coverKey = `covers/album-${uuidv4()}.${ext}`;
    await uploadToS3(coverKey, coverFile.buffer, coverFile.mimetype);
  }

  return prisma.album.create({
    data: {
      title: data.title,
      artistId: artist.id,
      coverUrl: coverKey,
      year: data.year ? Number(data.year) : null,
    },
    select: { id: true, title: true, coverUrl: true, year: true, createdAt: true },
  });
}

async function getMyAlbums(userId) {
  const artist = await getArtistByUserId(userId);
  return prisma.album.findMany({
    where: { artistId: artist.id },
    select: {
      id: true,
      title: true,
      coverUrl: true,
      year: true,
      createdAt: true,
      _count: { select: { songs: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = {
  getMyDashboard,
  getMySongs,
  getMySongById,
  createSong,
  updateSong,
  deleteSong,
  createAlbum,
  getMyAlbums,
};
