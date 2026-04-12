const { createError } = require('../../shared/utils/response.helper');

function validatePatchMe(body) {
  const { displayName, avatarUrl } = body;
  const errors = [];

  if (displayName !== undefined && (typeof displayName !== 'string' || displayName.length > 100)) {
    errors.push('displayName must be a string with max 100 chars');
  }
  if (avatarUrl !== undefined && typeof avatarUrl !== 'string') {
    errors.push('avatarUrl must be a string');
  }

  if (errors.length) throw createError(errors.join('; '), 422, 'VALIDATION_ERROR');
}

function validateOnboarding(body) {
  const { genreIds } = body;
  if (!Array.isArray(genreIds) || genreIds.length === 0) {
    throw createError('genreIds must be a non-empty array', 422, 'VALIDATION_ERROR');
  }
  if (genreIds.some((id) => typeof id !== 'string' && typeof id !== 'number')) {
    throw createError('genreIds must be an array of strings or numbers', 422, 'VALIDATION_ERROR');
  }
}

function validateHistory(query) {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 20, 100);
  return { page, limit };
}

module.exports = { validatePatchMe, validateOnboarding, validateHistory };
