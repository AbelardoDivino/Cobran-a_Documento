const authService = require('./auth.service');
const env = require('../../config/env');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json(result);
  } catch (e) {
    return next(e);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return res.json(result);
  } catch (e) {
    return next(e);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refresh(req.body);
    return res.json(result);
  } catch (e) {
    return next(e);
  }
}

async function google(req, res, next) {
  try {
    const result = await authService.loginWithGoogle(req.body);
    return res.json(result);
  } catch (e) {
    return next(e);
  }
}

async function verifyEmail(req, res) {
  try {
    await authService.verifyEmail(req.query.token);
    return res.redirect(`${env.FRONTEND_URL}/login?verified=1`);
  } catch (e) {
    return res.redirect(`${env.FRONTEND_URL}/login?verified=0`);
  }
}

async function resendVerification(req, res, next) {
  try {
    const result = await authService.resendVerification(req.user.id);
    return res.json(result);
  } catch (e) {
    return next(e);
  }
}

module.exports = { register, login, refresh, google, verifyEmail, resendVerification };
