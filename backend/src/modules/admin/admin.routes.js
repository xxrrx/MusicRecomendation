const router = require('express').Router();
const { authenticate, authorize } = require('../../shared/middleware/auth.middleware');
const ctrl = require('./admin.controller');

router.use(authenticate, authorize('admin'));

// ─── Overview stats ───────────────────────────────────────────────────────────
router.get('/stats', ctrl.getStats);

// ─── Moderation ───────────────────────────────────────────────────────────────
router.get('/pending-songs', ctrl.getPendingSongs);
router.patch('/songs/:id/review', ctrl.reviewSong);

// ─── Song management ──────────────────────────────────────────────────────────
router.get('/songs', ctrl.getAllSongs);
router.get('/songs/:id', ctrl.getSongDetail);
router.patch('/songs/:id', ctrl.updateSongMetadata);
router.delete('/songs/:id', ctrl.deleteSong);

// ─── Artist management ────────────────────────────────────────────────────────
router.get('/artists', ctrl.getArtistsList);
router.post('/users/:id/promote-artist', ctrl.promoteToArtist);
router.patch('/artists/:id', ctrl.updateArtistProfile);

// ─── Album management ─────────────────────────────────────────────────────────
router.get('/albums', ctrl.getAlbumsList);
router.get('/albums/:id', ctrl.getAlbumDetail);
router.post('/albums', ctrl.createAlbum);
router.patch('/albums/:id', ctrl.updateAlbum);
router.delete('/albums/:id', ctrl.deleteAlbum);
router.post('/albums/:id/songs', ctrl.addSongToAlbum);
router.delete('/albums/:id/songs/:songId', ctrl.removeSongFromAlbum);

// ─── Playlist management ──────────────────────────────────────────────────────
router.get('/playlists', ctrl.getPlaylists);
router.get('/playlists/:id', ctrl.getPlaylistDetail);
router.post('/playlists', ctrl.createPlaylist);
router.patch('/playlists/:id', ctrl.updatePlaylist);
router.delete('/playlists/:id', ctrl.deletePlaylist);
router.post('/playlists/:id/songs', ctrl.addSongToPlaylist);
router.delete('/playlists/:id/songs/:songId', ctrl.removeSongFromPlaylist);

// ─── User management ──────────────────────────────────────────────────────────
router.get('/users', ctrl.getUsers);
router.get('/users/:id', ctrl.getUserDetail);
router.patch('/users/:id/status', ctrl.updateUserStatus);
router.patch('/users/:id/role', ctrl.updateUserRole);

// ─── Analytics ────────────────────────────────────────────────────────────────
router.get('/analytics/overview', ctrl.getAnalyticsOverview);
router.get('/analytics/top-songs', ctrl.getTopSongs);
router.get('/analytics/top-artists', ctrl.getTopArtists);
router.get('/analytics/plays', ctrl.getPlaysOverTime);
router.get('/analytics/new-users', ctrl.getNewUsersOverTime);

// ─── Donations ────────────────────────────────────────────────────────────────
router.get('/donations', ctrl.getDonations);
router.get('/donations/stats', ctrl.getDonationStats);

module.exports = router;
