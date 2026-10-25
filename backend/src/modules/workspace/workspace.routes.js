const { Router } = require('express');
const controller = require('./workspace.controller');
const auth = require('../../middlewares/authMiddleware');

const router = Router();

router.use(auth);
router.get('/', controller.overview);
router.post('/invite', controller.invite);
router.delete('/members/:membershipId', controller.removeMember);

// O Pro só é liberado pelo fluxo de pagamento (/api/billing). PATCH /tier desativado.
router.patch('/tier', (req, res) => res.status(403).json({ error: 'Assine o Pro em /billing para liberar o plano' }));

module.exports = router;
