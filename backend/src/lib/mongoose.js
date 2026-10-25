const mongoose = require('mongoose');

function describe(uri) {
  try {
    const parsed = new URL(uri);
    const db = parsed.pathname.replace(/^\//, '') || '(default)';
    return `${parsed.hostname}/${db}`;
  } catch {
    return '(uri inválida)';
  }
}

async function connectDB(uri) {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    // eslint-disable-next-line no-console
    console.log(`Mongo conectado em ${describe(uri)}`);
  });
  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('Mongo desconectado');
  });
  mongoose.connection.on('error', (e) => {
    // eslint-disable-next-line no-console
    console.error('Erro de conexão com o Mongo:', e.message);
  });

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
}

module.exports = { connectDB };
