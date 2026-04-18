const { Router } = require('express');
const { searchHandler } = require('./search.controller');

const router = Router();

// GET /api/search?q=&type=all|songs|artists|albums&limit=10
router.get('/', searchHandler);

module.exports = router;
