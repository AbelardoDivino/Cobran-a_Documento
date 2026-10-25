const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DocumentRequest',
      required: true,
      index: true,
    },
    label: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'received', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectReason: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    uploadedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.models.DocumentItem || mongoose.model('DocumentItem', itemSchema);
