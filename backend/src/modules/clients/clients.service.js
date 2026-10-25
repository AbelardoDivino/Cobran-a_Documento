const repo = require('./clients.repository');

async function listClients(contadorId) {
  return repo.list(contadorId);
}

async function createClient(contadorId, data) {
  if (!data.name || !data.email) {
    const err = new Error('Nome e e-mail são obrigatórios');
    err.status = 400;
    throw err;
  }
  return repo.create(contadorId, data);
}

async function getClient(contadorId, id) {
  return repo.getById(contadorId, id);
}

async function deleteClient(contadorId, id) {
  return repo.remove(contadorId, id);
}

module.exports = { listClients, createClient, getClient, deleteClient };
