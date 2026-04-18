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

module.exports = router;
