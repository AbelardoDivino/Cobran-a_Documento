const crypto = require('crypto');
const DocumentRequest = require('../../models/DocumentRequest');
const DocumentItem = require('../../models/DocumentItem');

async function createRequest(contadorId, clientId, { competencia, dueDate, items }) {
  const publicToken = crypto.randomUUID();
  const request = await DocumentRequest.create({
    contadorId,
    clientId,
    competencia,
    dueDate,
    publicToken,
  });
  const labels = Array.isArray(items) && items.length ? items : [];
  const docs = await DocumentItem.insertMany(
    labels.map((label) => ({
      requestId: request._id,
      label: typeof label === 'string' ? label : label.label,
      status: 'pending',
    }))
  );
  return { request, items: docs };
}

async function getDetail(contadorId, id) {
  const request = await DocumentRequest.findOne({ _id: id, contadorId }).populate('clientId');
  if (!request) {
    const err = new Error('Pedido não encontrado');
    err.status = 404;
    throw err;
  }
  const items = await DocumentItem.find({ requestId: id });
  return { request, items };
}

async function reviewItem(contadorId, requestId, itemId, { status, rejectReason }) {
  const request = await DocumentRequest.findOne({ _id: requestId, contadorId });
  if (!request) {
    const err = new Error('Pedido não encontrado');
    err.status = 404;
    throw err;
  }
  if (!['approved', 'rejected'].includes(status)) {
    const err = new Error('Status inválido (use approved|rejected)');
    err.status = 400;
    throw err;
  }
  const item = await DocumentItem.findOne({ _id: itemId, requestId });
  if (!item) {
    const err = new Error('Item não encontrado');
    err.status = 404;
    throw err;
  }
  item.status = status;
  item.rejectReason = status === 'rejected' ? rejectReason || '' : '';
  await item.save();
  return item;
}

module.exports = { createRequest, getDetail, reviewItem };
