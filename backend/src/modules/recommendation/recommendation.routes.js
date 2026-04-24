const express = require('express');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { recommendHandler, radioHandler } = require('./recommendation.controller');

const router = express.Router();

// GET /recommendations — personalized for authenticated user
router.get('/', authenticate, recommendHandler);

// GET /recommendations/radio/:songId — content-based similar songs
router.get('/radio/:songId', radioHandler);

module.exports = router;
