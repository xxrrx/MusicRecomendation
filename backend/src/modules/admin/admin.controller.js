const adminService = require('./admin.service');
const contentService = require('./admin.content.service');
const analyticsService = require('./admin.analytics.service');
const { success, paginated } = require('../../shared/utils/response.helper');

// ─── Moderation ───────────────────────────────────────────────────────────────

async function getPendingSongs(req, res, next) {
  try {
    const result = await adminService.getPendingSongs(req.query);
    paginated(res, result.songs, result.pagination);
  } catch (err) { next(err); }
}

async function reviewSong(req, res, next) {
  try {
    const data = await adminService.reviewSong(req.user.id, req.params.id, req.body);
    success(res, data);
  } catch (err) { next(err); }
}

// ─── User management ──────────────────────────────────────────────────────────

async function getUsers(req, res, next) {
  try {
    const result = await adminService.getUsers(req.query);
    paginated(res, result.users, result.pagination);
  } catch (err) { next(err); }
}

async function getUserDetail(req, res, next) {
  try {
    const data = await adminService.getUserDetail(req.params.id);
    success(res, data);
  } catch (err) { next(err); }
}

async function updateUserStatus(req, res, next) {
  try {
    const data = await adminService.updateUserStatus(req.params.id, req.body);
    success(res, data);
  } catch (err) { next(err); }
}

async function updateUserRole(req, res, next) {
  try {
    const data = await adminService.updateUserRole(req.params.id, req.body);
    success(res, data);
  } catch (err) { next(err); }
}

// ─── Song management ──────────────────────────────────────────────────────────

async function getAllSongs(req, res, next) {
  try {
    const result = await contentService.getAllSongs(req.query);
    paginated(res, result.songs, result.pagination);
  } catch (err) { next(err); }
}

async function getSongDetail(req, res, next) {
  try {
    const data = await contentService.getSongDetail(req.params.id);
    success(res, data);
  } catch (err) { next(err); }
}

async function updateSongMetadata(req, res, next) {
  try {
    const data = await contentService.updateSongMetadata(req.params.id, req.body);
    success(res, data);
  } catch (err) { next(err); }
}

async function deleteSong(req, res, next) {
  try {
    await adminService.deleteSong(req.params.id);
    success(res, null, 204);
  } catch (err) { next(err); }
}

// ─── Artist management ────────────────────────────────────────────────────────

async function getArtistsList(req, res, next) {
  try {
    const result = await contentService.getArtistsList(req.query);
    paginated(res, result.artists, result.pagination);
  } catch (err) { next(err); }
}

async function promoteToArtist(req, res, next) {
  try {
    const data = await contentService.promoteToArtist(req.params.id, req.body);
    success(res, data, 201);
  } catch (err) { next(err); }
}

async function updateArtistProfile(req, res, next) {
  try {
    const data = await contentService.updateArtistProfile(req.params.id, req.body);
    success(res, data);
  } catch (err) { next(err); }
}

// ─── Album management ─────────────────────────────────────────────────────────

async function getAlbumsList(req, res, next) {
  try {
    const result = await contentService.getAlbumsList(req.query);
    paginated(res, result.albums, result.pagination);
  } catch (err) { next(err); }
}

async function getAlbumDetail(req, res, next) {
  try {
    const data = await contentService.getAlbumWithSongs(req.params.id);
    success(res, data);
  } catch (err) { next(err); }
}

async function createAlbum(req, res, next) {
  try {
    const data = await contentService.createAlbumAdmin(req.body);
    success(res, data, 201);
  } catch (err) { next(err); }
}

async function updateAlbum(req, res, next) {
  try {
    const data = await contentService.updateAlbumAdmin(req.params.id, req.body);
    success(res, data);
  } catch (err) { next(err); }
}

async function deleteAlbum(req, res, next) {
  try {
    await contentService.deleteAlbumAdmin(req.params.id);
    success(res, null, 204);
  } catch (err) { next(err); }
}

async function addSongToAlbum(req, res, next) {
  try {
    const data = await contentService.addSongToAlbum(req.params.id, req.body.songId);
    success(res, data);
  } catch (err) { next(err); }
}

