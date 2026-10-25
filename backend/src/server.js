const mongoose = require('mongoose');
const createApp = require('./app');
const { connectDB } = require('./lib/mongoose');
const env = require('./config/env');
const { startReminderJob } = require('./modules/reminders/reminders.job');
const { startRenewalJob } = require('./modules/billing/renewals.job');

function registerProcessHandlers(server) {
  // Sem isto, uma promise rejeitada sem catch derruba o processo (Node 15+).
  process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('Rejeição não tratada:', reason?.stack || reason);
  });
  const shutdown = (signal) => {
    // eslint-disable-next-line no-console
    console.log(`Recebido ${signal}, encerrando...`);
    server.close(() => {
      mongoose.connection.close(false).finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

async function start() {
  await connectDB(env.MONGO_URI);
  startReminderJob();
  startRenewalJob();
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend ouvindo na porta ${env.PORT}`);
  });
  registerProcessHandlers(server);
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      // eslint-disable-next-line no-console
      console.error(`Porta ${env.PORT} já está em uso. Encerre o outro processo e tente de novo.`);
    } else {
      // eslint-disable-next-line no-console
      console.error(`Erro no servidor: ${e.message}`);
    }
    process.exit(1);
  });
}

if (require.main === module) {
  start().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(`Falha ao iniciar o backend: ${e.message}`);
    // eslint-disable-next-line no-console
    console.error(
      'Confira MONGO_URI em backend/.env e libere o IP atual em Atlas > Network Access.'
    );
    process.exit(1);
  });
}

module.exports = start;
