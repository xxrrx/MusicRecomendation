const { Router } = require('express');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const ctrl = require('./auth.controller');

const router = Router();

router.post('/register', ctrl.register);
router.post('/verify-email', ctrl.verifyEmail);
router.post('/login', ctrl.login);
router.post('/logout', authenticate, ctrl.logout);
router.post('/refresh-token', ctrl.refreshToken);

module.exports = router;
