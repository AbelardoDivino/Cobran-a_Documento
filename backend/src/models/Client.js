const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    contadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.models.Client || mongoose.model('Client', clientSchema);
