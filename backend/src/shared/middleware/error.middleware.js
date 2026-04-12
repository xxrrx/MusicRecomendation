const { NODE_ENV } = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  if (status >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);
  }

  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(NODE_ENV === 'development' && status >= 500 ? { stack: err.stack } : {}),
    },
  });
}

module.exports = errorMiddleware;
