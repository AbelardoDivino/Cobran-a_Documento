# Cobran-a_Documento

## Login com Google

O botão "Fazer login com o Google" usa Google Identity Services e só aparece quando
o Client ID está configurado.

### Variáveis

- `backend/.env`: `GOOGLE_CLIENT_ID=...`
- `frontend/cobrar/.env.local`: `REACT_APP_GOOGLE_CLIENT_ID=...`
- Docker: `REACT_APP_GOOGLE_CLIENT_ID` é passado como build arg pelo `docker-compose.yml`.

Reinicie o `npm start` do frontend depois de alterar `.env.local` (o CRA lê as
variáveis apenas no boot).

### Google Cloud Console

Em **APIs & Services > Credentials > OAuth 2.0 Client ID (Web)**:

- **Authorized JavaScript origins**: `http://localhost:3000` e o domínio de produção
  (ex.: `https://app.seudominio.com`). Não é necessário redirect URI para este botão.
- **OAuth consent screen**: defina o nome do app como `Portal do Contador`; se o
  status for "Testing", adicione os e-mails em **Test users**.

O backend valida o ID token em `POST /api/auth/google` com `google-auth-library` e
cria o usuário (tipo pessoal) no primeiro acesso.

> Use sempre `http://localhost:3000`. O CRA está fixado em `PORT=3000`; se outra porta
> (ex.: 3001) for usada, o Google recusa com "The given origin is not allowed".

## Pagamentos (Mercado Pago)

O checkout transparente usa a **Orders API** (`/v1/orders`) com Pix, cartão e boleto.

### Variáveis

- `backend/.env`:
  - `MP_ACCESS_TOKEN`: Access Token **de teste** em desenvolvimento e **de produção** em produção.
  - `MP_WEBHOOK_SECRET`: segredo do webhook configurado no painel do Mercado Pago.
- `frontend/cobrar/.env.local`:
  - `REACT_APP_MERCADOPAGO_PUBLIC_KEY`: Public Key do **mesmo ambiente** do Access Token.

Use sempre o par de credenciais do mesmo ambiente (teste com teste, produção com produção).
Trocar as chaves exige reiniciar backend e frontend.

### Cartões de teste (Brasil)

| Bandeira | Número | CVV | Validade |
| --- | --- | --- | --- |
| Mastercard | 5480 8328 0103 3311 | 123 | 11/30 |
| Visa | 4235 6477 2802 5682 | 123 | 11/30 |
| Amex | 3753 651535 56885 | 1234 | 11/30 |

O resultado depende do nome do titular: `APRO` aprova, `OTHE` recusa, `CONT` deixa pendente
(use o CPF `12345678909`). O cartão `5031 4332 1540 6351` não é aceito pela Orders API.

### Webhook

Configure no painel do Mercado Pago a URL `https://seu-dominio/api/webhooks/mercadopago`
para o tópico **order**. A assinatura `x-signature` é validada com `MP_WEBHOOK_SECRET`.

> Pix e boleto só liberam o Pro quando o pagamento é confirmado pelo webhook. O cartão
> é aprovado na hora e libera o Pro na própria resposta.

## Deploy (Render + Vercel)

Neste formato o frontend fica na Vercel e a API no Render, em domínios diferentes
(os subdomínios gratuitos `*.vercel.app` e `*.onrender.com` já têm HTTPS). O
`frontend/cobrar/vercel.json` cuida das rotas do React Router e dos headers/CSP.

### Backend no Render

- Root Directory: `backend`
- Build Command: `npm ci --omit=dev`
- Start Command: `npm start`
- Health Check Path: `/health`
- Disco persistente: monte em `/var/data` e defina `UPLOADS_DIR=/var/data/uploads`.
  Sem disco (plano free), os arquivos enviados somem a cada deploy/restart.
- Use instância sempre ligada: os jobs de lembrete/renovação usam `node-cron` dentro
  do processo. No plano free o serviço dorme e os jobs não rodam.
- Variáveis: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
  `GOOGLE_CLIENT_ID`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`,
  `FRONTEND_URL=https://SEU-PROJETO.vercel.app`, `SMTP_HOST`, `SMTP_PORT`,
  `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `UPLOADS_DIR=/var/data/uploads`,
  `TRUST_PROXY=1`, `REMINDER_DAYS_BEFORE=3`, `RENEWAL_DAYS_BEFORE=3`.
  `BACKEND_URL` é opcional: o Render define `RENDER_EXTERNAL_URL` automaticamente.
  `CORS_ORIGINS` aceita URLs extras separadas por vírgula (ex.: previews da Vercel).

### Frontend na Vercel

- Root Directory: `frontend/cobrar`
- Framework: Create React App (build `npm run build`, saída `build`)
- Variáveis (Production e Preview):
  `REACT_APP_API_URL=https://SEU-BACKEND.onrender.com` (sem barra no final),
  `REACT_APP_GOOGLE_CLIENT_ID`, `REACT_APP_MERCADOPAGO_PUBLIC_KEY`.
