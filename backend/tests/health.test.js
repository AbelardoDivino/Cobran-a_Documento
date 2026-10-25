const request = require('supertest');
const mongoose = require('mongoose');
const createApp = require('../src/app');

describe('Etapa 1 — Setup e banco', () => {
  test('GET /health retorna 200', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('Mongo conectado (readyState === 1)', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });
});
