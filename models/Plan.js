const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Plan price is required'],
      min: [0, 'Price cannot be negative'],
    },
    billingPeriod: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: [true, 'Billing period is required'],
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: [1, 'Minimum quantity must be at least 1'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    options: {
      autoClose: { type: Boolean, default: false },
      closable: { type: Boolean, default: true },
      pausable: { type: Boolean, default: false },
      renewable: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Validate startDate < endDate
planSchema.pre('save', function () {
  if (this.startDate >= this.endDate) {
    throw new Error('Start date must be before end date');
  }
});

// Virtual: is plan currently active/valid
planSchema.virtual('isActive').get(function () {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
});

module.exports = mongoose.model('Plan', planSchema);
