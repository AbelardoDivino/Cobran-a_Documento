const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, default: '', trim: true },
    role: { type: String, enum: ['owner', 'member'], default: 'member' },
    status: { type: String, enum: ['active', 'invited'], default: 'invited' },
  },
  { timestamps: true }
);

membershipSchema.index({ workspaceId: 1, email: 1 }, { unique: true });
membershipSchema.index({ userId: 1, status: 1 });

module.exports =
  mongoose.models.Membership || mongoose.model('Membership', membershipSchema);
