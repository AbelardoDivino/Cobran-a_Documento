const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['in', 'out'], required: true },
    category: { type: String, default: 'Outros', index: true },
    source: { type: String, enum: ['manual', 'ofx', 'csv'], default: 'manual' },
    externalId: { type: String, default: null },
  },
  { timestamps: true }
);

transactionSchema.index(
  { workspaceId: 1, accountId: 1, externalId: 1 },
  { unique: true, partialFilterExpression: { externalId: { $type: 'string' } } }
);

module.exports =
  mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
