const router = require('express').Router();
const { authenticate, optionalAuthenticate } = require('../../shared/middleware/auth.middleware');
const { streamSong, logPlay, logBehavior } = require('./player.controller');

// Stream — optionalAuthenticate so guests can preview; real apps may require auth
router.get('/stream/:songId', optionalAuthenticate, streamSong);

// Log play / behavior — require auth so we tie events to a user
router.post('/log', authenticate, logPlay);
router.post('/behavior', authenticate, logBehavior);

module.exports = router;
