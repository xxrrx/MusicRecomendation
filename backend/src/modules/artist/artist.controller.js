const artistService = require('./artist.service');
const { success, paginated } = require('../../shared/utils/response.helper');

async function getDashboard(req, res, next) {
  try {
    const data = await artistService.getMyDashboard(req.user.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getSongs(req, res, next) {
  try {
    const result = await artistService.getMySongs(req.user.id, req.query);
    paginated(res, result.songs, result.pagination);
  } catch (err) {
    next(err);
  }
}

async function getSongById(req, res, next) {
  try {
    const data = await artistService.getMySongById(req.user.id, req.params.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function uploadSong(req, res, next) {
  try {
    const files = {
      audio: req.files?.audio?.[0] || null,
      cover: req.files?.cover?.[0] || null,
    };
    const data = await artistService.createSong(req.user.id, req.body, files);
    success(res, data, 201);
  } catch (err) {
    next(err);
  }
}

async function updateSong(req, res, next) {
  try {
    const data = await artistService.updateSong(req.user.id, req.params.id, req.body);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function deleteSong(req, res, next) {
  try {
    await artistService.deleteSong(req.user.id, req.params.id);
    success(res, null, 204);
  } catch (err) {
    next(err);
  }
}

async function getAlbums(req, res, next) {
  try {
    const data = await artistService.getMyAlbums(req.user.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function createAlbum(req, res, next) {
  try {
    const coverFile = req.file || null;
    const data = await artistService.createAlbum(req.user.id, req.body, coverFile);
    success(res, data, 201);
  } catch (err) {
    next(err);
  }
}

async function getAlbumDetail(req, res, next) {
  try {
    const data = await artistService.getMyAlbumDetail(req.user.id, req.params.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function updateAlbum(req, res, next) {
  try {
    const coverFile = req.file || null;
    const data = await artistService.updateMyAlbum(req.user.id, req.params.id, req.body, coverFile);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function deleteAlbum(req, res, next) {
  try {
    await artistService.deleteMyAlbum(req.user.id, req.params.id);
    success(res, null, 204);
  } catch (err) {
    next(err);
  }
}

async function addSongToAlbum(req, res, next) {
  try {
    const data = await artistService.addSongToMyAlbum(req.user.id, req.params.id, req.body.songId);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function removeSongFromAlbum(req, res, next) {
  try {
    await artistService.removeSongFromMyAlbum(req.user.id, req.params.id, req.params.songId);
    success(res, null, 204);
  } catch (err) {
    next(err);
  }
}

async function getPlaysOverTime(req, res, next) {
  try {
    const data = await artistService.getMyPlaysOverTime(req.user.id, req.query);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getTopSongs(req, res, next) {
  try {
    const data = await artistService.getMyTopSongs(req.user.id, req.query);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getRevenue(req, res, next) {
  try {
    const data = await artistService.getMyRevenue(req.user.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const avatarFile = req.file || null;
    const data = await artistService.updateMyProfile(req.user.id, req.body, avatarFile);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getSongs,
  getSongById,
  uploadSong,
  updateSong,
  deleteSong,
  getAlbums,
  createAlbum,
  getAlbumDetail,
  updateAlbum,
  deleteAlbum,
  addSongToAlbum,
  removeSongFromAlbum,
  getPlaysOverTime,
  getTopSongs,
  getRevenue,
  updateProfile,
};
