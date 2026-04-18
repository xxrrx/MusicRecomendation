const socialService = require('./social.service');
const { success, paginated } = require('../../shared/utils/response.helper');

async function follow(req, res, next) {
  try {
    await socialService.followArtist(req.user.id, req.params.artistId);
    success(res, { following: true }, 201);
  } catch (err) {
    next(err);
  }
}

async function unfollow(req, res, next) {
  try {
    await socialService.unfollowArtist(req.user.id, req.params.artistId);
    success(res, { following: false });
  } catch (err) {
    next(err);
  }
}

async function checkFollow(req, res, next) {
  try {
    const data = await socialService.isFollowing(req.user.id, req.params.artistId);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getFollowing(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await socialService.getFollowing(req.user.id, { page, limit });
    paginated(res, result.artists, result.pagination);
  } catch (err) {
    next(err);
  }
}

module.exports = { follow, unfollow, checkFollow, getFollowing };
