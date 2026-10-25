const request = require('supertest');
const createApp = require('../src/app');
const { buildBoletoPayer } = require('../src/modules/billing/billing.service');

describe('Etapa 6 — Billing + Webhook (modo sandbox-local)', () => {
  test('card: subscribe → webhook ativa; pix: charge → webhook aprova; boleto: pending + barcode', async () => {
    const app = createApp();
    await request(app).post('/api/auth/register').send({
      name: 'Contador Billing',
      email: 'b@b.com',
      password: '12345678',
    });
    const login = await request(app).post('/api/auth/login').send({
      email: 'b@b.com',
      password: '12345678',
    });
    const token = login.body.accessToken;
    const auth = (r) => r.set('Authorization', `Bearer ${token}`);

    // cartão
    const card = await auth(
      request(app).post('/api/billing/subscribe/card').send({
        plan: 'mensal',
        cardToken: 'tok_teste_123',
      })
    );
    expect(card.status).toBe(201);
    expect(card.body.subscription.status).toBe('pending');

    const wh1 = await request(app).post('/api/webhooks/mercadopago').send({
      type: 'order',
      data: { id: card.body.mpSubscriptionId },
      status: 'processed',
    });
    expect(wh1.status).toBe(200);

    const st1 = await auth(request(app).get('/api/billing/status'));
    expect(st1.body.subscription.status).toBe('active');

    // pix
    const pix = await auth(request(app).post('/api/billing/charge/pix').send({ plan: 'mensal' }));
    expect(pix.status).toBe(201);
    expect(pix.body.charge.status).toBe('pending');
    expect(pix.body.charge.pixQrCode).toBeTruthy();

    const wh2 = await request(app).post('/api/webhooks/mercadopago').send({
      type: 'order',
      data: { id: pix.body.charge.mpPaymentId },
      status: 'processed',
    });
    expect(wh2.status).toBe(200);
    expect(wh2.body.charge.status).toBe('approved');

    // boleto
    const bol = await auth(request(app).post('/api/billing/charge/boleto').send({ plan: 'mensal' }));
    expect(bol.status).toBe(201);
    expect(bol.body.charge.status).toBe('pending');
    expect(bol.body.charge.boletoBarcode || bol.body.charge.boletoUrl).toBeTruthy();
  });

  test('plano trimestral libera 90 dias; webhook reenviado não soma dias e Pix novo não rebaixa', async () => {
    const app = createApp();
    await request(app).post('/api/auth/register').send({
      name: 'Contador Tri',
      email: 'tri@b.com',
      password: '12345678',
    });
    const login = await request(app).post('/api/auth/login').send({
      email: 'tri@b.com',
      password: '12345678',
    });
    const auth = (r) => r.set('Authorization', `Bearer ${login.body.accessToken}`);

    const card = await auth(
      request(app).post('/api/billing/subscribe/card').send({
        plan: 'trimestral',
        cardToken: 'tok_teste_123',
        idempotencyKey: 'teste-idempotencia-123',
      })
    );
    expect(card.status).toBe(201);
    const days = (new Date(card.body.subscription.currentPeriodEnd).getTime() - Date.now()) / 86400000;
    expect(days).toBeGreaterThan(89);
    expect(days).toBeLessThanOrEqual(90.1);

    const sendWebhook = () =>
      request(app).post('/api/webhooks/mercadopago').send({
        type: 'order',
        data: { id: card.body.mpSubscriptionId },
        status: 'processed',
      });
    expect((await sendWebhook()).status).toBe(200);
    const first = await auth(request(app).get('/api/billing/status'));
    const end1 = first.body.subscription.currentPeriodEnd;

    expect((await sendWebhook()).status).toBe(200);
    const second = await auth(request(app).get('/api/billing/status'));
    expect(second.body.subscription.currentPeriodEnd).toBe(end1);

    // Gerar Pix novo com assinatura ativa não pode rebaixar para pending.
    const pix = await auth(request(app).post('/api/billing/charge/pix').send({ plan: 'mensal' }));
    expect(pix.status).toBe(201);
    const third = await auth(request(app).get('/api/billing/status'));
    expect(third.body.subscription.status).toBe('active');

    const bad = await auth(request(app).post('/api/billing/charge/pix').send({ plan: 'semanal' }));
    expect(bad.status).toBe(400);
  });

  test('boleto: monta pagador do Mercado Pago e valida campos obrigatorios', () => {
    const payer = buildBoletoPayer({
      payerEmail: 'contador@teste.com',
      payer: {
        firstName: 'Ana',
        lastName: 'Souza',
        cpf: '123.456.789-09',
        address: {
          zipCode: '01310-100',
          streetName: 'Av Paulista',
          streetNumber: '1000',
          neighborhood: 'Bela Vista',
          city: 'Sao Paulo',
          state: 'sp',
        },
      },
    });
    expect(payer).toEqual({
      email: 'contador@teste.com',
      first_name: 'Ana',
      last_name: 'Souza',
      identification: { type: 'CPF', number: '12345678909' },
      address: {
        zip_code: '01310100',
        street_name: 'Av Paulista',
        street_number: '1000',
        neighborhood: 'Bela Vista',
        city: 'Sao Paulo',
        state: 'SP',
      },
    });

    expect(() => buildBoletoPayer({ payerEmail: 'a@b.com', payer: {} })).toThrow(/dados do pagador/);
    expect(() =>
      buildBoletoPayer({ payerEmail: 'a@b.com', payer: { firstName: 'A', lastName: 'B', cpf: '123', address: {} } })
    ).toThrow();
  });
});
