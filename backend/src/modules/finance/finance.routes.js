const { Router } = require('express');
const controller = require('./finance.controller');
const auth = require('../../middlewares/authMiddleware');

const router = Router();

router.use(auth);
router.get('/overview', controller.overview);
router.get('/categories', controller.categories);
router.get('/accounts', controller.listAccounts);
router.post('/accounts', controller.createAccount);
router.patch('/accounts/:id', controller.updateAccount);
router.delete('/accounts/:id', controller.archiveAccount);
router.get('/transactions', controller.listTransactions);
router.post('/transactions', controller.createTransaction);
router.delete('/transactions/:id', controller.deleteTransaction);
router.post('/import', controller.importStatement);

module.exports = router;
