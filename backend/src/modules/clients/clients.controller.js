const service = require('./clients.service');

async function list(req, res, next) {
  try {
    const clients = await service.listClients(req.user.id);
    return res.json(clients);
  } catch (e) {
    return next(e);
  }
}

async function create(req, res, next) {
  try {
    const client = await service.createClient(req.user.id, req.body);
    return res.status(201).json(client);
  } catch (e) {
    return next(e);
  }
}

async function detail(req, res, next) {
  try {
    const client = await service.getClient(req.user.id, req.params.id);
    return res.json(client);
  } catch (e) {
    return next(e);
  }
}

async function remove(req, res, next) {
  try {
    const result = await service.deleteClient(req.user.id, req.params.id);
    return res.json(result);
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, create, detail, remove };
