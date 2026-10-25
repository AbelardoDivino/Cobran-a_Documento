const request = require('supertest');
const createApp = require('../src/app');

async function authToken(app) {
  await request(app).post('/api/auth/register').send({
    name: 'Cont',
    email: 'c@c.com',
    password: '12345678',
  });
  const login = await request(app).post('/api/auth/login').send({
    email: 'c@c.com',
    password: '12345678',
  });
  return login.body.accessToken;
}

describe('Etapa 3 — Clientes e Pedidos', () => {
  test('criar cliente → criar pedido com 3 itens → GET retorna 3 pendentes', async () => {
    const app = createApp();
    const token = await authToken(app);
    const auth = (r) => r.set('Authorization', `Bearer ${token}`);

    const cli = await auth(
      request(app).post('/api/clients').send({ name: 'Empresa X', email: 'x@x.com', phone: '119999' })
    );
    expect(cli.status).toBe(201);

    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString();
    const ped = await auth(
      request(app).post('/api/requests').send({
        clientId: cli.body._id,
        competencia: '2026-09',
        dueDate,
        items: ['Extrato bancário', 'Notas fiscais', 'Recibos'],
      })
    );
    expect(ped.status).toBe(201);
    expect(ped.body.request.publicToken).toBeDefined();

    const det = await auth(request(app).get(`/api/requests/${ped.body.request._id}`));
    expect(det.status).toBe(200);
    expect(det.body.items).toHaveLength(3);
    expect(det.body.items.every((i) => i.status === 'pending')).toBe(true);
  });

  test('usuário não acessa cliente nem pedido de outro (sem IDOR)', async () => {
    const app = createApp();
    await request(app).post('/api/auth/register').send({
      name: 'Dono',
      email: 'dono@idor.com',
      password: '12345678',
    });
    const loginA = await request(app).post('/api/auth/login').send({
      email: 'dono@idor.com',
      password: '12345678',
    });
    const tokenA = loginA.body.accessToken;
    const authA = (r) => r.set('Authorization', `Bearer ${tokenA}`);

    const cli = await authA(
      request(app).post('/api/clients').send({ name: 'Cliente A', email: 'a@idor.com' })
    );
    const ped = await authA(
      request(app).post('/api/requests').send({
        clientId: cli.body._id,
        competencia: '2026-09',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        items: ['Extrato'],
      })
    );

    await request(app).post('/api/auth/register').send({
      name: 'Intruso',
      email: 'intruso@idor.com',
      password: '12345678',
    });
    const loginB = await request(app).post('/api/auth/login').send({
      email: 'intruso@idor.com',
      password: '12345678',
    });
    const authB = (r) => r.set('Authorization', `Bearer ${loginB.body.accessToken}`);

    const clientB = await authB(request(app).get(`/api/clients/${cli.body._id}`));
    expect(clientB.status).toBe(404);

    const requestB = await authB(request(app).get(`/api/requests/${ped.body.request._id}`));
    expect(requestB.status).toBe(404);
  });
});
