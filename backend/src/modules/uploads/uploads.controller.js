const DocumentItem = require('../../models/DocumentItem');
const { saveFile, deleteFileByUrl } = require('./uploads.service');

async function showChecklist(docRequest) {
  const items = await DocumentItem.find({ requestId: docRequest._id });
  return {
    competencia: docRequest.competencia,
    dueDate: docRequest.dueDate,
    items: items.map((i) => ({
      id: i._id,
      label: i.label,
      status: i.status,
      rejectReason: i.rejectReason,
      fileUrl: i.fileUrl,
    })),
  };
}

async function uploadFile(docRequest, itemId, file) {
  if (!file) {
    const err = new Error('Arquivo ausente');
    err.status = 400;
    throw err;
  }
  const item = await DocumentItem.findOne({ _id: itemId, requestId: docRequest._id });
  if (!item) {
    const err = new Error('Item não encontrado');
    err.status = 404;
    throw err;
  }
  if (item.status === 'approved') {
    const err = new Error('Este documento já foi aprovado e não pode ser substituído');
    err.status = 409;
    throw err;
  }
  const previousUrl = item.fileUrl;
  const url = await saveFile(file.buffer, file.originalname, file.mimetype);
  item.fileUrl = url;
  item.status = 'received';
  item.uploadedAt = new Date();
  await item.save();
  if (previousUrl && previousUrl !== url) await deleteFileByUrl(previousUrl);
  return item;
}

module.exports = { showChecklist, uploadFile };
