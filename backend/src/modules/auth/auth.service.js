const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const env = require('../../config/env');
const { sendMail } = require('../../lib/mailer');
const workspaceService = require('../workspace/workspace.service');

function signAccess(user) {
  return jwt.sign({ email: user.email }, env.JWT_SECRET, {
    subject: String(user._id),
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function signRefresh(user) {
  return jwt.sign({ email: user.email, type: 'refresh' }, env.JWT_SECRET, {
    subject: String(user._id),
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    officeName: user.officeName,
    accountType: user.accountType,
    companyCnpj: user.companyCnpj,
    emailVerified: Boolean(user.emailVerified),
  };
}

function signEmailVerification(user) {
  return jwt.sign({ type: 'verify-email' }, env.JWT_SECRET, {
    subject: String(user._id),
    expiresIn: '24h',
  });
}

async function sendVerificationEmail(user) {
  const token = signEmailVerification(user);
  // Em deploy separado (Vercel + Render), aponta direto para a API.
  const backendUrl = String(env.BACKEND_URL || env.FRONTEND_URL).replace(/\/+$/, '');
  const link = `${backendUrl}/api/auth/verify-email?token=${token}`;
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(`[auth] link de confirmação de ${user.email}: ${link}`);
  }
  await sendMail({
    to: user.email,
    subject: 'Confirme seu e-mail — Portal do Contador',
    text: `Olá ${user.name}, confirme seu e-mail em ${link}\nO link expira em 24 horas.`,
    html: `<p>Olá ${user.name},</p><p><a href="${link}">Confirmar e-mail</a></p><p>O link expira em 24 horas.</p>`,
  });
  return link;
}

async function verifyEmail(token) {
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch (e) {
    const err = new Error('Link inválido ou expirado');
    err.status = 400;
    throw err;
  }
  if (payload.type !== 'verify-email') {
    const err = new Error('Link inválido');
    err.status = 400;
    throw err;
  }
  const user = await User.findById(payload.sub);
  if (!user) {
    const err = new Error('Usuário não encontrado');
    err.status = 400;
    throw err;
  }
  if (!user.emailVerified) {
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();
  }
  // Agora que o e-mail é dele, aceita convites pendentes.
  await workspaceService.ensureUserContext(user);
  return user;
}

async function resendVerification(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('Usuário não encontrado');
    err.status = 404;
    throw err;
  }
  if (user.emailVerified) return { alreadyVerified: true };
  await sendVerificationEmail(user);
  return { sent: true };
}

async function register({ name, email, password, officeName, accountType, companyCnpj }) {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('E-mail já cadastrado');
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    officeName,
    accountType: accountType || 'personal',
    companyCnpj: companyCnpj || '',
  });
  await workspaceService.ensureUserContext(user);
  try {
    await sendVerificationEmail(user);
  } catch (e) {
    // Não bloqueia o cadastro se o e-mail falhar.
    // eslint-disable-next-line no-console
    console.error('[auth] falha ao enviar confirmação:', e.message);
  }
  return {
    user: publicUser(user),
    accessToken: signAccess(user),
    refreshToken: signRefresh(user),
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error('Credenciais inválidas');
    err.status = 401;
    throw err;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error('Credenciais inválidas');
    err.status = 401;
    throw err;
  }
  await workspaceService.ensureUserContext(user);
  return {
    user: publicUser(user),
    accessToken: signAccess(user),
    refreshToken: signRefresh(user),
  };
}

async function refresh({ refreshToken }) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_SECRET);
  } catch (e) {
    const err = new Error('Refresh token inválido');
    err.status = 401;
    throw err;
  }
  if (payload.type !== 'refresh') {
    const err = new Error('Refresh token inválido');
    err.status = 401;
    throw err;
  }
  const user = await User.findById(payload.sub);
  if (!user) {
    const err = new Error('Usuário não encontrado');
    err.status = 401;
    throw err;
  }
  return { accessToken: signAccess(user) };
}

async function loginWithGoogle({ idToken, accountType, officeName, companyCnpj }) {
  const clientId = process.env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const err = new Error('Login com Google não configurado');
    err.status = 500;
    throw err;
  }
  // eslint-disable-next-line global-require
  const { OAuth2Client } = require('google-auth-library');
  const googleClient = new OAuth2Client(clientId);
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Falha ao verificar token do Google:', e.message);
    const err = new Error('Token do Google inválido');
    err.status = 401;
    throw err;
  }
  if (!payload || !payload.email) {
    const err = new Error('Token do Google inválido');
    err.status = 401;
    throw err;
  }
  if (!payload.email_verified) {
    const err = new Error('O e-mail da conta Google não está verificado');
    err.status = 401;
    throw err;
  }
  let user = await User.findOne({ email: payload.email });
  if (!user) {
    if (!accountType) {
      const err = new Error('Escolha o tipo de conta para continuar');
      err.status = 428;
      err.code = 'ACCOUNT_TYPE_REQUIRED';
      throw err;
    }
    const isBusiness = accountType === 'business';
    const passwordHash = await bcrypt.hash(cryptoRandom(), 10);
    user = await User.create({
      name: payload.name || payload.email.split('@')[0],
      email: payload.email,
      passwordHash,
      officeName: isBusiness ? officeName || '' : '',
      accountType: isBusiness ? 'business' : 'personal',
      companyCnpj: isBusiness ? companyCnpj || '' : '',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  } else if (!user.emailVerified) {
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();
  }
  await workspaceService.ensureUserContext(user);
  return {
    user: publicUser(user),
    accessToken: signAccess(user),
    refreshToken: signRefresh(user),
  };
}

function cryptoRandom() {
  // eslint-disable-next-line global-require
  return require('crypto').randomBytes(32).toString('hex');
}

module.exports = {
  register,
  login,
  refresh,
  loginWithGoogle,
  verifyEmail,
  resendVerification,
  sendVerificationEmail,
  publicUser,
};
