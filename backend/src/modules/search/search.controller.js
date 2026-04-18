const { search } = require('./search.service');
const { success } = require('../../shared/utils/response.helper');

async function searchHandler(req, res, next) {
  try {
    const { q, type, limit } = req.query;
    const result = await search({ q, type, limit });
    success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = { searchHandler };
