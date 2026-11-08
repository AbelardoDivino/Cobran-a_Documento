const path = require('path');
const fs = require('fs');
const { Router } = require('express');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const DocumentItem = require('../../models/DocumentItem');
const DocumentRequest = require('../../models/DocumentRequest');

const router = Router();

function readToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  if (typeof req.query.token === 'string') return req.query.token;
  return null;
}

// Download autenticado dos arquivos enviados pelo cliente (LGPD).
// Aceita Authorization: Bearer ou ?token= (necessário para abrir em nova aba).
router.get('/:filename', async (req, res, next) => {
  try {
    const token = readToken(req);
    if (!token) return res.status(401).json({ error: 'Token ausente' });

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
    if (payload.type && payload.type !== 'access') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const filename = path.basename(req.params.filename);
    const item = await DocumentItem.findOne({ fileUrl: `/uploads/${filename}` });
    if (!item) return res.status(404).json({ error: 'Arquivo não encontrado' });

    const docRequest = await DocumentRequest.findById(item.requestId);
    if (!docRequest || String(docRequest.contadorId) !== String(payload.sub)) {
      return res.status(403).json({ error: 'Sem permissão para este arquivo' });
    }

    const fullPath = path.resolve(env.UPLOADS_DIR, filename);
    if (!fullPath.startsWith(path.resolve(env.UPLOADS_DIR))) {
      return res.status(400).json({ error: 'Nome de arquivo inválido' });
    }
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Arquivo não encontrado' });

    return res.sendFile(fullPath);
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
