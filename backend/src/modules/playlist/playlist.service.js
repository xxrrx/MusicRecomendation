const prisma = require('../../shared/config/database');
const { createError } = require('../../shared/utils/response.helper');

// ─── Shared selects ───────────────────────────────────────────────────────────

const songSelect = {
  id: true,
  title: true,
  duration: true,
  coverUrl: true,
  playCount: true,
  artist: { select: { id: true, user: { select: { displayName: true, avatarUrl: true } } } },
  album: { select: { id: true, title: true } },
  genre: { select: { id: true, name: true } },
};

function formatSong(song) {
  if (!song) return null;
  return {
    id: song.id,
    title: song.title,
    duration: song.duration,
    coverUrl: song.coverUrl,
    playCount: song.playCount,
    artist: song.artist
      ? { id: song.artist.id, displayName: song.artist.user.displayName, avatarUrl: song.artist.user.avatarUrl }
      : null,
    album: song.album || null,
    genre: song.genre || null,
  };
}

function formatPlaylist(playlist) {
  return {
    id: playlist.id,
    title: playlist.title,
    coverUrl: playlist.coverUrl || null,
    songCount: playlist.songs ? playlist.songs.length : playlist._count?.songs ?? 0,
    songs: playlist.songs
      ? playlist.songs.map((ps) => ({ ...formatSong(ps.song), position: ps.position, addedAt: ps.addedAt }))
      : undefined,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
  };
}

// ─── Get all playlists for user ───────────────────────────────────────────────

async function getUserPlaylists(userId) {
  const playlists = await prisma.playlist.findMany({
    where: { userId, isSystem: false },
    select: {
      id: true,
      title: true,
      coverUrl: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { songs: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return playlists.map(formatPlaylist);
}

// ─── Get single playlist ──────────────────────────────────────────────────────

async function getPlaylistById(userId, playlistId) {
  const playlist = await prisma.playlist.findFirst({
    where: { id: playlistId, userId, isSystem: false },
    select: {
      id: true,
      title: true,
      coverUrl: true,
      createdAt: true,
      updatedAt: true,
      songs: {
        select: {
          position: true,
          addedAt: true,
          song: { select: songSelect },
        },
        orderBy: { position: 'asc' },
      },
    },
  });
  if (!playlist) throw createError('Playlist not found', 404, 'NOT_FOUND');
  return formatPlaylist(playlist);
}

// ─── Create playlist ──────────────────────────────────────────────────────────

async function createPlaylist(userId, { title, coverUrl }) {
  if (!title || !title.trim()) throw createError('Title is required', 422, 'VALIDATION_ERROR');

  const playlist = await prisma.playlist.create({
    data: { userId, title: title.trim(), coverUrl: coverUrl || null },
    select: { id: true, title: true, coverUrl: true, createdAt: true, updatedAt: true },
  });
  return { ...playlist, songCount: 0 };
}

// ─── Update playlist ──────────────────────────────────────────────────────────

async function updatePlaylist(userId, playlistId, { title, coverUrl }) {
  const existing = await prisma.playlist.findFirst({
    where: { id: playlistId, userId, isSystem: false },
    select: { id: true },
  });
  if (!existing) throw createError('Playlist not found', 404, 'NOT_FOUND');

  const data = {};
  if (title !== undefined) {
    if (!title.trim()) throw createError('Title cannot be empty', 422, 'VALIDATION_ERROR');
    data.title = title.trim();
  }
  if (coverUrl !== undefined) data.coverUrl = coverUrl;

  const updated = await prisma.playlist.update({
    where: { id: playlistId },
    data,
    select: { id: true, title: true, coverUrl: true, createdAt: true, updatedAt: true },
  });
  return updated;
}

// ─── Delete playlist ──────────────────────────────────────────────────────────

async function deletePlaylist(userId, playlistId) {
  const existing = await prisma.playlist.findFirst({
    where: { id: playlistId, userId, isSystem: false },
    select: { id: true },
  });
  if (!existing) throw createError('Playlist not found', 404, 'NOT_FOUND');

  await prisma.playlist.delete({ where: { id: playlistId } });
}

// ─── Add song to playlist ─────────────────────────────────────────────────────

async function addSongToPlaylist(userId, playlistId, songId) {
  const [playlist, song] = await Promise.all([
    prisma.playlist.findFirst({ where: { id: playlistId, userId, isSystem: false }, select: { id: true } }),
    prisma.song.findFirst({ where: { id: songId, status: 'published' }, select: { id: true } }),
  ]);

  if (!playlist) throw createError('Playlist not found', 404, 'NOT_FOUND');
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');

  // Check if already in playlist
  const existing = await prisma.playlistSong.findUnique({
    where: { playlistId_songId: { playlistId, songId } },
  });
  if (existing) throw createError('Song already in playlist', 409, 'CONFLICT');

  // Get next position
  const last = await prisma.playlistSong.findFirst({
    where: { playlistId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  const position = (last?.position ?? 0) + 1;

  await prisma.playlistSong.create({ data: { playlistId, songId, position } });
}

// ─── Remove song from playlist ────────────────────────────────────────────────

async function removeSongFromPlaylist(userId, playlistId, songId) {
  const playlist = await prisma.playlist.findFirst({
    where: { id: playlistId, userId, isSystem: false },
    select: { id: true },
  });
  if (!playlist) throw createError('Playlist not found', 404, 'NOT_FOUND');

  const existing = await prisma.playlistSong.findUnique({
    where: { playlistId_songId: { playlistId, songId } },
  });
  if (!existing) throw createError('Song not in playlist', 404, 'NOT_FOUND');

  await prisma.playlistSong.delete({ where: { playlistId_songId: { playlistId, songId } } });
}

// ─── Liked songs ──────────────────────────────────────────────────────────────

async function getLikedSongs(userId, { page = 1, limit = 20 } = {}) {
  const take = Math.min(Number(limit), 50);
  const skip = (Number(page) - 1) * take;

  const [liked, total] = await Promise.all([
    prisma.likedSong.findMany({
      where: { userId },
      select: {
        createdAt: true,
        song: { select: songSelect },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.likedSong.count({ where: { userId } }),
  ]);

  return {
    songs: liked.map((l) => ({ ...formatSong(l.song), likedAt: l.createdAt })),
    pagination: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) },
  };
}

async function likeSong(userId, songId) {
  const song = await prisma.song.findFirst({ where: { id: songId, status: 'published' }, select: { id: true } });
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');

  const existing = await prisma.likedSong.findUnique({ where: { userId_songId: { userId, songId } } });
  if (existing) throw createError('Song already liked', 409, 'CONFLICT');

  await prisma.likedSong.create({ data: { userId, songId } });
}

async function unlikeSong(userId, songId) {
  const existing = await prisma.likedSong.findUnique({ where: { userId_songId: { userId, songId } } });
  if (!existing) throw createError('Song not liked', 404, 'NOT_FOUND');

  await prisma.likedSong.delete({ where: { userId_songId: { userId, songId } } });
}

async function isSongLiked(userId, songId) {
  const existing = await prisma.likedSong.findUnique({
    where: { userId_songId: { userId, songId } },
    select: { userId: true },
  });
  return { liked: !!existing };
}

module.exports = {
  getUserPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  getLikedSongs,
  likeSong,
  unlikeSong,
  isSongLiked,
};
