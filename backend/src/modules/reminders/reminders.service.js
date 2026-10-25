const DocumentRequest = require('../../models/DocumentRequest');
const DocumentItem = require('../../models/DocumentItem');
const { sendMail } = require('../../lib/mailer');
const env = require('../../config/env');

function reminderWindow(now = new Date()) {
  const limit = new Date(now);
  limit.setDate(limit.getDate() + env.REMINDER_DAYS_BEFORE);
  return { now, limit };
}

// Retorna pedidos com ao menos 1 item pendente/rejeitado e dueDate dentro da janela
async function findPendingRequests(now = new Date()) {
  const { limit } = reminderWindow(now);
  const requests = await DocumentRequest.find({
    dueDate: { $gte: now, $lte: limit },
  }).populate('clientId');
  const result = [];
  for (const r of requests) {
    const pending = await DocumentItem.countDocuments({
      requestId: r._id,
      status: { $in: ['pending', 'rejected'] },
    });
    if (pending > 0) result.push({ request: r, pendingCount: pending });
  }
  return result;
}

async function runReminders(now = new Date()) {
  const targets = await findPendingRequests(now);
  let sent = 0;
  let failed = 0;
  for (const { request, pendingCount } of targets) {
    const to = request.clientId && request.clientId.email;
    if (!to) continue;
    const link = `${env.FRONTEND_URL}/u/${request.publicToken}`;
    try {
      await sendMail({
        to,
        subject: `Lembrete: ${pendingCount} documento(s) pendente(s) — ${request.competencia}`,
        text: `Olá ${request.clientId.name}, faltam ${pendingCount} documento(s) com vencimento em ${request.dueDate.toISOString().slice(0, 10)}.\n\nEnvie aqui: ${link}`,
        html: `<p>Olá ${request.clientId.name}, faltam <strong>${pendingCount} documento(s)</strong> com vencimento em ${request.dueDate.toISOString().slice(0, 10)}.</p><p><a href="${link}">Enviar documentos</a></p>`,
      });
      sent += 1;
    } catch (e) {
      // Uma falha de e-mail não pode interromper o lote.
      // eslint-disable-next-line no-console
      console.error(`[reminders] falha ao enviar para ${to}:`, e.message);
      failed += 1;
    }
  }
  return { checked: targets.length, sent, failed };
}

module.exports = { findPendingRequests, runReminders, reminderWindow };
