const { Router } = require('express');
const controller = require('./clients.controller');
const auth = require('../../middlewares/authMiddleware');

const router = Router();

router.use(auth);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.detail);
router.delete('/:id', controller.remove);

module.exports = router;
