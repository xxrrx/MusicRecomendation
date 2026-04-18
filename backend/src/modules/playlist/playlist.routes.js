const router = require('express').Router();
const { authenticate } = require('../../shared/middleware/auth.middleware');
const ctrl = require('./playlist.controller');

// All playlist routes require auth
router.use(authenticate);

// Playlists CRUD
router.get('/', ctrl.getPlaylists);
router.post('/', ctrl.createPlaylist);
router.get('/:id', ctrl.getPlaylist);
router.patch('/:id', ctrl.updatePlaylist);
router.delete('/:id', ctrl.deletePlaylist);

// Songs in playlist
router.post('/:id/songs', ctrl.addSong);
router.delete('/:id/songs/:songId', ctrl.removeSong);

// Liked songs
router.get('/liked/songs', ctrl.getLikedSongs);
router.get('/liked/songs/:songId', ctrl.checkLiked);
router.post('/liked/songs/:songId', ctrl.likeSong);
router.delete('/liked/songs/:songId', ctrl.unlikeSong);

module.exports = router;
