const { runRenewals } = require('../src/modules/billing/renewals.service');
const { __setTransporter } = require('../src/lib/mailer');
const User = require('../src/models/User');
const Subscription = require('../src/models/Subscription');
const Charge = require('../src/models/Charge');

const NOW = new Date('2026-09-20T12:00:00Z');
const IN_2_DAYS = new Date('2026-09-22T12:00:00Z');

async function makeUser(email) {
  return User.create({ name: 'Contador Renovação', email, passwordHash: 'x', emailVerified: true });
}

async function makeSub(user, method, extra = {}) {
  return Subscription.create({
    contadorId: user._id,
    plan: 'mensal',
    method,
    status: 'active',
    currentPeriodEnd: IN_2_DAYS,
    ...extra,
  });
}

describe('Renovação automática', () => {
  let sent;

  beforeEach(() => {
    sent = [];
    __setTransporter({
      sendMail: async (m) => {
        sent.push(m);
        return { messageId: 'x' };
      },
    });
  });

  afterEach(() => {
    __setTransporter(null);
  });

  test('Pix gera nova cobrança e não duplica no dia seguinte', async () => {
    const user = await makeUser('pix@t.com');
    const sub = await makeSub(user, 'pix');

    const first = await runRenewals(NOW);
    expect(first.created).toBe(1);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('pix@t.com');
    expect(sent[0].text).toMatch(/Pix copia e cola/);

    const charges = await Charge.find({ subscriptionId: sub._id });
    expect(charges).toHaveLength(1);
    expect(charges[0].status).toBe('pending');
    expect(charges[0].method).toBe('pix');

    const again = await runRenewals(new Date(NOW.getTime() + 24 * 3600 * 1000));
    expect(again.created).toBe(0);
    expect(await Charge.countDocuments({ subscriptionId: sub._id })).toBe(1);
    expect(sent).toHaveLength(1);
  });

  test('boleto usa o pagador salvo e gera nova cobrança', async () => {
    const user = await makeUser('bol@t.com');
    const sub = await makeSub(user, 'boleto', {
      boletoPayer: {
        payerEmail: 'bol@t.com',
        payer: {
          firstName: 'Ana',
          lastName: 'Silva',
          cpf: '12345678901',
          address: {
            zipCode: '01001000',
            streetName: 'Rua A',
            streetNumber: '1',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
          },
        },
      },
    });

    const result = await runRenewals(NOW);
    expect(result.created).toBe(1);
    const charge = await Charge.findOne({ subscriptionId: sub._id });
    expect(charge.method).toBe('boleto');
    expect(charge.boletoUrl).toBeTruthy();
    expect(sent).toHaveLength(1);
  });

  test('cartão recebe um único aviso por ciclo (não armazenamos cartão)', async () => {
    const user = await makeUser('card@t.com');
    const sub = await makeSub(user, 'card');

    const first = await runRenewals(NOW);
    expect(first.notified).toBe(1);
    expect(first.created).toBe(0);
    expect(await Charge.countDocuments({ subscriptionId: sub._id })).toBe(0);
    expect(sent).toHaveLength(1);
    expect(sent[0].text).toMatch(/cartão não fica armazenado/i);

    const again = await runRenewals(new Date(NOW.getTime() + 24 * 3600 * 1000));
    expect(again.notified).toBe(0);
    expect(sent).toHaveLength(1);
  });

  test('assinatura fora da janela não é cobrada', async () => {
    const user = await makeUser('longe@t.com');
    await Subscription.create({
      contadorId: user._id,
      plan: 'mensal',
      method: 'pix',
      status: 'active',
      currentPeriodEnd: new Date('2026-10-20T12:00:00Z'),
    });
    const result = await runRenewals(NOW);
    expect(result.checked).toBe(0);
    expect(sent).toHaveLength(0);
  });
});
