/* Diagnóstico da conexão com o MongoDB Atlas.
 * Uso: npm run db:check (a partir de backend/)
 */
const mongoose = require('mongoose');
const env = require('../src/config/env');

function describe(uri) {
  try {
    const parsed = new URL(uri);
    const db = parsed.pathname.replace(/^\//, '') || '(default)';
    return `${parsed.hostname}/${db}`;
  } catch {
    return '(uri inválida)';
  }
}

(async () => {
  console.log(`Conectando em ${describe(env.MONGO_URI)}...`);
  try {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    const ping = await mongoose.connection.db.admin().ping();
    console.log('Ping:', ping);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Coleções em "${mongoose.connection.name}":`);
    for (const c of collections) {
      const total = await mongoose.connection.db.collection(c.name).countDocuments();
      console.log(`  - ${c.name}: ${total}`);
    }
    console.log('Conexão OK');
  } catch (e) {
    console.error('Falha na conexão:', e.message);
    console.error('Verifique MONGO_URI em backend/.env e o IP liberado no Atlas (Network Access).');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
