const authService = require('./auth.service');
const { validateRegister, validateLogin, validateRefreshToken, validateVerifyEmail } = require('./auth.validator');
const { success } = require('../../shared/utils/response.helper');

async function register(req, res, next) {
  try {
    validateRegister(req.body);
    const result = await authService.register(req.body);
    success(res, result, 201);
  } catch (err) {
    next(err);
  }
}

async function resendVerification(req, res, next) {
  try {
    const result = await authService.resendVerification(req.body);
    success(res, result);
  } catch (err) {
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    validateVerifyEmail(req.body);
    const result = await authService.verifyEmail(req.body);
    success(res, result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    validateLogin(req.body);
    const result = await authService.login(req.body);
    success(res, result);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    // refreshToken may be passed in body (optional)
    const result = await authService.logout(req.body.refreshToken);
    success(res, result);
  } catch (err) {
    next(err);
  }
}

async function refreshToken(req, res, next) {
  try {
    validateRefreshToken(req.body);
    const result = await authService.refreshAccessToken(req.body);
    success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, resendVerification, verifyEmail, login, logout, refreshToken };
