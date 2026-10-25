// Instancia o SDK do Mercado Pago (Orders API).
// Se MP_ACCESS_TOKEN não estiver configurado, retorna null — os services
// usam um mock determinístico (modo sandbox-local) para não quebrar dev/teste.
const env = require('../config/env');

let cached = null;

function getMercadoPagoClient() {
  if (cached) return cached;
  if (!env.MP_ACCESS_TOKEN) return null;
  try {
    // eslint-disable-next-line global-require
    const { MercadoPagoConfig, Order } = require('mercadopago');
    const client = new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN });
    cached = { client, Order };
    return cached;
  } catch (e) {
    return null;
  }
}

function isMockMode() {
  // Testes automatizados nunca batem na API real (determinismo).
  // Dev/prod com MP_ACCESS_TOKEN usam a Orders API de verdade.
  return !env.MP_ACCESS_TOKEN || process.env.NODE_ENV === 'test';
}

module.exports = { getMercadoPagoClient, isMockMode };
