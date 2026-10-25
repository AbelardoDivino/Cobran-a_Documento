const Subscription = require('../../models/Subscription');
const Charge = require('../../models/Charge');

async function upsertSubscription(contadorId, data) {
  let sub = await Subscription.findOne({ contadorId, status: { $ne: 'canceled' } });
  if (sub) {
    // Gerar cobrança nova (Pix/boleto) não pode rebaixar uma assinatura ativa.
    if (sub.status === 'active' && data.status === 'pending') return sub;
    Object.assign(sub, data);
    await sub.save();
    return sub;
  }
  sub = await Subscription.create({ contadorId, ...data });
  return sub;
}

async function getActiveSubscription(contadorId) {
  return Subscription.findOne({ contadorId, status: { $ne: 'canceled' } }).sort({ createdAt: -1 });
}

async function createCharge(subscriptionId, data) {
  return Charge.create({ subscriptionId, ...data });
}

async function findChargeByMpId(mpPaymentId) {
  return Charge.findOne({ mpPaymentId });
}

async function findSubscriptionByMpId(mpSubscriptionId) {
  return Subscription.findOne({ mpSubscriptionId });
}

module.exports = {
  upsertSubscription,
  getActiveSubscription,
  createCharge,
  findChargeByMpId,
  findSubscriptionByMpId,
};
