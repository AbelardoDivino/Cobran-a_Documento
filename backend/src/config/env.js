const path = require('path');

// Carrega backend/.env independente do diretório de onde o processo foi iniciado.
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

function required(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') {
    if (process.env.NODE_ENV === 'test') return `test-${name}`;
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

const env = {
  PORT: process.env.PORT || '4000',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/portal-contadores',
  JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'test-secret' : required('JWT_SECRET')),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN || '',
  MP_WEBHOOK_SECRET:
    process.env.MP_WEBHOOK_SECRET ||
    (process.env.NODE_ENV === 'test' ? 'test-webhook-secret' : required('MP_WEBHOOK_SECRET')),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  // URL pública da API. No Render, RENDER_EXTERNAL_URL é preenchido automaticamente.
  BACKEND_URL: process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || '',
  // Origens extras de CORS (previews da Vercel), separadas por vírgula.
  CORS_ORIGINS: process.env.CORS_ORIGINS || '',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: process.env.SMTP_PORT || '587',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  UPLOADS_DIR: process.env.UPLOADS_DIR || './uploads',
  REMINDER_DAYS_BEFORE: parseInt(process.env.REMINDER_DAYS_BEFORE || '3', 10),
  RENEWAL_DAYS_BEFORE: parseInt(process.env.RENEWAL_DAYS_BEFORE || '3', 10),
  SMTP_FROM: process.env.SMTP_FROM || '',
  TRUST_PROXY: parseInt(process.env.TRUST_PROXY || '1', 10),
};

// Falha o boot em produção com configuração insegura/incompleta.
function assertProductionConfig(config) {
  if (process.env.NODE_ENV !== 'production') return;
  const problems = [];
  if (!config.MP_ACCESS_TOKEN) {
    problems.push('MP_ACCESS_TOKEN ausente (pagamentos cairiam no mock)');
  }
  if (!config.SMTP_HOST) {
    problems.push('SMTP_HOST ausente (lembretes não seriam enviados)');
  }
  if (!config.JWT_SECRET || config.JWT_SECRET.length < 32 || /troque/i.test(config.JWT_SECRET)) {
    problems.push('JWT_SECRET fraco (use 32+ caracteres aleatórios)');
  }
  if (!config.MP_WEBHOOK_SECRET || /troque/i.test(config.MP_WEBHOOK_SECRET)) {
    problems.push('MP_WEBHOOK_SECRET inválido');
  }
  if (!/^https:\/\//i.test(config.FRONTEND_URL) || /localhost|127\.0\.0\.1/i.test(config.FRONTEND_URL)) {
    problems.push('FRONTEND_URL deve ser a URL https pública');
  }
  if (problems.length) {
    throw new Error(`Configuração de produção inválida:\n- ${problems.join('\n- ')}`);
  }
}

assertProductionConfig(env);

module.exports = env;
