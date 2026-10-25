const service = require('./requests.service');

async function create(req, res, next) {
  try {
    const { request, items } = await service.create(req.user.id, req.body);
    return res.status(201).json({ request, items });
  } catch (e) {
    return next(e);
  }
}

async function detail(req, res, next) {
  try {
    const data = await service.detail(req.user.id, req.params.id);
    return res.json(data);
  } catch (e) {
    return next(e);
  }
}

async function review(req, res, next) {
  try {
    const item = await service.review(req.user.id, req.params.id, req.params.itemId, req.body);
    return res.json(item);
  } catch (e) {
    return next(e);
  }
}

module.exports = { create, detail, review };
