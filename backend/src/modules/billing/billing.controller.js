const service = require('./billing.service');

async function subscribeCard(req, res, next) {
  try {
    const result = await service.createCardSubscription(req.user.id, {
      ...req.body,
      payerEmail: req.body.payerEmail || req.user.email,
    });
    return res.status(201).json(result);
  } catch (e) {
    return next(e);
  }
}

async function chargePix(req, res, next) {
  try {
    const result = await service.createPixCharge(req.user.id, {
      ...req.body,
      payerEmail: req.body.payerEmail || req.user.email,
    });
    return res.status(201).json(result);
  } catch (e) {
    return next(e);
  }
}

async function chargeBoleto(req, res, next) {
  try {
    const result = await service.createBoletoCharge(req.user.id, {
      ...req.body,
      payerEmail: req.body.payerEmail || req.user.email,
    });
    return res.status(201).json(result);
  } catch (e) {
    return next(e);
  }
}

async function status(req, res, next) {
  try {
    const result = await service.getStatus(req.user.id);
    return res.json(result);
  } catch (e) {
    return next(e);
  }
}

module.exports = { subscribeCard, chargePix, chargeBoleto, status };
