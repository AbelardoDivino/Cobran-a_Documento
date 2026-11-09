# Portal do Contador

Sistema SaaS para escritórios contábeis: cobrança de documentos dos clientes + controle financeiro do escritório.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 22 + Express |
| Banco | MongoDB Atlas + Mongoose |
| Auth | JWT (contador) + token público por pedido (cliente, sem login) |
| Frontend | React 18 (CRA) + React Router + TanStack Query |
| Pagamentos | Mercado Pago (Orders API — Pix, cartão, boleto) |
| Upload | Multer (disco local / volume Docker) |
| Lembretes | node-cron + Nodemailer |
| Testes | Jest + Supertest + mongodb-memory-server (backend) / Jest + RTL (frontend) |

## Estrutura

```
├── backend/          # API Express
│   ├── src/
│   │   ├── modules/  # auth, billing, clients, finance, reminders, requests, uploads, webhooks, workspace
│   │   ├── models/   # Mongoose schemas
│   │   ├── middlewares/
│   │   ├── lib/      # mongoose, mercadopago, mailer
│   │   └── config/   # env.js
│   ├── tests/        # 10 suites, 30 testes
│   └── Dockerfile
├── frontend/cobrar/  # React (CRA)
│   ├── src/
│   │   ├── pages/    # Login, Register, Dashboard, ClientDetail, NewRequest, PublicUpload, Billing, Finances*
│   │   ├── components/
│   │   ├── hooks/    # useAuth, useClients, useRequest, useFinance, useBilling
│   │   └── services/ # api.js (axios)
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Funcionalidades

- **Cobrança de documentos:** contador cria pedido com checklist por cliente, gera link público (sem login) para o cliente enviar documentos. Aprovação/rejeição pelo contador. Lembretes automáticos por e-mail.
- **Controle financeiro:** contas, lançamentos, categorização automática, importação de extrato (CSV/OFX), saldo real por conta, resumo mensal.
- **Assinatura (SaaS):** contador paga R$ 49-90/mês via Pix, cartão ou boleto (Mercado Pago Orders API). Renovação automática de cobrança.
- **Login com Google:** OAuth 2.0 via Google Identity Services.
- **Equipe:** convite de membros para o mesmo workspace.
- **LGPD:** exclusão em cascata (cliente + pedidos + itens + arquivos), token público aleatório (UUID v4), link de upload sem leitura de outros documentos.

## Variáveis de ambiente

### Backend (`backend/.env`)

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor (ex.: 4000) |
| `MONGO_URI` | String de conexão MongoDB Atlas |
| `JWT_SECRET` | Segredo JWT (32+ caracteres) |
| `JWT_EXPIRES_IN` | Validade do token (ex.: 15m) |
| `GOOGLE_CLIENT_ID` | Client ID do Google OAuth |
| `MP_ACCESS_TOKEN` | Access Token do Mercado Pago |
| `MP_WEBHOOK_SECRET` | Segredo do webhook MP |
| `FRONTEND_URL` | URL do frontend (CORS) |
| `SMTP_HOST` | Host SMTP (ex.: smtp.gmail.com) |
| `SMTP_PORT` | Porta SMTP (ex.: 587) |
| `SMTP_USER` | Usuário SMTP |
| `SMTP_PASS` | Senha de app SMTP |
| `UPLOADS_DIR` | Diretório de uploads (ex.: ./uploads) |
| `TRUST_PROXY` | 1 (atrás de proxy) |
| `REMINDER_DAYS_BEFORE` | Dias antes do vencimento para lembrete (padrão: 3) |
| `RENEWAL_DAYS_BEFORE` | Dias antes do vencimento para renovação (padrão: 3) |

### Frontend (`frontend/cobrar/.env.local`)

| Variável | Descrição |
|---|---|
| `REACT_APP_API_URL` | URL da API (ex.: https://backend.onrender.com) |
| `REACT_APP_MERCADOPAGO_PUBLIC_KEY` | Public Key do Mercado Pago |
| `REACT_APP_GOOGLE_CLIENT_ID` | Client ID do Google OAuth |

## Como rodar localmente

### Backend
```bash
cd backend
cp .env.example .env  # edite com suas credenciais
npm install
npm run dev           # nodemon, porta 4000
npm test              # 10 suites, 30 testes
```

### Frontend
```bash
cd frontend/cobrar
cp .env.example .env.local  # edite com suas credenciais
npm install
npm start               # porta 3000
npm test                # 6 suites, 9 testes
npm run build           # build de produção
```

### Docker (tudo junto)
```bash
cp .env.example .env  # raiz do projeto
docker compose --env-file .env up -d --build
curl http://localhost:4000/health  # deve retornar {"ok":true}
```

## Deploy (Render + Vercel)

### Backend (Render)
- Root Directory: `backend`
- Dockerfile Path: `./Dockerfile`
- Health Check Path: `/health`
- Adicione todas as env vars listadas acima
- `NODE_ENV=production`

### Frontend (Vercel)
- Root Directory: `frontend/cobrar`
- Framework: Create React App
- Env vars: `REACT_APP_API_URL`, `REACT_APP_MERCADOPAGO_PUBLIC_KEY`, `REACT_APP_GOOGLE_CLIENT_ID`

### Pós-deploy
- Atlas: liberar IP `0.0.0.0/0` (ou IP do Render)
- Mercado Pago: webhook URL `https://SEU-BACKEND/api/webhooks/mercadopago` (tópico: order)
- Google Console: adicionar domínio de produção em Authorized JavaScript origins

## Testes

```bash
# Backend (10 suites, 30 testes)
cd backend && npm test

# Frontend (6 suites, 9 testes)
cd frontend/cobrar && npm test
```

## Licença

MIT