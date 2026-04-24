const prisma = require('../../shared/config/database');
const { createError } = require('../../shared/utils/response.helper');

// ─── Shared selects ───────────────────────────────────────────────────────────

const adminSongSelect = {
  id: true,
  title: true,
  duration: true,
  fileUrl: true,
  coverUrl: true,
  lyricsUrl: true,
  playCount: true,
  status: true,
  rejectionReason: true,
  bpm: true,
  mood: true,
  key: true,
  year: true,
  uploadedAt: true,
  publishedAt: true,
  artist: { select: { id: true, user: { select: { id: true, displayName: true, avatarUrl: true } } } },
  genre: { select: { id: true, name: true } },
  album: { select: { id: true, title: true } },
};

const artistListSelect = {
  id: true,
  bio: true,
  totalEarnings: true,
  createdAt: true,
  user: { select: { id: true, displayName: true, email: true, avatarUrl: true, isActive: true } },
  _count: { select: { songs: true, followers: true, albums: true } },
};

const albumSelect = {
  id: true,
  title: true,
  coverUrl: true,
  year: true,
  createdAt: true,
  artist: { select: { id: true, user: { select: { displayName: true } } } },
  _count: { select: { songs: true } },
};

const playlistAdminSelect = {
  id: true,
  title: true,
  coverUrl: true,
  isSystem: true,
  chartType: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { songs: true } },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SONG MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

async function getAllSongs({ page = 1, limit = 20, status, search, artistId } = {}) {
  const take = Math.min(Number(limit), 50);
  const skip = (Number(page) - 1) * take;

  const where = {};
  if (status) where.status = status;
  if (artistId) where.artistId = artistId;
  if (search) where.title = { contains: search, mode: 'insensitive' };

  const [songs, total] = await Promise.all([
    prisma.song.findMany({ where, select: adminSongSelect, orderBy: { uploadedAt: 'desc' }, skip, take }),
    prisma.song.count({ where }),
  ]);

  return { songs, pagination: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) } };
}

async function getSongDetail(songId) {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: {
      ...adminSongSelect,
      approvalLogs: {
        select: { id: true, action: true, reason: true, createdAt: true, adminId: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');
  return song;
}

async function updateSongMetadata(songId, data) {
  const song = await prisma.song.findUnique({ where: { id: songId }, select: { id: true } });
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');

  const allowed = ['title', 'albumId', 'genreId', 'bpm', 'mood', 'key', 'year', 'lyricsUrl', 'status'];
  const updateData = {};
  allowed.forEach((f) => { if (data[f] !== undefined) updateData[f] = data[f]; });

  if (updateData.status === 'published') updateData.publishedAt = new Date();
  if (updateData.status === 'rejected' || updateData.status === 'pending') updateData.publishedAt = null;

  return prisma.song.update({ where: { id: songId }, data: updateData, select: adminSongSelect });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARTIST MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

async function getArtistsList({ page = 1, limit = 20, search } = {}) {
  const take = Math.min(Number(limit), 50);
  const skip = (Number(page) - 1) * take;

  const where = {};
  if (search) {
    where.user = {
      OR: [
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  const [artists, total] = await Promise.all([
    prisma.artist.findMany({ where, select: artistListSelect, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.artist.count({ where }),
  ]);

  return {
    artists: artists.map((a) => ({ ...a, totalEarnings: Number(a.totalEarnings) })),
    pagination: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) },
  };
}

async function promoteToArtist(userId, { bio = null } = {}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, artist: { select: { id: true } } },
  });
  if (!user) throw createError('User not found', 404, 'NOT_FOUND');
  if (user.artist) throw createError('User is already an artist', 409, 'ALREADY_ARTIST');

  const [, artist] = await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { role: 'artist' } }),
    prisma.artist.create({ data: { userId, bio }, select: artistListSelect }),
  ]);

  return { ...artist, totalEarnings: Number(artist.totalEarnings) };
}

