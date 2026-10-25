const request = require('supertest');
const createApp = require('../src/app');

describe('Etapa 2 — Autenticação do contador', () => {
  const app = createApp();

  test('registrar → logar → rota protegida 200 → sem token 401', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Contador Teste',
      email: 'contador@teste.com',
      password: '12345678',
      officeName: 'Escritório Teste',
    });
    expect(reg.status).toBe(201);
    expect(reg.body.accessToken).toBeDefined();
    expect(reg.body.user.emailVerified).toBe(false);

    const login = await request(app).post('/api/auth/login').send({
      email: 'contador@teste.com',
      password: '12345678',
    });
    expect(login.status).toBe(200);
    const token = login.body.accessToken;

    const ok = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${token}`);
    expect(ok.status).toBe(200);

    const noAuth = await request(app).get('/api/clients');
    expect(noAuth.status).toBe(401);

    // refresh
    const ref = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.refreshToken });
    expect(ref.status).toBe(200);
    expect(ref.body.accessToken).toBeDefined();
  });

  test('senha com menos de 8 caracteres é recusada', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Curta',
      email: 'curta@teste.com',
      password: '1234567',
    });
    expect(res.status).toBe(400);
  });

  test('reenvio de confirmação exige autenticação', async () => {
    const res = await request(app).post('/api/auth/resend-verification');
    expect(res.status).toBe(401);
  });
});
