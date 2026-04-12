const { Router } = require('express');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const ctrl = require('./user.controller');

const router = Router();

router.get('/me', authenticate, ctrl.getMe);
router.patch('/me', authenticate, ctrl.patchMe);
router.post('/onboarding', authenticate, ctrl.onboarding);
router.get('/history', authenticate, ctrl.getHistory);

module.exports = router;
