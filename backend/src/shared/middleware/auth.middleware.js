const { verifyAccessToken } = require('../utils/jwt.helper');
const { createError } = require('../utils/response.helper');

/**
 * Require a valid Bearer access token.
 * Attaches req.user = { id, email, role }
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(createError('Access token is missing or invalid', 401, 'UNAUTHORIZED'));
  }

  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(createError('Access token is missing or invalid', 401, 'UNAUTHORIZED'));
  }
}

/**
 * Attach req.user if a valid token is present, but do not fail if absent.
 */
function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(header.slice(7));
    } catch {
      // ignore invalid token — treat as unauthenticated
    }
  }
  next();
}

/**
 * Require req.user.role to be one of the given roles.
 * Must be used after `authenticate`.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError('Access token is missing or invalid', 401, 'UNAUTHORIZED'));
    }
    if (!roles.includes(req.user.role)) {
      return next(createError('Insufficient permissions', 403, 'FORBIDDEN'));
    }
    next();
  };
}

module.exports = { authenticate, optionalAuthenticate, authorize };
