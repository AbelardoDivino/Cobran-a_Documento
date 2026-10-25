const service = require('./finance.service');

async function overview(req, res, next) {
  try {
    return res.json(await service.overview(req.user.id, req.query));
  } catch (e) {
    return next(e);
  }
}

async function listAccounts(req, res, next) {
  try {
    return res.json(await service.listAccounts(req.user.id));
  } catch (e) {
    return next(e);
  }
}

async function createAccount(req, res, next) {
  try {
    return res.status(201).json(await service.createAccount(req.user.id, req.body));
  } catch (e) {
    return next(e);
  }
}

async function updateAccount(req, res, next) {
  try {
    return res.json(await service.updateAccount(req.user.id, req.params.id, req.body));
  } catch (e) {
    return next(e);
  }
}

async function archiveAccount(req, res, next) {
  try {
    return res.json(await service.archiveAccount(req.user.id, req.params.id));
  } catch (e) {
    return next(e);
  }
}

async function listTransactions(req, res, next) {
  try {
    return res.json(await service.listTransactions(req.user.id, req.query));
  } catch (e) {
    return next(e);
  }
}

async function createTransaction(req, res, next) {
  try {
    return res.status(201).json(await service.createTransaction(req.user.id, req.body));
  } catch (e) {
    return next(e);
  }
}

async function deleteTransaction(req, res, next) {
  try {
    return res.json(await service.deleteTransaction(req.user.id, req.params.id));
  } catch (e) {
    return next(e);
  }
}

async function importStatement(req, res, next) {
  try {
    return res.status(201).json(await service.importStatement(req.user.id, req.body));
  } catch (e) {
    return next(e);
  }
}

async function categories(req, res) {
  return res.json(service.categories());
}

module.exports = {
  overview,
  listAccounts,
  createAccount,
  updateAccount,
  archiveAccount,
  listTransactions,
  createTransaction,
  deleteTransaction,
  importStatement,
  categories,
};
