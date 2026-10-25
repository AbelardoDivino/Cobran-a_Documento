const crypto = require('crypto');
const { isValidSignature, mercadopago } = require('../src/modules/webhooks/webhooks.controller');
const env = require('../src/config/env');

function sign({ ts, requestId, dataId }) {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  return `ts=${ts},v1=${crypto
    .createHmac('sha256', env.MP_WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex')}`;
}

describe('Webhook — validação x-signature', () => {
  test('assinatura no formato do Mercado Pago passa; inválida ou ausente falha', () => {
    const ts = String(Date.now());
    const requestId = 'req-123';
    const dataId = 'ORD01ABC';

    expect(isValidSignature(sign({ ts, requestId, dataId }), requestId, dataId)).toBe(true);
    expect(isValidSignature(sign({ ts, requestId, dataId }), requestId, 'ORD01OUTRO')).toBe(false);
    expect(isValidSignature(sign({ ts, requestId, dataId }), requestId, undefined)).toBe(false);
    expect(isValidSignature('ts=1,v1=' + '0'.repeat(64), requestId, dataId)).toBe(false);
    expect(isValidSignature(undefined, requestId, dataId)).toBe(false);
  });

  test('devolve 5xx (e não 200) quando não consegue consultar o Mercado Pago', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      const ts = String(Date.now());
      const requestId = 'req-falha';
      const dataId = 'ORD-FALHA';
      const req = {
        body: { type: 'order', data: { id: dataId } },
        query: {},
        headers: {
          'x-signature': sign({ ts, requestId, dataId }),
          'x-request-id': requestId,
        },
      };
      let statusCode = 200;
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json() {
          return this;
        },
      };
      await mercadopago(req, res, (e) => {
        statusCode = e.status || 500;
      });
      expect(statusCode).toBeGreaterThanOrEqual(500);
    } finally {
      process.env.NODE_ENV = prev;
    }
  });
});
