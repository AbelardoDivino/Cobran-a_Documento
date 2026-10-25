const request = require('supertest');
const createApp = require('../src/app');

const jwt = require('jsonwebtoken');

const mockUsers = {
  'token-valido': { email: 'google@teste.com', name: 'Usuário Google', email_verified: true },
  'token-empresa': { email: 'empresa@teste.com', name: 'Empresa Google', email_verified: true },
  'token-nao-verificado': { email: 'nao-verificado@teste.com', name: 'Sem Verificação', email_verified: false },
};

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: async ({ idToken }) => {
      if (mockUsers[idToken]) {
        return { getPayload: () => mockUsers[idToken] };
      }
      throw new Error('invalid');
    },
  })),
}));

describe('Auth — Login com Google', () => {
  const app = createApp();

  test('1º acesso exige escolha do tipo de conta', async () => {
    const first = await request(app).post('/api/auth/google').send({ idToken: 'token-valido' });
    expect(first.status).toBe(428);
    expect(first.body.code).toBe('ACCOUNT_TYPE_REQUIRED');
  });

  test('idToken válido cria conta pessoal e loga no 2º acesso; inválido dá 401', async () => {
    const first = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'token-valido', accountType: 'personal' });
    expect(first.status).toBe(200);
    expect(first.body.accessToken).toBeDefined();
    expect(first.body.user.email).toBe('google@teste.com');
    expect(first.body.user.accountType).toBe('personal');

    const second = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'token-valido', accountType: 'business' });
    expect(second.status).toBe(200);
    expect(second.body.user.id).toBe(first.body.user.id);
    expect(second.body.user.accountType).toBe('personal');

    // token da sessão Google acessa rota protegida
    const me = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${second.body.accessToken}`);
    expect(me.status).toBe(200);

    const bad = await request(app).post('/api/auth/google').send({ idToken: 'lixo' });
    expect(bad.status).toBe(401);

    const empty = await request(app).post('/api/auth/google').send({});
    expect(empty.status).toBe(400);
  });

  test('cadastro empresarial grava tipo, empresa e CNPJ', async () => {
    const res = await request(app).post('/api/auth/google').send({
      idToken: 'token-empresa',
      accountType: 'business',
      officeName: 'Escritório Silva',
      companyCnpj: '12.345.678/0001-90',
    });
    expect(res.status).toBe(200);
    expect(res.body.user.accountType).toBe('business');
    expect(res.body.user.officeName).toBe('Escritório Silva');
    expect(res.body.user.companyCnpj).toBe('12.345.678/0001-90');
    expect(res.body.user.emailVerified).toBe(true);

    const payload = jwt.decode(res.body.accessToken);
    expect(payload.sub).toBe(res.body.user.id);
  });

  test('e-mail Google não verificado é recusado', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'token-nao-verificado', accountType: 'personal' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/não está verificado/);
  });
});
