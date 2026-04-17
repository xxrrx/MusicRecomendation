const playerService = require('./player.service');
const { success } = require('../../shared/utils/response.helper');

async function streamSong(req, res, next) {
  try {
    const result = await playerService.getStreamUrl(req.params.songId);
    success(res, result);
  } catch (err) {
    next(err);
  }
}

async function logPlay(req, res, next) {
  try {
    const { songId, durationPlayed, completionRate } = req.body;
    await playerService.logPlay(req.user.id, { songId, durationPlayed, completionRate });
    success(res, { logged: true });
  } catch (err) {
    next(err);
  }
}

async function logBehavior(req, res, next) {
  try {
    const { songId, action } = req.body;
    await playerService.logBehavior(req.user.id, { songId, action });
    success(res, { logged: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { streamSong, logPlay, logBehavior };
