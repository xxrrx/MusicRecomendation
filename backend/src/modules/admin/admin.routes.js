const router = require('express').Router();
const { authenticate, authorize } = require('../../shared/middleware/auth.middleware');
const ctrl = require('./admin.controller');

// All routes require admin role
router.use(authenticate, authorize('admin'));

// Stats
router.get('/stats', ctrl.getStats);

// Pending songs & review
router.get('/pending-songs', ctrl.getPendingSongs);
router.patch('/songs/:id/review', ctrl.reviewSong);
router.delete('/songs/:id', ctrl.deleteSong);

// User management
router.get('/users', ctrl.getUsers);
router.patch('/users/:id/status', ctrl.updateUserStatus);

module.exports = router;
