const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    contadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    competencia: { type: String, required: true }, // ex: "2026-09"
    publicToken: { type: String, required: true, unique: true, index: true },
    dueDate: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports =
  mongoose.models.DocumentRequest || mongoose.model('DocumentRequest', requestSchema);
