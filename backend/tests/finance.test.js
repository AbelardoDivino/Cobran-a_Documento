const request = require('supertest');
const createApp = require('../src/app');

function brDate(day) {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day));
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

function ofxDate(day) {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day));
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}120000`;
}

async function registerUser(app, email, name = 'Contador Fin') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'senha123' });
  return res.body;
}

describe('Finanças — workspace, contas, importação e resumo', () => {
  let app;
  let token;
  let userId;
  let accountId;

  beforeEach(async () => {
    app = createApp();
    const registered = await registerUser(app, `fin${Date.now()}${Math.random()}@t.com`);
    token = registered.accessToken;
    userId = registered.user.id;
  });

  const auth = (r) => r.set('Authorization', `Bearer ${token}`);

  test('workspace Begin começa com 1 pessoa e bloqueia convite', async () => {
    const ws = await auth(request(app).get('/api/workspace'));
    expect(ws.status).toBe(200);
    expect(ws.body.workspace.tier).toBe('begin');
    expect(ws.body.members).toHaveLength(1);
    expect(ws.body.limits.members).toBe(1);

    const invite = await auth(
      request(app).post('/api/workspace/invite').send({ email: 'outro@t.com' })
    );
    expect(invite.status).toBe(403);
    expect(invite.body.error).toMatch(/Begin permite apenas 1 pessoa/);
  });

  test('importa CSV, deduplica reimportação e calcula resumo', async () => {
    const account = await auth(
      request(app).post('/api/finance/accounts').send({
        name: 'Conta PJ',
        bank: 'Banco do Brasil',
        initialBalance: 1000,
      })
    );
    expect(account.status).toBe(201);
    accountId = account.body._id;

    const csv = [
      'data;descricao;valor',
      `${brDate(5)};Supermercado Extra;-150,50`,
      `${brDate(6)};Pagamento de cliente;2.000,00`,
      `${brDate(7)};DAS Simples Nacional;-80,00`,
    ].join('\n');

    const first = await auth(
      request(app).post('/api/finance/import').send({ accountId, filename: 'extrato.csv', content: csv })
    );
    expect(first.status).toBe(201);
    expect(first.body.imported).toBe(3);
    expect(first.body.duplicates).toBe(0);

    const again = await auth(
      request(app).post('/api/finance/import').send({ accountId, filename: 'extrato.csv', content: csv })
    );
    expect(again.status).toBe(201);
    expect(again.body.imported).toBe(0);
    expect(again.body.duplicates).toBe(3);

    const list = await auth(request(app).get('/api/finance/transactions'));
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(3);
    const categories = list.body.items.map((t) => t.category);
    expect(categories).toContain('Alimentação');
    expect(categories).toContain('Impostos');

    const overview = await auth(request(app).get('/api/finance/overview'));
    expect(overview.status).toBe(200);
    expect(overview.body.totals.income).toBeCloseTo(2000, 2);
    expect(overview.body.totals.expense).toBeCloseTo(230.5, 2);
    expect(overview.body.totals.net).toBeCloseTo(1769.5, 2);
    expect(overview.body.totals.balance).toBeCloseTo(2769.5, 2);
    expect(overview.body.byCategory[0].category).toBeDefined();
    expect(overview.body.monthly).toHaveLength(1);
  });

  test('importa OFX do banco', async () => {
    const account = await auth(
      request(app).post('/api/finance/accounts').send({ name: 'Conta OFX' })
    );
    const ofx = `<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>${ofxDate(3)}<TRNAMT>-45.90<FITID>abc123<MEMO>Uber viagem</STMTTRN>
