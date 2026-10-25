const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Minhas finanças', trim: true },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tier: { type: String, enum: ['begin', 'pro'], default: 'begin' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Workspace || mongoose.model('Workspace', workspaceSchema);
