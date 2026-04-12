const prisma = require('../../shared/config/database');
const musicService = require('./music.service');
const { success, paginated } = require('../../shared/utils/response.helper');

async function getGenres(req, res, next) {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
    success(res, genres);
  } catch (err) {
    next(err);
  }
}

async function getSongById(req, res, next) {
  try {
    const song = await musicService.getSongById(req.params.id);
    success(res, song);
  } catch (err) {
    next(err);
  }
}

async function getSongs(req, res, next) {
  try {
    const { page, limit, genreId, artistId } = req.query;
    const result = await musicService.getSongs({ page, limit, genreId, artistId });
    paginated(res, result.songs, result.pagination);
  } catch (err) {
    next(err);
  }
}

async function getAlbumById(req, res, next) {
  try {
    const album = await musicService.getAlbumById(req.params.id);
    success(res, album);
  } catch (err) {
    next(err);
  }
}

async function getArtistById(req, res, next) {
  try {
    const artist = await musicService.getArtistById(req.params.id);
    success(res, artist);
  } catch (err) {
    next(err);
  }
}

module.exports = { getGenres, getSongById, getSongs, getAlbumById, getArtistById };
