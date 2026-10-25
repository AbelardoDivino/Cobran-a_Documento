const env = require('../../config/env');
const Subscription = require('../../models/Subscription');
const Charge = require('../../models/Charge');
const { sendMail } = require('../../lib/mailer');
const billingService = require('./billing.service');

const DAY_MS = 24 * 3600 * 1000;

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function brl(amount) {
  return `R$ ${Number(amount).toFixed(2).replace('.', ',')}`;
}

function billingLink() {
  return `${env.FRONTEND_URL}/billing`;
}

async function sendRenewalMail(user, sub, lines) {
  const link = billingLink();
  const text = `Olá ${user.name},\n\n${lines.join('\n')}\n\nAcesse: ${link}`;
  const html = `<p>Olá ${user.name},</p>${lines
    .map((line) => `<p>${line}</p>`)
    .join('')}<p><a href="${link}">Abrir cobrança</a></p>`;
  await sendMail({
    to: user.email,
    subject: `Renovação da assinatura — plano ${sub.plan}`,
    text,
    html,
  });
}

// Monta o e-mail com os dados da cobrança já gerada (Pix ou boleto).
async function sendChargeMail(user, sub, charge) {
  if (charge.method === 'pix') {
    await sendRenewalMail(user, sub, [
      `Sua assinatura vence em ${formatDate(sub.currentPeriodEnd)}.`,
      `Geramos automaticamente uma cobrança Pix de ${brl(charge.amount)}.`,
      `Pix copia e cola: ${charge.pixQrCode || 'abra a cobrança para copiar o código'}`,
    ]);
    return;
  }
  await sendRenewalMail(user, sub, [
    `Sua assinatura vence em ${formatDate(sub.currentPeriodEnd)}.`,
    `Geramos automaticamente um boleto de ${brl(charge.amount)}.`,
    charge.boletoUrl ? `Boleto: ${charge.boletoUrl}` : 'Abra a cobrança para visualizar o boleto.',
  ]);
}

// Gera a cobrança do próximo ciclo e avisa o contador por e-mail.
// Pix/boleto: nova cobrança automática. Cartão: aviso para repagar (o cartão não é armazenado).
async function runRenewals(now = new Date()) {
  const days = Number.isFinite(env.RENEWAL_DAYS_BEFORE) ? env.RENEWAL_DAYS_BEFORE : 3;
  const limit = new Date(now.getTime() + days * DAY_MS);
  const subs = await Subscription.find({
    status: 'active',
    currentPeriodEnd: { $gt: now, $lte: limit },
  }).populate('contadorId');

  let created = 0;
  let notified = 0;
  let failed = 0;

  for (const sub of subs) {
    const user = sub.contadorId;
    if (!user || !user.email) continue;
    try {
      if (sub.method === 'pix' || sub.method === 'boleto') {
        // Já existe uma cobrança em aberto deste ciclo — não duplica.
        const pending = await Charge.findOne({
          subscriptionId: sub._id,
          status: 'pending',
          method: sub.method,
        });
        if (pending) {
          // Reenvia o aviso se a cobrança existe mas o e-mail não saiu.
          if (sameCycle(sub.renewalNotifiedFor, sub.currentPeriodEnd)) continue;
          await sendChargeMail(user, sub, pending);
          sub.renewalNotifiedFor = sub.currentPeriodEnd;
          await sub.save();
          notified += 1;
          continue;
        }

        if (sub.method === 'pix') {
          const { charge } = await billingService.createPixCharge(String(user._id), {
            plan: sub.plan,
            payerEmail: user.email,
          });
          await sendChargeMail(user, sub, charge);
        } else {
          const saved = sub.boletoPayer;
          if (!saved || !saved.payer) {
            // Sem os dados do pagador não é possível gerar o boleto.
            if (!sameCycle(sub.renewalNotifiedFor, sub.currentPeriodEnd)) {
              await sendRenewalMail(user, sub, [
                `Sua assinatura vence em ${formatDate(sub.currentPeriodEnd)}.`,
                'Não foi possível gerar o boleto automático. Abra a cobrança para renovar.',
              ]);
              sub.renewalNotifiedFor = sub.currentPeriodEnd;
              await sub.save();
              notified += 1;
            }
            continue;
          }
          const { charge } = await billingService.createBoletoCharge(String(user._id), {
            plan: sub.plan,
            payerEmail: saved.payerEmail || user.email,
            payer: saved.payer,
          });
          await sendChargeMail(user, sub, charge);
        }
        sub.renewalNotifiedFor = sub.currentPeriodEnd;
        await sub.save();
        created += 1;
      } else {
        // Cartão não é armazenado pelo Mercado Pago: avisa uma vez por ciclo.
        if (sameCycle(sub.renewalNotifiedFor, sub.currentPeriodEnd)) continue;
        await sendRenewalMail(user, sub, [
          `Sua assinatura vence em ${formatDate(sub.currentPeriodEnd)}.`,
          'Para renovar no cartão, abra a cobrança e informe o cartão novamente.',
          'O cartão não fica armazenado no Portal do Contador.',
        ]);
        sub.renewalNotifiedFor = sub.currentPeriodEnd;
        await sub.save();
        notified += 1;
      }
    } catch (e) {
      failed += 1;
      // eslint-disable-next-line no-console
      console.error(`[renewals] falha para ${user.email}:`, e.message);
    }
  }

  return { checked: subs.length, created, notified, failed };
}

function sameCycle(marked, periodEnd) {
  if (!marked || !periodEnd) return false;
  return new Date(marked).getTime() === new Date(periodEnd).getTime();
}

module.exports = { runRenewals };
