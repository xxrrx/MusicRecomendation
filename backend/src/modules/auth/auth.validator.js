const { createError } = require('../../shared/utils/response.helper');

function validateRegister(body) {
  const { email, password, displayName, role } = body;
  const errors = [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters');
  if (!displayName || displayName.length > 100) errors.push('displayName is required and max 100 chars');
  if (!role || !['user', 'artist'].includes(role)) errors.push('role must be "user" or "artist"');

  if (errors.length) throw createError(errors.join('; '), 422, 'VALIDATION_ERROR');
}

function validateLogin(body) {
  const { email, password } = body;
  const errors = [];

  if (!email) errors.push('email is required');
  if (!password) errors.push('password is required');

  if (errors.length) throw createError(errors.join('; '), 422, 'VALIDATION_ERROR');
}

function validateRefreshToken(body) {
  if (!body.refreshToken) throw createError('refreshToken is required', 422, 'VALIDATION_ERROR');
}

function validateVerifyEmail(body) {
  if (!body.token) throw createError('token is required', 422, 'VALIDATION_ERROR');
}

module.exports = { validateRegister, validateLogin, validateRefreshToken, validateVerifyEmail };
