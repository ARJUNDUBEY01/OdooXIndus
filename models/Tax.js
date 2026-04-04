const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tax name is required'],
      unique: true,
      trim: true,
    },
    percentage: {
      type: Number,
      required: [true, 'Tax percentage is required'],
      min: [0, 'Tax percentage cannot be negative'],
      max: [100, 'Tax percentage cannot exceed 100'],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tax', taxSchema);
