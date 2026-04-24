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

async function getMyAlbumDetail(userId, albumId) {
  const artist = await getArtistByUserId(userId);
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    select: {
      id: true,
      title: true,
      coverUrl: true,
      year: true,
      createdAt: true,
      artistId: true,
      songs: { select: mySongSelect, orderBy: { uploadedAt: 'asc' } },
    },
  });
  if (!album) throw createError('Album not found', 404, 'NOT_FOUND');
  if (album.artistId !== artist.id) throw createError('Forbidden', 403, 'FORBIDDEN');
  const { artistId: _removed, ...rest } = album;
  return rest;
}

async function updateMyAlbum(userId, albumId, data, coverFile) {
  const artist = await getArtistByUserId(userId);
  const album = await prisma.album.findUnique({ where: { id: albumId }, select: { artistId: true, coverUrl: true } });
  if (!album) throw createError('Album not found', 404, 'NOT_FOUND');
  if (album.artistId !== artist.id) throw createError('Forbidden', 403, 'FORBIDDEN');

  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.year !== undefined) updateData.year = data.year ? Number(data.year) : null;

  if (coverFile) {
    if (album.coverUrl) deleteFromS3(album.coverUrl).catch(() => {});
    const ext = coverFile.originalname.split('.').pop();
    const coverKey = `covers/album-${uuidv4()}.${ext}`;
    await uploadToS3(coverKey, coverFile.buffer, coverFile.mimetype);
    updateData.coverUrl = coverKey;
  }

  return prisma.album.update({
    where: { id: albumId },
    data: updateData,
    select: { id: true, title: true, coverUrl: true, year: true, createdAt: true },
  });
}

async function deleteMyAlbum(userId, albumId) {
  const artist = await getArtistByUserId(userId);
  const album = await prisma.album.findUnique({ where: { id: albumId }, select: { artistId: true, coverUrl: true } });
  if (!album) throw createError('Album not found', 404, 'NOT_FOUND');
  if (album.artistId !== artist.id) throw createError('Forbidden', 403, 'FORBIDDEN');

  await prisma.song.updateMany({ where: { albumId }, data: { albumId: null } });
  if (album.coverUrl) deleteFromS3(album.coverUrl).catch(() => {});
  await prisma.album.delete({ where: { id: albumId } });
}

async function addSongToMyAlbum(userId, albumId, songId) {
  const artist = await getArtistByUserId(userId);
  const album = await prisma.album.findUnique({ where: { id: albumId }, select: { artistId: true } });
  if (!album) throw createError('Album not found', 404, 'NOT_FOUND');
  if (album.artistId !== artist.id) throw createError('Forbidden', 403, 'FORBIDDEN');

  const song = await prisma.song.findUnique({ where: { id: songId }, select: { artistId: true } });
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');
  if (song.artistId !== artist.id) throw createError('Forbidden', 403, 'FORBIDDEN');

  return prisma.song.update({ where: { id: songId }, data: { albumId }, select: mySongSelect });
}

async function removeSongFromMyAlbum(userId, albumId, songId) {
  const artist = await getArtistByUserId(userId);
  const album = await prisma.album.findUnique({ where: { id: albumId }, select: { artistId: true } });
  if (!album) throw createError('Album not found', 404, 'NOT_FOUND');
  if (album.artistId !== artist.id) throw createError('Forbidden', 403, 'FORBIDDEN');

  const song = await prisma.song.findUnique({ where: { id: songId }, select: { artistId: true, albumId: true } });
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');
  if (song.artistId !== artist.id) throw createError('Forbidden', 403, 'FORBIDDEN');
  if (song.albumId !== albumId) throw createError('Song not in this album', 400, 'INVALID');

  return prisma.song.update({ where: { id: songId }, data: { albumId: null }, select: mySongSelect });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

async function getMyPlaysOverTime(userId, { days = 30 } = {}) {
  const artist = await getArtistByUserId(userId);
  const since = new Date();
  since.setDate(since.getDate() - Number(days));

  const rows = await prisma.$queryRaw`
    SELECT DATE_TRUNC('day', ph."playedAt") AS date, COUNT(*) AS count
    FROM "PlayHistory" ph
    JOIN "Song" s ON s.id = ph."songId"
    WHERE s."artistId" = ${artist.id}
      AND ph."playedAt" >= ${since}
    GROUP BY DATE_TRUNC('day', ph."playedAt")
    ORDER BY date ASC
  `;

  return rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    count: Number(r.count),
  }));
}

async function getMyTopSongs(userId, { limit = 10 } = {}) {
  const artist = await getArtistByUserId(userId);
  const songs = await prisma.song.findMany({
    where: { artistId: artist.id, status: 'published' },
    select: { id: true, title: true, coverUrl: true, playCount: true, duration: true },
    orderBy: { playCount: 'desc' },
    take: Number(limit),
  });
  return songs.map((s, i) => ({ rank: i + 1, song: s, playCount: s.playCount }));
}

async function getMyRevenue(userId) {
  const artist = await getArtistByUserId(userId);

  const [totalAgg, byMonth, recent] = await Promise.all([
    prisma.donation.aggregate({
      where: { artistId: artist.id, status: 'success' },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "createdAt") AS month, SUM(amount) AS total, COUNT(*) AS count
      FROM "Donation"
      WHERE "artistId" = ${artist.id} AND status = 'success'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
      LIMIT 12
    `,
    prisma.donation.findMany({
      where: { artistId: artist.id, status: 'success' },
      select: {
        id: true,
        amount: true,
        currency: true,
        createdAt: true,
        user: { select: { displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return {
    totalRevenue: Number(totalAgg._sum.amount || 0),
    totalDonations: totalAgg._count.id,
    byMonth: byMonth.map((r) => ({
      month: r.month.toISOString().slice(0, 7),
      total: Number(r.total),
      count: Number(r.count),
    })),
    recent,
  };
}

// ─── Profile ──────────────────────────────────────────────────────────────────

async function updateMyProfile(userId, data, avatarFile) {
  const artist = await prisma.artist.findUnique({
    where: { userId },
    select: { id: true, user: { select: { avatarUrl: true } } },
  });
  if (!artist) throw createError('Artist profile not found', 404, 'NOT_FOUND');

  const userUpdate = {};
  if (data.displayName !== undefined) userUpdate.displayName = data.displayName;

  if (avatarFile) {
    if (artist.user.avatarUrl) deleteFromS3(artist.user.avatarUrl).catch(() => {});
    const ext = avatarFile.originalname.split('.').pop();
    const key = `avatars/${uuidv4()}.${ext}`;
    await uploadToS3(key, avatarFile.buffer, avatarFile.mimetype);
    userUpdate.avatarUrl = key;
  }

  const artistUpdate = {};
  if (data.bio !== undefined) artistUpdate.bio = data.bio;

  const [userResult] = await Promise.all([
    Object.keys(userUpdate).length
      ? prisma.user.update({ where: { id: userId }, data: userUpdate, select: { displayName: true, avatarUrl: true, email: true } })
      : prisma.user.findUnique({ where: { id: userId }, select: { displayName: true, avatarUrl: true, email: true } }),
    Object.keys(artistUpdate).length
      ? prisma.artist.update({ where: { id: artist.id }, data: artistUpdate })
      : Promise.resolve(),
  ]);

  return userResult;
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
  getMyAlbumDetail,
  updateMyAlbum,
  deleteMyAlbum,
  addSongToMyAlbum,
  removeSongFromMyAlbum,
  getMyPlaysOverTime,
  getMyTopSongs,
  getMyRevenue,
  updateMyProfile,
};
