// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);

  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Erro interno';

  if (err.name === 'CastError') {
    status = 400;
    message = 'Identificador inválido';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = 'Dados inválidos';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'JSON inválido';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Arquivo/corpo da requisição muito grande';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = 'Arquivo muito grande (máximo 15MB)';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Registro já existe';
  }

  if (status >= 500) message = 'Erro interno';

  const body = { error: message };
  if (err.code) body.code = err.code;
  res.status(status).json(body);
}

module.exports = errorHandler;
