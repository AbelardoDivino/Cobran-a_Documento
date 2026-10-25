const request = require('supertest');
const createApp = require('../src/app');

describe('Etapa 4 — Upload público', () => {
  test('GET sem auth 200 → upload → received + fileUrl → token inválido 404', async () => {
    const app = createApp();
    await request(app).post('/api/auth/register').send({
      name: 'Contador Upload',
      email: 'u@u.com',
      password: '12345678',
    });
    const login = await request(app).post('/api/auth/login').send({
      email: 'u@u.com',
      password: '12345678',
    });
    const token = login.body.accessToken;
    const auth = (r) => r.set('Authorization', `Bearer ${token}`);

    const cli = await auth(
      request(app).post('/api/clients').send({ name: 'Emp', email: 'e@e.com' })
    );
    const ped = await auth(
      request(app).post('/api/requests').send({
        clientId: cli.body._id,
        competencia: '2026-09',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        items: ['Extrato bancário'],
      })
    );
    const publicToken = ped.body.request.publicToken;
    const itemId = ped.body.items[0]._id;

    // sem header de auth
    const get1 = await request(app).get(`/api/public/requests/${publicToken}`);
    expect(get1.status).toBe(200);

    const up = await request(app)
      .post(`/api/public/requests/${publicToken}/items/${itemId}/upload`)
      .attach('file', Buffer.from('%PDF-1.4 fake'), {
        filename: 'extrato.pdf',
        contentType: 'application/pdf',
      });
    expect(up.status).toBe(201);
    expect(up.body.status).toBe('received');
    expect(up.body.fileUrl).toBeTruthy();

    const get2 = await request(app).get(`/api/public/requests/${publicToken}`);
    expect(get2.body.items[0].status).toBe('received');

    // arquivo só é acessível pelo contador dono do pedido (via token)
    const filePath = up.body.fileUrl;
    expect(filePath.startsWith('/uploads/')).toBe(true);

    const noAuth = await request(app).get(filePath);
    expect(noAuth.status).toBe(401);

    const okDownload = await request(app).get(`${filePath}?token=${token}`);
    expect(okDownload.status).toBe(200);

    const other = await request(app).post('/api/auth/register').send({
      name: 'Outro Contador',
      email: 'outro@u.com',
      password: '12345678',
    });
    const otherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'outro@u.com', password: '12345678' });
    expect(other.status).toBe(201);
    const forbidden = await request(app).get(
      `${filePath}?token=${otherLogin.body.accessToken}`
    );
    expect(forbidden.status).toBe(403);

    // Reenvio apaga o arquivo anterior (sem órfãos).
    const up2 = await request(app)
      .post(`/api/public/requests/${publicToken}/items/${itemId}/upload`)
      .attach('file', Buffer.from('%PDF-1.4 novo'), {
        filename: 'extrato-novo.pdf',
        contentType: 'application/pdf',
      });
    expect(up2.status).toBe(201);
    expect(up2.body.fileUrl).not.toBe(filePath);
    const oldFile = await request(app).get(`${filePath}?token=${token}`);
    expect(oldFile.status).toBe(404);

    // Exclusão do cliente (LGPD) apaga o arquivo do item.
    const removed = await auth(request(app).delete(`/api/clients/${cli.body._id}`));
    expect(removed.status).toBe(200);
    const deletedFile = await request(app).get(`${up2.body.fileUrl}?token=${token}`);
    expect(deletedFile.status).toBe(404);

    const bad = await request(app).get('/api/public/requests/token-invalido-xyz');
    expect(bad.status).toBe(404);
  });
});