async function removeSongFromAlbum(req, res, next) {
  try {
    await contentService.removeSongFromAlbum(req.params.id, req.params.songId);
    success(res, null, 204);
  } catch (err) { next(err); }
}

// ─── Playlist management ──────────────────────────────────────────────────────

async function getPlaylists(req, res, next) {
  try {
    const result = await contentService.getOfficialPlaylists(req.query);
    paginated(res, result.playlists, result.pagination);
  } catch (err) { next(err); }
}

async function getPlaylistDetail(req, res, next) {
  try {
    const data = await contentService.getPlaylistWithSongs(req.params.id);
    success(res, data);
  } catch (err) { next(err); }
}

async function createPlaylist(req, res, next) {
  try {
    const data = await contentService.createOfficialPlaylist(req.body);
    success(res, data, 201);
  } catch (err) { next(err); }
}

async function updatePlaylist(req, res, next) {
  try {
    const data = await contentService.updateOfficialPlaylist(req.params.id, req.body);
    success(res, data);
  } catch (err) { next(err); }
}

async function deletePlaylist(req, res, next) {
  try {
    await contentService.deleteOfficialPlaylist(req.params.id);
    success(res, null, 204);
  } catch (err) { next(err); }
}

async function addSongToPlaylist(req, res, next) {
  try {
    const data = await contentService.addSongToPlaylist(req.params.id, req.body.songId);
    success(res, data);
  } catch (err) { next(err); }
}

async function removeSongFromPlaylist(req, res, next) {
  try {
    await contentService.removeSongFromPlaylist(req.params.id, req.params.songId);
    success(res, null, 204);
  } catch (err) { next(err); }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

async function getStats(req, res, next) {
  try {
    const data = await adminService.getStats();
    success(res, data);
  } catch (err) { next(err); }
}

async function getAnalyticsOverview(req, res, next) {
  try {
    const data = await analyticsService.getAnalyticsOverview();
    success(res, data);
  } catch (err) { next(err); }
}

async function getTopSongs(req, res, next) {
  try {
    const data = await analyticsService.getTopSongs(req.query);
    success(res, data);
  } catch (err) { next(err); }
}

async function getTopArtists(req, res, next) {
  try {
    const data = await analyticsService.getTopArtists(req.query);
    success(res, data);
  } catch (err) { next(err); }
}

async function getPlaysOverTime(req, res, next) {
  try {
    const data = await analyticsService.getPlaysOverTime(req.query);
    success(res, data);
  } catch (err) { next(err); }
}

async function getNewUsersOverTime(req, res, next) {
  try {
    const data = await analyticsService.getNewUsersOverTime(req.query);
    success(res, data);
  } catch (err) { next(err); }
}

// ─── Donations ────────────────────────────────────────────────────────────────

async function getDonations(req, res, next) {
  try {
    const result = await analyticsService.getDonationsList(req.query);
    paginated(res, result.donations, result.pagination);
  } catch (err) { next(err); }
}

async function getDonationStats(req, res, next) {
  try {
    const data = await analyticsService.getDonationStats();
    success(res, data);
  } catch (err) { next(err); }
}

module.exports = {
  // Moderation
  getPendingSongs, reviewSong,
  // Users
  getUsers, getUserDetail, updateUserStatus, updateUserRole,
  // Songs
  getAllSongs, getSongDetail, updateSongMetadata, deleteSong,
  // Artists
  getArtistsList, promoteToArtist, updateArtistProfile,
  // Albums
  getAlbumsList, getAlbumDetail, createAlbum, updateAlbum, deleteAlbum, addSongToAlbum, removeSongFromAlbum,
  // Playlists
  getPlaylists, getPlaylistDetail, createPlaylist, updatePlaylist, deletePlaylist, addSongToPlaylist, removeSongFromPlaylist,
  // Analytics
  getStats, getAnalyticsOverview, getTopSongs, getTopArtists, getPlaysOverTime, getNewUsersOverTime,
  // Donations
  getDonations, getDonationStats,
};