async function updateArtistProfile(artistId, data) {
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { id: true, userId: true },
  });
  if (!artist) throw createError('Artist not found', 404, 'NOT_FOUND');

  await prisma.$transaction([
    ...(data.bio !== undefined
      ? [prisma.artist.update({ where: { id: artistId }, data: { bio: data.bio } })]
      : []),
    ...(data.displayName !== undefined
      ? [prisma.user.update({ where: { id: artist.userId }, data: { displayName: data.displayName } })]
      : []),
  ]);

  const updated = await prisma.artist.findUnique({ where: { id: artistId }, select: artistListSelect });
  return { ...updated, totalEarnings: Number(updated.totalEarnings) };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALBUM MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

async function getAlbumsList({ page = 1, limit = 20, search, artistId } = {}) {
  const take = Math.min(Number(limit), 50);
  const skip = (Number(page) - 1) * take;

  const where = {};
  if (artistId) where.artistId = artistId;
  if (search) where.title = { contains: search, mode: 'insensitive' };

  const [albums, total] = await Promise.all([
    prisma.album.findMany({ where, select: albumSelect, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.album.count({ where }),
  ]);

  return { albums, pagination: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) } };
}

async function createAlbumAdmin({ title, artistId, year, coverUrl }) {
  const artist = await prisma.artist.findUnique({ where: { id: artistId }, select: { id: true } });
  if (!artist) throw createError('Artist not found', 404, 'NOT_FOUND');

  return prisma.album.create({
    data: { title, artistId, year: year ? Number(year) : null, coverUrl: coverUrl || null },
    select: albumSelect,
  });
}

async function updateAlbumAdmin(albumId, data) {
  const album = await prisma.album.findUnique({ where: { id: albumId }, select: { id: true } });
  if (!album) throw createError('Album not found', 404, 'NOT_FOUND');

  const allowed = ['title', 'year', 'coverUrl'];
  const updateData = {};
  allowed.forEach((f) => { if (data[f] !== undefined) updateData[f] = data[f]; });

  return prisma.album.update({ where: { id: albumId }, data: updateData, select: albumSelect });
}

async function deleteAlbumAdmin(albumId) {
  const album = await prisma.album.findUnique({ where: { id: albumId }, select: { id: true } });
  if (!album) throw createError('Album not found', 404, 'NOT_FOUND');

  await prisma.song.updateMany({ where: { albumId }, data: { albumId: null } });
  await prisma.album.delete({ where: { id: albumId } });
}

async function getAlbumWithSongs(albumId) {
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    select: {
      ...albumSelect,
      songs: {
        select: {
          id: true, title: true, duration: true, status: true, playCount: true, coverUrl: true,
        },
        orderBy: { title: 'asc' },
      },
    },
  });
  if (!album) throw createError('Album not found', 404, 'NOT_FOUND');
  return album;
}

async function addSongToAlbum(albumId, songId) {
  const [album, song] = await Promise.all([
    prisma.album.findUnique({ where: { id: albumId }, select: { id: true, artistId: true } }),
    prisma.song.findUnique({ where: { id: songId }, select: { id: true, artistId: true } }),
  ]);
  if (!album) throw createError('Album not found', 404, 'NOT_FOUND');
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');
  if (song.artistId !== album.artistId) {
    throw createError('Song and album must belong to the same artist', 400, 'ARTIST_MISMATCH');
  }

  return prisma.song.update({
    where: { id: songId },
    data: { albumId },
    select: { id: true, title: true },
  });
}

async function removeSongFromAlbum(albumId, songId) {
  const song = await prisma.song.findUnique({ where: { id: songId }, select: { id: true, albumId: true } });
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');
  if (song.albumId !== albumId) throw createError('Song is not in this album', 400, 'NOT_IN_ALBUM');

  return prisma.song.update({ where: { id: songId }, data: { albumId: null }, select: { id: true, title: true } });
}

// ═══════════════════════════════════════════════════════════════════════════════
// OFFICIAL PLAYLIST MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

