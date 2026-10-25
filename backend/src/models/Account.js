const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    bank: { type: String, default: '', trim: true },
    type: {
      type: String,
      enum: ['checking', 'savings', 'credit', 'cash', 'investment', 'other'],
      default: 'checking',
    },
    initialBalance: { type: Number, default: 0 },
    currency: { type: String, default: 'BRL' },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Account || mongoose.model('Account', accountSchema);
