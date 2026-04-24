const { Router } = require('express');
const multer = require('multer');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const ctrl = require('./user.controller');

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/me', authenticate, ctrl.getMe);
router.patch('/me', authenticate, upload.single('avatar'), ctrl.patchMe);
router.post('/onboarding', authenticate, ctrl.onboarding);
router.get('/history', authenticate, ctrl.getHistory);

module.exports = router;
