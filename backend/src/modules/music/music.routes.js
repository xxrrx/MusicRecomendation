const router = require('express').Router();
const { getGenres, getSongById, getSongs, getAlbumById, getArtistById } = require('./music.controller');

// Genres
router.get('/genres', getGenres);

// Songs
router.get('/songs', getSongs);
router.get('/songs/:id', getSongById);

// Albums
router.get('/albums/:id', getAlbumById);

// Artists
router.get('/artists/:id', getArtistById);

module.exports = router;
