const userService = require('./user.service');
const { validatePatchMe, validateOnboarding, validateHistory } = require('./user.validator');
const { success, paginated } = require('../../shared/utils/response.helper');

async function getMe(req, res, next) {
  try {
    const data = await userService.getMe(req.user.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function patchMe(req, res, next) {
  try {
    validatePatchMe(req.body);
    const data = await userService.patchMe(req.user.id, req.body);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function onboarding(req, res, next) {
  try {
    validateOnboarding(req.body);
    const data = await userService.saveOnboarding(req.user.id, req.body.genreIds);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const { page, limit } = validateHistory(req.query);
    const result = await userService.getHistory(req.user.id, page, limit);
    paginated(res, result.data, result.pagination);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, patchMe, onboarding, getHistory };
