const crypto = require('crypto');
const env = require('../../config/env');
const Charge = require('../../models/Charge');
const Subscription = require('../../models/Subscription');
const workspaceService = require('../workspace/workspace.service');

const PLAN_DAYS = { mensal: 30, trimestral: 90, anual: 365 };
const DAY_MS = 24 * 3600 * 1000;

function isApproved(status) {
  return status === 'approved' || status === 'processed' || status === 'active';
}

function isRejected(status) {
  return ['rejected', 'failed', 'cancelled', 'canceled', 'refunded', 'charged_back'].includes(status);
}

function parseSignature(header) {
  if (!header) return null;
  const parts = {};
  String(header).split(',').forEach((chunk) => {
    const [key, ...rest] = chunk.split('=');
    if (key && rest.length) parts[key.trim()] = rest.join('=').trim();
  });
  return parts.ts && parts.v1 ? parts : null;
}

// Assinatura oficial do Mercado Pago:
// manifest = "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
// HMAC-SHA256(manifest, MP_WEBHOOK_SECRET)
function isValidSignature(signature, requestId, dataId) {
  if (!env.MP_WEBHOOK_SECRET) return true;
  const parsed = parseSignature(signature);
  if (!parsed || !dataId) return false;
  const candidates = [String(dataId), String(dataId).toLowerCase()];
  return candidates.some((id) => {
    const manifest = `id:${id};request-id:${requestId || ''};ts:${parsed.ts};`;
    const expected = crypto
      .createHmac('sha256', env.MP_WEBHOOK_SECRET)
      .update(manifest)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parsed.v1));
    } catch {
      return false;
    }
  });
}

async function fetchMpResource(path) {
  if (!env.MP_ACCESS_TOKEN) {
    const err = new Error('Mercado Pago não configurado');
    err.status = 503;
    throw err;
  }
  let res;
  try {
    res = await fetch(`https://api.mercadopago.com${path}`, {
      headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    const err = new Error('Mercado Pago indisponível');
    err.status = 502;
    throw err;
  }
  // 5xx aqui faz o Mercado Pago reenviar a notificação (não responda 200).
  if (!res.ok) {
    const err = new Error(`Falha ao consultar o Mercado Pago (${res.status})`);
    err.status = 502;
    throw err;
  }
  return res.json();
}

async function resolveStatus({ type, id }) {
  if (type === 'payment') {
    const payment = await fetchMpResource(`/v1/payments/${id}`);
    return { status: payment?.status, resource: payment };
  }
  const order = await fetchMpResource(`/v1/orders/${id}`);
  const payment = order?.transactions?.payments?.[0];
  return { status: payment?.status || order?.status, resource: order };
}

// Só estende o período quando o pagamento é novo (transição para approved).
// Reentregas do mesmo webhook não podem somar dias de novo.
async function activateSubscription(sub, { extend = false, plan } = {}) {
  const now = new Date();
  const targetPlan = PLAN_DAYS[plan] ? plan : sub.plan;
  sub.plan = PLAN_DAYS[targetPlan] ? targetPlan : 'mensal';
  const base =
    extend && sub.status === 'active' && sub.currentPeriodEnd && sub.currentPeriodEnd > now
      ? sub.currentPeriodEnd
      : now;
  sub.status = 'active';
  sub.currentPeriodEnd = new Date(base.getTime() + (PLAN_DAYS[sub.plan] || 30) * DAY_MS);
  await sub.save();
  if (sub.contadorId) {
    await workspaceService.setTierForUser(sub.contadorId, 'pro');
  }
  return sub;
}

async function revokeSubscription(sub) {
  sub.status = 'canceled';
  await sub.save();
  if (sub.contadorId) {
    await workspaceService.setTierForUser(sub.contadorId, 'begin');
  }
  return sub;
}

async function applyChargeStatus(charge, status) {
  const wasApproved = charge.status === 'approved' || Boolean(charge.paidAt);
  if (isApproved(status)) {
    charge.status = 'approved';
    charge.paidAt = charge.paidAt || new Date();
  } else if (isRejected(status)) {
    charge.status = 'rejected';
  } else {
    charge.status = 'pending';
  }
  await charge.save();

  const sub = await Subscription.findById(charge.subscriptionId);
  if (!sub) return charge;

  if (charge.status === 'approved' && !wasApproved) {
    await activateSubscription(sub, { extend: true, plan: charge.plan });
  } else if (charge.status === 'rejected' && wasApproved) {
    // Reembolso/chargeback revoga o Pro.
    await revokeSubscription(sub);
  }
  return charge;
}

async function applySubscriptionStatus(sub, status) {
  if (isApproved(status)) {
    if (sub.status !== 'active') await activateSubscription(sub, { extend: false });
  } else if (isRejected(status) || status === 'canceled') {
    await revokeSubscription(sub);
  } else {
    sub.status = 'pending';
    await sub.save();
  }
  return sub;
}

async function mercadopago(req, res, next) {
  try {
    const body = req.body || {};
    const dataId = body.data?.id || req.query['data.id'] || req.query.id || undefined;
    const type = body.type || req.query.type || req.query.topic || undefined;

    // Em testes o Mercado Pago não é acessível; o status vem do próprio payload.
    // Em qualquer outro ambiente o status é sempre consultado na API do MP.
    if (process.env.NODE_ENV !== 'test') {
      if (!isValidSignature(req.headers['x-signature'], req.headers['x-request-id'], dataId)) {
        return res.status(401).json({ error: 'Assinatura inválida' });
      }
    }

    if (!dataId) return res.status(200).json({ ok: true, ignored: true });

    const mpStatus =
      process.env.NODE_ENV === 'test' ? body.status : (await resolveStatus({ type, id: dataId })).status;

    if (!mpStatus) return res.status(200).json({ ok: true, ignored: true });

    const charge = await Charge.findOne({ mpPaymentId: String(dataId) });
    if (charge) {
      await applyChargeStatus(charge, mpStatus);
      const fresh = await Charge.findById(charge._id);
      return res.json({ ok: true, charge: fresh || charge });
    }

    const sub = await Subscription.findOne({ mpSubscriptionId: String(dataId) });
    if (sub) {
      await applySubscriptionStatus(sub, mpStatus);
      return res.json({ ok: true, subscription: sub });
    }

    return res.status(200).json({ ok: true, ignored: true });
  } catch (e) {
    return next(e);
  }
}

module.exports = { mercadopago, isValidSignature };
