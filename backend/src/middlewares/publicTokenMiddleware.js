const DocumentRequest = require('../models/DocumentRequest');

// Valida o token público do pedido (acesso sem login do cliente final).
async function publicTokenMiddleware(req, res, next) {
  try {
    const { token } = req.params;
    if (!token) return res.status(404).json({ error: 'Pedido não encontrado' });
    const request = await DocumentRequest.findOne({ publicToken: token });
    if (!request) return res.status(404).json({ error: 'Pedido não encontrado' });
    if (request.expiresAt && request.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ error: 'Este link expirou' });
    }
    req.docRequest = request;
    return next();
  } catch (e) {
    return next(e);
  }
}

module.exports = publicTokenMiddleware;
