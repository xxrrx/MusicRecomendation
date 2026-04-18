const router = require('express').Router();
const { authenticate } = require('../../shared/middleware/auth.middleware');
const ctrl = require('./social.controller');

router.use(authenticate);

router.get('/following', ctrl.getFollowing);
router.get('/follow/:artistId', ctrl.checkFollow);
router.post('/follow/:artistId', ctrl.follow);
router.delete('/follow/:artistId', ctrl.unfollow);

module.exports = router;
