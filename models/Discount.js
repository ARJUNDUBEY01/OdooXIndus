const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Discount name is required'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['fixed', 'percentage'],
      required: [true, 'Discount type is required'],
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    minPurchase: {
      type: Number,
      default: 0,
      min: 0,
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Validate that startDate < endDate
discountSchema.pre('save', function () {
  if (this.startDate >= this.endDate) {
    throw new Error('Discount start date must be before end date');
  }
  if (this.type === 'percentage' && this.value > 100) {
    throw new Error('Percentage discount cannot exceed 100%');
  }
});

// Instance method to check if discount is currently valid
discountSchema.methods.isValid = function () {
  const now = new Date();
  const withinDates = now >= this.startDate && now <= this.endDate;
  const withinUsage =
    this.usageLimit === null || this.usedCount < this.usageLimit;
  return this.isActive && withinDates && withinUsage;
};

module.exports = mongoose.model('Discount', discountSchema);