<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>${ofxDate(4)}<TRNAMT>500.00<FITID>def456<MEMO>Pix recebido</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;

    const res = await auth(
      request(app).post('/api/finance/import').send({ accountId: account.body._id, filename: 'extrato.ofx', content: ofx })
    );
    expect(res.status).toBe(201);
    expect(res.body.format).toBe('ofx');
    expect(res.body.imported).toBe(2);

    const list = await auth(request(app).get('/api/finance/transactions'));
    const uber = list.body.items.find((t) => t.description === 'Uber viagem');
    expect(uber.type).toBe('out');
    expect(uber.category).toBe('Transporte');
    expect(uber.amount).toBeCloseTo(45.9, 2);
  });

  test('plano Pro permite convidar até 10 pessoas e convite é aceito no cadastro', async () => {
    // Pro é liberado apenas via pagamento: cria assinatura ativa e depois o tier.
    const Subscription = require('../src/models/Subscription');
    const workspaceService = require('../src/modules/workspace/workspace.service');
    await Subscription.create({
      contadorId: userId,
      plan: 'mensal',
      method: 'pix',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    });
    await workspaceService.setTierForUser(userId, 'pro');

    const invite = await auth(
      request(app).post('/api/workspace/invite').send({ email: 'socio@t.com', name: 'Sócio' })
    );
    expect(invite.status).toBe(201);
    expect(invite.body.status).toBe('invited');

    const partner = await registerUser(app, 'socio@t.com', 'Sócio');
    const partnerToken = partner.accessToken;

    // Sem e-mail confirmado, o convite não é aceito (evita tomar conta de e-mail alheio).
    const before = await request(app)
      .get('/api/workspace')
      .set('Authorization', `Bearer ${partnerToken}`);
    expect(before.body.members).toHaveLength(1);
    expect(before.body.me.role).toBe('owner');

    // Confirma o e-mail → convite pendente é aceito.
    const jwt = require('jsonwebtoken');
    const env = require('../src/config/env');
    const verifyToken = jwt.sign({ type: 'verify-email' }, env.JWT_SECRET, {
      subject: String(partner.user.id),
      expiresIn: '1h',
    });
    const verified = await request(app).get(`/api/auth/verify-email?token=${verifyToken}`);
    expect(verified.status).toBe(302);

    const partnerWs = await request(app)
      .get('/api/workspace')
      .set('Authorization', `Bearer ${partnerToken}`);
    expect(partnerWs.body.members).toHaveLength(2);
    const roles = partnerWs.body.members.map((m) => m.status);
    expect(roles).toEqual(['active', 'active']);
    expect(partnerWs.body.me.role).toBe('member');
  });

  test('convite para conta existente sem e-mail confirmado fica pendente (sem acesso)', async () => {
    const Subscription = require('../src/models/Subscription');
    const workspaceService = require('../src/modules/workspace/workspace.service');
    await Subscription.create({
      contadorId: userId,
      plan: 'mensal',
      method: 'pix',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    });
    await workspaceService.setTierForUser(userId, 'pro');

    const attacker = await registerUser(app, 'invasor@t.com', 'Invasor');
    const invite = await auth(
      request(app).post('/api/workspace/invite').send({ email: 'invasor@t.com' })
    );
    expect(invite.status).toBe(201);
    expect(invite.body.status).toBe('invited');
    expect(invite.body.userId).toBeFalsy();

    const attackerWs = await request(app)
      .get('/api/workspace')
      .set('Authorization', `Bearer ${attacker.accessToken}`);
    expect(attackerWs.body.members).toHaveLength(1);
    expect(attackerWs.body.me.role).toBe('owner');
    expect(attackerWs.body.workspace.tier).toBe('begin');
  });

  test('Pro sem assinatura ativa é rebaixado para Begin', async () => {
    const workspaceService = require('../src/modules/workspace/workspace.service');
    await workspaceService.setTierForUser(userId, 'pro');

    const ws = await auth(request(app).get('/api/workspace'));
    expect(ws.status).toBe(200);
    expect(ws.body.workspace.tier).toBe('begin');
  });

  test('Pro com assinatura vencida é rebaixado e a assinatura é cancelada', async () => {
    const Subscription = require('../src/models/Subscription');
    const workspaceService = require('../src/modules/workspace/workspace.service');
    const sub = await Subscription.create({
      contadorId: userId,
      plan: 'mensal',
      method: 'pix',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() - 86400000),
    });
    await workspaceService.setTierForUser(userId, 'pro');

    const ws = await auth(request(app).get('/api/workspace'));
    expect(ws.body.workspace.tier).toBe('begin');
    const after = await Subscription.findById(sub._id);
    expect(after.status).toBe('canceled');
  });

  test('lançamento manual e exclusão', async () => {
    const account = await auth(request(app).post('/api/finance/accounts').send({ name: 'Carteira', type: 'cash' }));
    const created = await auth(
      request(app).post('/api/finance/transactions').send({
        accountId: account.body._id,
        date: new Date().toISOString(),
        description: 'Café na padaria',
        amount: 12.5,
        type: 'out',
      })
    );
    expect(created.status).toBe(201);
    expect(created.body.category).toBe('Alimentação');

    const removed = await auth(request(app).delete(`/api/finance/transactions/${created.body._id}`));
    expect(removed.status).toBe(200);

    const list = await auth(request(app).get('/api/finance/transactions'));
    expect(list.body.total).toBe(0);
  });
});
