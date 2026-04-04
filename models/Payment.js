const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: [true, 'Invoice reference is required'],
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'upi', 'cheque', 'online'],
      required: [true, 'Payment method is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be positive'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
