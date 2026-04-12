function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

function paginated(res, data, pagination) {
  return res.status(200).json({ success: true, data, pagination });
}

function createError(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

module.exports = { success, paginated, createError };
