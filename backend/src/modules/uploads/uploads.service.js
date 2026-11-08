const fs = require('fs');
const path = require('path');
const env = require('../../config/env');

const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg'];
const ALLOWED_EXT = ['.pdf', '.png', '.jpg', '.jpeg'];
const MAGIC = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/jpeg': [0xff, 0xd8, 0xff],
};

async function saveFile(buffer, originalName, mimeType) {
  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    const err = new Error('Extensão não permitida (use PDF, PNG ou JPG)');
    err.status = 400;
    throw err;
  }
  if (!ALLOWED_MIME.includes(mimeType)) {
    const err = new Error('Tipo de arquivo não permitido (use PDF, PNG ou JPG)');
    err.status = 400;
    throw err;
  }
  const magic = MAGIC[mimeType];
  if (magic && !magic.every((b, i) => buffer[i] === b)) {
    const err = new Error('Arquivo corrompido ou tipo inválido');
    err.status = 400;
    throw err;
  }
  const dir = path.resolve(env.UPLOADS_DIR);
  await fs.promises.mkdir(dir, { recursive: true });
  const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${path
    .basename(originalName)
    .replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const fullPath = path.join(dir, safe);
  await fs.promises.writeFile(fullPath, buffer);
  return `/uploads/${safe}`;
}

async function deleteFileByUrl(fileUrl) {
  if (!fileUrl || !String(fileUrl).startsWith('/uploads/')) return;
  const dir = path.resolve(env.UPLOADS_DIR);
  const fullPath = path.resolve(dir, path.basename(String(fileUrl)));
  if (!fullPath.startsWith(dir + path.sep)) return;
  try {
    await fs.promises.unlink(fullPath);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      // eslint-disable-next-line no-console
      console.error('[uploads] falha ao apagar arquivo órfão:', e.message);
    }
  }
}

module.exports = { saveFile, deleteFileByUrl, ALLOWED_MIME };
