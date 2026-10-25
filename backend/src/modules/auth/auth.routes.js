const { Router } = require('express');
const controller = require('./auth.controller');
const validate = require('../../middlewares/validate');
const { authLimiter, registerLimiter, refreshLimiter } = require('../../middlewares/rateLimiter');
const auth = require('../../middlewares/authMiddleware');
const { registerSchema, loginSchema, refreshSchema, googleSchema } = require('./auth.schema');

const router = Router();

router.post('/register', registerLimiter, validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/refresh', refreshLimiter, validate(refreshSchema), controller.refresh);
router.post('/google', authLimiter, validate(googleSchema), controller.google);
router.get('/verify-email', controller.verifyEmail);
router.post('/resend-verification', auth, refreshLimiter, controller.resendVerification);

module.exports = router;
