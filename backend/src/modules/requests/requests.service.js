const repo = require('./requests.repository');
const Client = require('../../models/Client');

async function create(contadorId, { clientId, competencia, dueDate, items }) {
  if (!clientId || !competencia || !dueDate) {
    const err = new Error('clientId, competencia e dueDate são obrigatórios');
    err.status = 400;
    throw err;
  }
  const client = await Client.findOne({ _id: clientId, contadorId });
  if (!client) {
    const err = new Error('Cliente não encontrado');
    err.status = 404;
    throw err;
  }
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('Informe ao menos 1 item de checklist');
    err.status = 400;
    throw err;
  }
  return repo.createRequest(contadorId, clientId, { competencia, dueDate, items });
}

async function detail(contadorId, id) {
  return repo.getDetail(contadorId, id);
}

async function review(contadorId, requestId, itemId, payload) {
  return repo.reviewItem(contadorId, requestId, itemId, payload);
}

module.exports = { create, detail, review };
