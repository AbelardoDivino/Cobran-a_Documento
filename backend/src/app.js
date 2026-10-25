const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const env = require('./config/env');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const clientsRoutes = require('./modules/clients/clients.routes');
const requestsRoutes = require('./modules/requests/requests.routes');
const uploadsRoutes = require('./modules/uploads/uploads.routes');
const uploadsFilesRoutes = require('./modules/uploads/files.routes');
const billingRoutes = require('./modules/billing/billing.routes');
const webhooksRoutes = require('./modules/webhooks/webhooks.routes');
const workspaceRoutes = require('./modules/workspace/workspace.routes');
const financeRoutes = require('./modules/finance/finance.routes');

function createApp() {
  const app = express();
  // Atrás do nginx. Use TRUST_PROXY=2 quando houver Cloudflare/Caddy na frente.
  app.set('trust proxy', env.TRUST_PROXY);
  app.use(helmet({ crossOriginResourcePolicy: false }));
  const corsOrigins = [env.FRONTEND_URL, ...String(env.CORS_ORIGINS || '').split(',')]
    .map((origin) => String(origin || '').trim().replace(/\/+$/, ''))
    .filter(Boolean);
  app.use(cors({ origin: corsOrigins.length ? corsOrigins : false, credentials: true }));
  app.use(express.json({ limit: '5mb' }));
  app.use(cookieParser());

  app.get('/health', (req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/clients', clientsRoutes);
  app.use('/api/requests', requestsRoutes);
  app.use('/api/public', uploadsRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/webhooks', webhooksRoutes);
  app.use('/api/workspace', workspaceRoutes);
  app.use('/api/finance', financeRoutes);

  // Arquivos enviados: servidos apenas por rota autenticada (LGPD).
  app.use('/uploads', uploadsFilesRoutes);

  // 404
  app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

  app.use(errorHandler);
  return app;
}

module.exports = createApp;