- O CRA grava as variáveis no build: alterou alguma, faça **Redeploy**.
- Não use `PUBLIC_URL`/nginx neste formato; eles são só do deploy Docker.

### Ajustes externos

- Google Console: adicione `https://SEU-PROJETO.vercel.app` em **Authorized JavaScript
  origins**.
- Mercado Pago: cadastre `https://SEU-BACKEND.onrender.com/api/webhooks/mercadopago`
  (tópico **order**) e confirme que a Public Key do frontend é do mesmo aplicativo do
  `MP_ACCESS_TOKEN`.
- Atlas: libere o IP de saída do Render (ou `0.0.0.0/0`, com senha forte) e faça backup.
- `SMTP_HOST` continua obrigatório: sem ele o backend recusa iniciar em produção.
  Use Gmail (senha de app) ou Brevo/Resend para obter host, porta, usuário e senha.

## Deploy (Docker)

O frontend e a API ficam no **mesmo domínio**: o nginx serve o build do CRA e faz
proxy de `/api/` e `/uploads/` para o container do backend (porta 4000 interna).
Assim não há CORS nem necessidade de expor a porta 4000.

1. Copie `.env.example` para `.env` (raiz) e preencha:
   - `PUBLIC_URL`: URL pública do site (ex.: `https://app.seudominio.com`);
   - `REACT_APP_GOOGLE_CLIENT_ID`;
   - `REACT_APP_MERCADOPAGO_PUBLIC_KEY` (Public Key de **produção**);
   - deixe `REACT_APP_API_URL` **vazio** (usa caminhos relativos via proxy).
2. Em `backend/.env`, use as credenciais de **produção** do Mercado Pago:
   `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` e `MONGO_URI`, além de `JWT_SECRET`
   (mínimo 32 caracteres aleatórios) e `SMTP_HOST` (sem ele o backend não inicia).
   O `FRONTEND_URL` usado em produção vem do `PUBLIC_URL` definido no compose.
3. Suba os containers:

   ```bash
   docker compose --env-file .env up -d --build
   ```

4. No painel do Mercado Pago, cadastre o webhook `https://SEU_DOMINIO/api/webhooks/mercadopago`
   (tópico **order**) e copie o segredo para `MP_WEBHOOK_SECRET`.
5. Termine o TLS no servidor/proxy à frente do container (porta 80), ex.: Caddy,
   Traefik, Cloudflare ou nginx com Certbot.

Observações:

- `NODE_ENV=production` exige `MP_ACCESS_TOKEN`, `SMTP_HOST`, `JWT_SECRET` com 32+
  caracteres, `MP_WEBHOOK_SECRET` e `FRONTEND_URL` https público; sem isso o backend
  não inicia (evita modo mock e webhooks forjados).
- A renovação gera automaticamente uma nova cobrança Pix/boleto até 3 dias antes do
  vencimento e envia o link/código por e-mail. No cartão, o Mercado Pago não é usado como
  recorrência: o contador recebe um aviso por e-mail para pagar novamente (o cartão não é
  armazenado). O período só é estendido após a confirmação do pagamento. A antecedência
  pode ser ajustada em `RENEWAL_DAYS_BEFORE` (padrão: 3).
- O cadastro envia um link de confirmação de e-mail (validade de 24h). Enquanto não
  confirmar, o login por senha continua funcionando, mas convites de equipe não são
  aceitos e o login Google exige `email_verified`. O reenvio fica em
  `POST /api/auth/resend-verification`.
- `/register`, `/refresh`, `/login` e o upload público têm limite de tentativas por IP
  (ignorado em `NODE_ENV=test`). A senha mínima é 8 caracteres.
- Reenviar um documento apaga o arquivo anterior; excluir um cliente apaga pedidos,
  itens e os arquivos enviados (LGPD). As páginas `/privacidade` e `/termos` são
  servidas pelo frontend, e o nginx aplica CSP para Mercado Pago e Google.
- Arquivos enviados pelos clientes ficam em `uploads_data` e **não** são públicos:
  o download passa por `GET /uploads/:arquivo?token=<accessToken>` e só o contador
  dono do pedido tem acesso.
- O plano Pro expira em `currentPeriodEnd` (30/90/365 dias conforme o plano) e o
  workspace volta para o Begin no próximo acesso sem assinatura ativa.
- Em desenvolvimento (`npm start`), o CRA usa o campo `proxy` do `package.json` para
  encaminhar `/api` e `/uploads` ao backend em `http://localhost:4000`.


