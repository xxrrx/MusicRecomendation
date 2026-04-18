const { Router } = require('express');
const { getChartHandler } = require('./charts.controller');

const router = Router();

// GET /api/charts/daily
// GET /api/charts/weekly
// GET /api/charts/monthly
router.get('/:type', getChartHandler);

module.exports = router;
