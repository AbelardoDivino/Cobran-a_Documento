const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.SMTP_HOST) {
    // Fallback: stream transport (não envia de verdade; útil p/ dev/teste)
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  } else {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT, 10),
      secure: parseInt(env.SMTP_PORT, 10) === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  const info = await t.sendMail({
    from: env.SMTP_FROM || env.SMTP_USER || 'portal@contadores.local',
    to,
    subject,
    text,
    html,
  });
  return info;
}

// Permite mockar nos testes
function __setTransporter(mock) {
  transporter = mock;
}

module.exports = { sendMail, getTransporter, __setTransporter };
