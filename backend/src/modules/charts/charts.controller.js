const { getChart } = require('./charts.service');
const { success } = require('../../shared/utils/response.helper');

async function getChartHandler(req, res, next) {
  try {
    const { type } = req.params;
    const chart = await getChart(type);
    success(res, chart);
  } catch (err) {
    next(err);
  }
}

module.exports = { getChartHandler };
