const { Router } = require('express');
const { z } = require('zod');
const controller = require('./billing.controller');
const auth = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validate');
const { billingLimiter } = require('../../middlewares/rateLimiter');

const plan = z.enum(['mensal', 'trimestral', 'anual']).optional().default('mensal');
const payerEmail = z.string().email().optional();
const idempotencyKey = z.string().min(8).max(100).optional();

const cardSchema = z
  .object({
    plan,
    cardToken: z.string().min(1),
    cardBrand: z.string().optional(),
    payerEmail,
    idempotencyKey,
  })
  .passthrough();

const pixSchema = z.object({ plan, payerEmail, idempotencyKey }).passthrough();
const boletoSchema = z
  .object({
    plan,
    payerEmail,
    payer: z.record(z.any()).optional(),
    idempotencyKey,
  })
  .passthrough();

const router = Router();

router.use(auth);
router.use(billingLimiter);
router.post('/subscribe/card', validate(cardSchema), controller.subscribeCard);
router.post('/charge/pix', validate(pixSchema), controller.chargePix);
router.post('/charge/boleto', validate(boletoSchema), controller.chargeBoleto);
router.get('/status', controller.status);

module.exports = router;
