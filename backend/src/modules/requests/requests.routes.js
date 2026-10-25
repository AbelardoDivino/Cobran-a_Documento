const { Router } = require('express');
const controller = require('./requests.controller');
const auth = require('../../middlewares/authMiddleware');

const router = Router();

router.use(auth);
router.post('/', controller.create);
router.get('/:id', controller.detail);
router.patch('/:id/items/:itemId', controller.review);

module.exports = router;
