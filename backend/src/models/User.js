const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    officeName: { type: String, default: '' },
    accountType: { type: String, enum: ['personal', 'business'], default: 'personal' },
    companyCnpj: { type: String, default: '', trim: true },
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
