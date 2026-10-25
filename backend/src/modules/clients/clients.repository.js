const Client = require('../../models/Client');
const DocumentRequest = require('../../models/DocumentRequest');
const DocumentItem = require('../../models/DocumentItem');
const { deleteFileByUrl } = require('../uploads/uploads.service');

async function list(contadorId) {
  return Client.find({ contadorId }).sort({ createdAt: -1 });
}

async function create(contadorId, data) {
  return Client.create({ ...data, contadorId });
}

async function getById(contadorId, id) {
  const client = await Client.findOne({ _id: id, contadorId });
  if (!client) {
    const err = new Error('Cliente não encontrado');
    err.status = 404;
    throw err;
  }
  return client;
}

// LGPD — direito de exclusão: remove cliente + pedidos + itens
async function remove(contadorId, id) {
  const client = await Client.findOne({ _id: id, contadorId });
  if (!client) {
    const err = new Error('Cliente não encontrado');
    err.status = 404;
    throw err;
  }
  const requests = await DocumentRequest.find({ clientId: id });
  const requestIds = requests.map((r) => r._id);
  let files = [];
  if (requestIds.length) {
    const items = await DocumentItem.find({ requestId: { $in: requestIds } });
    files = items.map((i) => i.fileUrl).filter(Boolean);
    await DocumentItem.deleteMany({ requestId: { $in: requestIds } });
    await DocumentRequest.deleteMany({ _id: { $in: requestIds } });
  }
  await client.deleteOne();
  // LGPD: apaga também os arquivos enviados pelo cliente.
  await Promise.all(files.map((url) => deleteFileByUrl(url)));
  return { deleted: true };
}

module.exports = { list, create, getById, remove };
