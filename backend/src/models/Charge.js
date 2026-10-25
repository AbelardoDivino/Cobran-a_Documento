const mongoose = require('mongoose');

const chargeSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
      index: true,
    },
    mpPaymentId: { type: String, default: '', index: true },
    method: { type: String, enum: ['card', 'pix', 'boleto'], required: true },
    plan: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    amount: { type: Number, required: true },
    dueDate: { type: Date },
    paidAt: { type: Date },
    pixQrCode: { type: String, default: '' },
    pixQrBase64: { type: String, default: '' },
    boletoUrl: { type: String, default: '' },
    boletoBarcode: { type: String, default: '' },
    boletoDigitableLine: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Charge || mongoose.model('Charge', chargeSchema);
