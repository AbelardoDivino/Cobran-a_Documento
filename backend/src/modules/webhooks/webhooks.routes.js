const { Router } = require('express');
const { mercadopago } = require('./webhooks.controller');

const router = Router();

router.post('/mercadopago', mercadopago);

module.exports = router;
