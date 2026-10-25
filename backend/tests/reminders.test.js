const { runReminders } = require('../src/modules/reminders/reminders.service');
const { __setTransporter } = require('../src/lib/mailer');
const User = require('../src/models/User');
const Client = require('../src/models/Client');
const DocumentRequest = require('../src/models/DocumentRequest');
const DocumentItem = require('../src/models/DocumentItem');
const crypto = require('crypto');

describe('Etapa 5 — Lembretes', () => {
  test('envia só para pedidos pendentes na janela, nunca para completos', async () => {
    const sent = [];
    __setTransporter({ sendMail: async (m) => { sent.push(m); return { messageId: 'x' }; } });

    const user = await User.create({
      name: 'Contador Lembrete',
      email: 'c@c.com',
      passwordHash: 'x',
    });
    const client = await Client.create({ contadorId: user._id, name: 'Emp', email: 'emp@e.com' });

    const now = new Date('2026-09-20T10:00:00Z');
    // dentro da janela (due em 2 dias), pendente → deve enviar
    const r1 = await DocumentRequest.create({
      contadorId: user._id,
      clientId: client._id,
      competencia: '2026-09',
      publicToken: crypto.randomUUID(),
      dueDate: new Date('2026-09-22T10:00:00Z'),
    });
    await DocumentItem.create({ requestId: r1._id, label: 'Extrato', status: 'pending' });

    // dentro da janela mas já aprovado → não envia
    const r2 = await DocumentRequest.create({
      contadorId: user._id,
      clientId: client._id,
      competencia: '2026-09',
      publicToken: crypto.randomUUID(),
      dueDate: new Date('2026-09-22T10:00:00Z'),
    });
    await DocumentItem.create({ requestId: r2._id, label: 'NF', status: 'approved' });

    // fora da janela (due em 30 dias) → não envia
    const r3 = await DocumentRequest.create({
      contadorId: user._id,
      clientId: client._id,
      competencia: '2026-10',
      publicToken: crypto.randomUUID(),
      dueDate: new Date('2026-10-20T10:00:00Z'),
    });
    await DocumentItem.create({ requestId: r3._id, label: 'X', status: 'pending' });

    const result = await runReminders(now);
    expect(result.sent).toBe(1);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('emp@e.com');

    __setTransporter(null);
  });
});
