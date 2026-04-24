const router = require('express').Router();
const multer = require('multer');
const { authenticate, authorize } = require('../../shared/middleware/auth.middleware');
const ctrl = require('./artist.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// All routes require artist or admin role
router.use(authenticate, authorize('artist', 'admin'));

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Songs
router.get('/songs', ctrl.getSongs);
router.get('/songs/:id', ctrl.getSongById);
router.post(
  '/songs',
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  ctrl.uploadSong
);
router.patch('/songs/:id', ctrl.updateSong);
router.delete('/songs/:id', ctrl.deleteSong);

// Albums
router.get('/albums', ctrl.getAlbums);
router.post('/albums', upload.single('cover'), ctrl.createAlbum);
router.get('/albums/:id', ctrl.getAlbumDetail);
router.patch('/albums/:id', upload.single('cover'), ctrl.updateAlbum);
router.delete('/albums/:id', ctrl.deleteAlbum);
router.post('/albums/:id/songs', ctrl.addSongToAlbum);
router.delete('/albums/:id/songs/:songId', ctrl.removeSongFromAlbum);

// Analytics
router.get('/analytics/plays', ctrl.getPlaysOverTime);
router.get('/analytics/top-songs', ctrl.getTopSongs);
router.get('/analytics/revenue', ctrl.getRevenue);

// Profile
router.patch('/profile', upload.single('avatar'), ctrl.updateProfile);

module.exports = router;
