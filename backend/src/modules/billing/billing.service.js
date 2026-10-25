// Cobrança da assinatura do CONTADOR via Mercado Pago Orders API.
// Ref: Checkout Transparente via Orders (overview, cards, pix, boleto).
// Sem MP_ACCESS_TOKEN — ou com NODE_ENV=test — usa mock determinístico.
const crypto = require('crypto');
const env = require('../../config/env');
const repo = require('./billing.repository');
const workspaceService = require('../workspace/workspace.service');
const { isMockMode } = require('../../lib/mercadopago.client');

const PLAN_PRICES = { mensal: 90.0, trimestral: 243.0, anual: 864.0 };
const PLAN_DAYS = { mensal: 30, trimestral: 90, anual: 365 };

function assertPlan(plan) {
  if (!PLAN_PRICES[plan]) {
    const err = new Error('Plano inválido (use mensal, trimestral ou anual)');
    err.status = 400;
    throw err;
  }
}

function amountFor(plan) {
  return PLAN_PRICES[plan] ?? PLAN_PRICES.mensal;
}

function brl(amount) {
  return Number(amount).toFixed(2);
}

async function createOrderViaMP({
  amount,
  paymentMethod,
  payerEmail,
  payer,
  description,
  externalReference,
  idempotencyKey,
}) {
  if (!env.MP_ACCESS_TOKEN) return null;
  const body = {
    type: 'online',
    processing_mode: 'automatic',
    total_amount: brl(amount),
    description,
    external_reference: externalReference,
    payer: payer || { email: payerEmail },
    transactions: {
      payments: [{ amount: brl(amount), payment_method: paymentMethod }],
    },
  };
  let res;
  try {
    res = await fetch('https://api.mercadopago.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': idempotencyKey || crypto.randomUUID(),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    const err = new Error('Mercado Pago indisponível ou tempo esgotado. Tente novamente.');
    err.status = 502;
    throw err;
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const first = data?.errors?.[0];
    const err = new Error(first?.message || 'Não foi possível processar o pagamento.');
    err.status = res.status >= 400 && res.status < 500 ? 400 : 502;
    err.details = data?.errors || data;
    throw err;
  }
  return data;
}

function firstPayment(order) {
  return order?.transactions?.payments?.[0] || null;
}

function mapStatus(mpStatus) {
  if (mpStatus === 'approved' || mpStatus === 'processed') return 'approved';
  if (['rejected', 'failed', 'cancelled', 'canceled', 'refunded', 'charged_back'].includes(mpStatus)) {
    return 'rejected';
  }
  return 'pending';
}

function periodEndPlus(plan = 'mensal', base = new Date()) {
  const days = PLAN_DAYS[plan] || PLAN_DAYS.mensal;
  return new Date(base.getTime() + days * 24 * 3600 * 1000);
}

// Boleto exige pagador completo no Orders API (nome, CPF e endereco).
function buildBoletoPayer({ payer = {}, payerEmail }) {
  const address = payer.address || {};
  const required = {
    firstName: payer.firstName ?? payer.first_name,
    lastName: payer.lastName ?? payer.last_name,
    cpf: String(payer.cpf ?? payer.identification?.number ?? '').replace(/\D/g, ''),
    zipCode: address.zipCode ?? address.zip_code ?? payer.zipCode ?? payer.zip_code,
    streetName: address.streetName ?? address.street_name ?? payer.streetName ?? payer.street_name,
    streetNumber: address.streetNumber ?? address.street_number ?? payer.streetNumber ?? payer.street_number,
    neighborhood: address.neighborhood ?? payer.neighborhood,
    city: address.city ?? payer.city,
    state: address.state ?? address.federal_unit ?? payer.state ?? payer.federal_unit,
  };
  const missing = Object.entries(required)
    .filter(([, v]) => !String(v ?? '').trim())
    .map(([k]) => k);
  if (missing.length) {
    const err = new Error(
      `Para boleto, informe os dados do pagador: ${missing.join(', ')}`
    );
    err.status = 400;
    err.details = missing;
    throw err;
  }
  if (required.cpf.length !== 11) {
    const err = new Error('CPF invalido: informe 11 digitos');
    err.status = 400;
    err.details = ['cpf'];
    throw err;
  }
  return {
    email: payerEmail,
    first_name: required.firstName,
    last_name: required.lastName,
    identification: { type: 'CPF', number: required.cpf },
    address: {
      zip_code: String(required.zipCode).replace(/\D/g, ''),
      street_name: required.streetName,
      street_number: String(required.streetNumber),
      neighborhood: required.neighborhood,
      city: required.city,
      state: String(required.state).toUpperCase().slice(0, 2),
    },
  };
}

async function createCardSubscription(
  contadorId,
  { plan = 'mensal', cardToken, cardBrand, payerEmail, idempotencyKey }
) {
  assertPlan(plan);
  if (!cardToken) {
    const err = new Error('cardToken é obrigatório (gerado pelo Payment Brick no frontend)');
    err.status = 400;
    throw err;
  }
  const amount = amountFor(plan);
  const externalReference = `sub-${contadorId}-${Date.now()}`;

  let mpOrderId;
  let initialStatus = 'pending';
  if (isMockMode()) {
    mpOrderId = `mock-sub-${crypto.randomUUID()}`;
  } else {
    const order = await createOrderViaMP({
      amount,
      payerEmail,
      description: `Assinatura Portal do Contador — plano ${plan}`,
      externalReference,
      idempotencyKey,
      paymentMethod: {
        id: cardBrand || 'master',
        type: 'credit_card',
        token: cardToken,
        installments: 1,
      },
    });
    mpOrderId = String(order.id);
    initialStatus = mapStatus(firstPayment(order)?.status);
  }

  const current = await repo.getActiveSubscription(contadorId);
  const periodBase =
    current && current.status === 'active' && current.currentPeriodEnd > new Date()
      ? current.currentPeriodEnd
      : new Date();
  const sub = await repo.upsertSubscription(contadorId, {
    plan,
    method: 'card',
    status: initialStatus === 'approved' ? 'active' : 'pending',
    mpSubscriptionId: mpOrderId,
    // Renovação antecipada soma ao período atual, sem perder dias.
    currentPeriodEnd: periodEndPlus(plan, periodBase),
  });
  const charge = await repo.createCharge(sub._id, {
    mpPaymentId: mpOrderId,
    method: 'card',
    plan,
    status: initialStatus,
    amount,
    dueDate: new Date(),
    paidAt: initialStatus === 'approved' ? new Date() : undefined,
  });
  if (initialStatus === 'approved') {
    await workspaceService.setTierForUser(contadorId, 'pro');
  }
  return { subscription: sub, charge, mpSubscriptionId: mpOrderId };
}

async function createPixCharge(contadorId, { plan = 'mensal', payerEmail, idempotencyKey }) {
  assertPlan(plan);
  const amount = amountFor(plan);
  const externalReference = `pix-${contadorId}-${Date.now()}`;

  let mpOrderId;
  let qrCode = '';
  let qrBase64 = '';
  let initialStatus = 'pending';
  if (isMockMode()) {
    mpOrderId = `mock-pix-${crypto.randomUUID()}`;
    qrCode = `000201-mock-pix-${mpOrderId}`;
  } else {
    const order = await createOrderViaMP({
      amount,
      payerEmail,
      description: `Assinatura Portal do Contador — plano ${plan}`,
      externalReference,
      idempotencyKey,
      paymentMethod: { id: 'pix', type: 'bank_transfer' },
    });
    const payment = firstPayment(order);
    mpOrderId = String(order.id);
    qrCode = payment?.payment_method?.qr_code || '';
    qrBase64 = payment?.payment_method?.qr_code_base64 || '';
    initialStatus = mapStatus(payment?.status);
  }

  const sub = await repo.upsertSubscription(contadorId, {
    plan,
    method: 'pix',
    status: initialStatus === 'approved' ? 'active' : 'pending',
    currentPeriodEnd: periodEndPlus(plan),
  });
  const charge = await repo.createCharge(sub._id, {
    mpPaymentId: mpOrderId,
    method: 'pix',
    plan,
    status: initialStatus,
    amount,
    dueDate: new Date(),
    paidAt: initialStatus === 'approved' ? new Date() : undefined,
    pixQrCode: qrCode,
    pixQrBase64: qrBase64,
  });
  if (initialStatus === 'approved') {
    await workspaceService.setTierForUser(contadorId, 'pro');
  }
  return { subscription: sub, charge };
}

async function createBoletoCharge(contadorId, { plan = 'mensal', payerEmail, payer, idempotencyKey }) {
  assertPlan(plan);
  const amount = amountFor(plan);
  const externalReference = `bol-${contadorId}-${Date.now()}`;

  let mpOrderId;
  let boletoUrl = '';
  let boletoBarcode = '';
  let digitableLine = '';
  if (isMockMode()) {
    mpOrderId = `mock-bol-${crypto.randomUUID()}`;
    boletoUrl = `https://sandbox.mercadopago.com/boleto/${mpOrderId}`;
    boletoBarcode = `23793${String(Date.now()).slice(-20).padStart(20, '0')}`;
  } else {
    const order = await createOrderViaMP({
      amount,
      payerEmail,
      payer: buildBoletoPayer({ payer, payerEmail }),
      description: `Assinatura Portal do Contador — plano ${plan}`,
      externalReference,
      idempotencyKey,
      paymentMethod: { id: 'bolbradesco', type: 'ticket' },
    });
    const payment = firstPayment(order);
    mpOrderId = String(order.id);
    boletoUrl = payment?.payment_method?.ticket_url || '';
    boletoBarcode = payment?.payment_method?.barcode_content || '';
    digitableLine = payment?.payment_method?.digitable_line || '';
  }

  const sub = await repo.upsertSubscription(contadorId, {
    plan,
    method: 'boleto',
    status: 'pending',
    currentPeriodEnd: periodEndPlus(30),
  });
  // Guarda o pagador para gerar os próximos boletos sem pedir os dados de novo.
  if (payer) {
    sub.boletoPayer = { payer, payerEmail };
    await sub.save();
  }
  const charge = await repo.createCharge(sub._id, {
    mpPaymentId: mpOrderId,
    method: 'boleto',
    plan,
    status: 'pending',
    amount,
    dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    boletoUrl,
    boletoBarcode,
    boletoDigitableLine: digitableLine,
  });
  return { subscription: sub, charge };
}

async function getStatus(contadorId) {
  const subscription = await repo.getActiveSubscription(contadorId);
  return { subscription };
}

module.exports = { createCardSubscription, createPixCharge, createBoletoCharge, getStatus, buildBoletoPayer, PLAN_DAYS };

