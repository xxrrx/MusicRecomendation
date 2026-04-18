const adminService = require('./admin.service');
const { success, paginated } = require('../../shared/utils/response.helper');

async function getPendingSongs(req, res, next) {
  try {
    const result = await adminService.getPendingSongs(req.query);
    paginated(res, result.songs, result.pagination);
  } catch (err) {
    next(err);
  }
}

async function reviewSong(req, res, next) {
  try {
    const data = await adminService.reviewSong(req.user.id, req.params.id, req.body);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getUsers(req, res, next) {
  try {
    const result = await adminService.getUsers(req.query);
    paginated(res, result.users, result.pagination);
  } catch (err) {
    next(err);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const data = await adminService.updateUserStatus(req.params.id, req.body);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function deleteSong(req, res, next) {
  try {
    await adminService.deleteSong(req.params.id);
    success(res, null, 204);
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const data = await adminService.getStats();
    success(res, data);
  } catch (err) {
    next(err);
  }
}

module.exports = { getPendingSongs, reviewSong, getUsers, updateUserStatus, deleteSong, getStats };