async function getOfficialPlaylists({ page = 1, limit = 20 } = {}) {
  const take = Math.min(Number(limit), 50);
  const skip = (Number(page) - 1) * take;
  const where = { userId: null, isSystem: false };

  const [playlists, total] = await Promise.all([
    prisma.playlist.findMany({ where, select: playlistAdminSelect, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.playlist.count({ where }),
  ]);

  return { playlists, pagination: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) } };
}

async function createOfficialPlaylist({ title, coverUrl }) {
  return prisma.playlist.create({
    data: { title, coverUrl: coverUrl || null, isSystem: false, userId: null },
    select: playlistAdminSelect,
  });
}

async function updateOfficialPlaylist(playlistId, data) {
  const pl = await prisma.playlist.findUnique({ where: { id: playlistId }, select: { id: true, userId: true } });
  if (!pl) throw createError('Playlist not found', 404, 'NOT_FOUND');
  if (pl.userId !== null) throw createError('Cannot edit user playlists', 400, 'INVALID_OPERATION');

  const allowed = ['title', 'coverUrl'];
  const updateData = {};
  allowed.forEach((f) => { if (data[f] !== undefined) updateData[f] = data[f]; });

  return prisma.playlist.update({ where: { id: playlistId }, data: updateData, select: playlistAdminSelect });
}

async function deleteOfficialPlaylist(playlistId) {
  const pl = await prisma.playlist.findUnique({ where: { id: playlistId }, select: { id: true, userId: true } });
  if (!pl) throw createError('Playlist not found', 404, 'NOT_FOUND');
  if (pl.userId !== null) throw createError('Cannot delete user playlists', 400, 'INVALID_OPERATION');

  await prisma.$transaction([
    prisma.playlistSong.deleteMany({ where: { playlistId } }),
    prisma.playlist.delete({ where: { id: playlistId } }),
  ]);
}

async function getPlaylistWithSongs(playlistId) {
  const pl = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: {
      ...playlistAdminSelect,
      songs: {
        select: {
          position: true,
          song: {
            select: {
              id: true, title: true, duration: true, coverUrl: true, status: true,
              artist: { select: { id: true, user: { select: { displayName: true } } } },
            },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });
  if (!pl) throw createError('Playlist not found', 404, 'NOT_FOUND');
  return pl;
}

async function addSongToPlaylist(playlistId, songId) {
  const [pl, song] = await Promise.all([
    prisma.playlist.findUnique({ where: { id: playlistId }, select: { id: true, userId: true } }),
    prisma.song.findUnique({ where: { id: songId }, select: { id: true } }),
  ]);
  if (!pl) throw createError('Playlist not found', 404, 'NOT_FOUND');
  if (pl.userId !== null) throw createError('Cannot modify user playlists', 400, 'INVALID_OPERATION');
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');

  const existing = await prisma.playlistSong.findUnique({
    where: { playlistId_songId: { playlistId, songId } },
  });
  if (existing) throw createError('Song already in playlist', 409, 'ALREADY_EXISTS');

  const maxPos = await prisma.playlistSong.aggregate({ where: { playlistId }, _max: { position: true } });
  const position = (maxPos._max.position ?? 0) + 1;

  return prisma.playlistSong.create({ data: { playlistId, songId, position } });
}

async function removeSongFromPlaylist(playlistId, songId) {
  const entry = await prisma.playlistSong.findUnique({
    where: { playlistId_songId: { playlistId, songId } },
  });
  if (!entry) throw createError('Song not in playlist', 404, 'NOT_FOUND');
  await prisma.playlistSong.delete({ where: { playlistId_songId: { playlistId, songId } } });
}

module.exports = {
  // Songs
  getAllSongs, getSongDetail, updateSongMetadata,
  // Artists
  getArtistsList, promoteToArtist, updateArtistProfile,
  // Albums
  getAlbumsList, createAlbumAdmin, updateAlbumAdmin, deleteAlbumAdmin, getAlbumWithSongs, addSongToAlbum, removeSongFromAlbum,
  // Playlists
  getOfficialPlaylists, createOfficialPlaylist, updateOfficialPlaylist, deleteOfficialPlaylist, getPlaylistWithSongs, addSongToPlaylist, removeSongFromPlaylist,
};
