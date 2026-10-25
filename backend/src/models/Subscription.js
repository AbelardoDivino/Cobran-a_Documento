const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    contadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: String, default: 'mensal' },
    method: { type: String, enum: ['card', 'pix', 'boleto'], required: true },
    status: {
      type: String,
      enum: ['active', 'pending', 'canceled'],
      default: 'pending',
    },
    mpSubscriptionId: { type: String, default: '' },
    currentPeriodEnd: { type: Date },
    // Dados do pagador do boleto, reutilizados na renovação automática.
    boletoPayer: { type: mongoose.Schema.Types.Mixed, default: null },
    // Marca o ciclo em que o aviso de renovação por cartão já foi enviado.
    renewalNotifiedFor: { type: Date },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
