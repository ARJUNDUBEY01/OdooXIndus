const mongoose = require('mongoose');
const Counter = require('./Counter');

const orderLineSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
  unitPrice: { type: Number, required: true, min: [0, 'Unit price cannot be negative'] },
  tax: { type: Number, default: 0, min: 0 },
  amount: { type: Number, default: 0 },
});

const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionNumber: {
      type: String,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    expirationDate: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    paymentTerms: {
      type: String,
      default: 'immediate',
    },
    status: {
      type: String,
      enum: ['draft', 'quotation', 'confirmed', 'active', 'closed', 'paused'],
      default: 'draft',
    },
    pausedAt: { type: Date, default: null },
    orderLines: [orderLineSchema],
  },
  { timestamps: true }
);

// Valid transitions for the subscription lifecycle
subscriptionSchema.statics.validTransitions = {
  draft: ['quotation'],
  quotation: ['confirmed', 'draft'],
  confirmed: ['active'],
  active: ['closed', 'paused'],
  paused: ['active', 'closed'],
  closed: [],
};

// Auto-generate subscriptionNumber + compute orderLine amounts
subscriptionSchema.pre('save', async function () {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: 'subscriptionNumber' },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true }
    );
    this.subscriptionNumber = `SUB-${String(counter.seq).padStart(5, '0')}`;
  }
  // Recompute amount for each order line
  if (this.orderLines && this.orderLines.length) {
    this.orderLines.forEach((line) => {
      const taxMultiplier = 1 + (line.tax || 0) / 100;
      line.amount = parseFloat((line.quantity * line.unitPrice * taxMultiplier).toFixed(2));
    });
  }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
