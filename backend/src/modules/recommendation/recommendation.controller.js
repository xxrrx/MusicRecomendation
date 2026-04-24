const { getRecommendations, getRadio } = require('./recommendation.service');
const { success } = require('../../shared/utils/response.helper');

async function recommendHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const songs = await getRecommendations(userId);
    success(res, { songs });
  } catch (err) {
    next(err);
  }
}

async function radioHandler(req, res, next) {
  try {
    const { songId } = req.params;
    const songs = await getRadio(songId);
    success(res, { songs });
  } catch (err) {
    next(err);
  }
}

module.exports = { recommendHandler, radioHandler };
