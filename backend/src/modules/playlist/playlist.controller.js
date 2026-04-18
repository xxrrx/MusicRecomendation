const playlistService = require('./playlist.service');
const { success, paginated } = require('../../shared/utils/response.helper');

async function getPlaylists(req, res, next) {
  try {
    const data = await playlistService.getUserPlaylists(req.user.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getPlaylist(req, res, next) {
  try {
    const data = await playlistService.getPlaylistById(req.user.id, req.params.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function createPlaylist(req, res, next) {
  try {
    const data = await playlistService.createPlaylist(req.user.id, req.body);
    success(res, data, 201);
  } catch (err) {
    next(err);
  }
}

async function updatePlaylist(req, res, next) {
  try {
    const data = await playlistService.updatePlaylist(req.user.id, req.params.id, req.body);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function deletePlaylist(req, res, next) {
  try {
    await playlistService.deletePlaylist(req.user.id, req.params.id);
    success(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

async function addSong(req, res, next) {
  try {
    const { songId } = req.body;
    await playlistService.addSongToPlaylist(req.user.id, req.params.id, songId);
    success(res, { added: true }, 201);
  } catch (err) {
    next(err);
  }
}

async function removeSong(req, res, next) {
  try {
    await playlistService.removeSongFromPlaylist(req.user.id, req.params.id, req.params.songId);
    success(res, { removed: true });
  } catch (err) {
    next(err);
  }
}

async function getLikedSongs(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await playlistService.getLikedSongs(req.user.id, { page, limit });
    paginated(res, result.songs, result.pagination);
  } catch (err) {
    next(err);
  }
}

async function likeSong(req, res, next) {
  try {
    await playlistService.likeSong(req.user.id, req.params.songId);
    success(res, { liked: true }, 201);
  } catch (err) {
    next(err);
  }
}

async function unlikeSong(req, res, next) {
  try {
    await playlistService.unlikeSong(req.user.id, req.params.songId);
    success(res, { liked: false });
  } catch (err) {
    next(err);
  }
}

async function checkLiked(req, res, next) {
  try {
    const data = await playlistService.isSongLiked(req.user.id, req.params.songId);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPlaylists,
  getPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSong,
  removeSong,
  getLikedSongs,
  likeSong,
  unlikeSong,
  checkLiked,
};
