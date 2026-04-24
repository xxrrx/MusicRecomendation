const { Router } = require('express');
const ctrl = require('./donation.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { validate } = require('./donation.validator');

const router = Router();

// VNPay return callback — no auth (VNPay redirects without JWT)
router.get('/vnpay-return', ctrl.vnpayReturn);

// All other endpoints require login
router.use(authenticate);

router.post('/initiate', validate('initiate'), ctrl.initiate);
router.post('/confirm', validate('confirm'), ctrl.confirmStripe);
router.get('/history', ctrl.getHistory);

module.exports = router;
