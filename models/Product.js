const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  attribute: { type: String, required: true },
  value: { type: String, required: true },
  extraPrice: { type: Number, default: 0, min: 0 },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Product type is required'],
      trim: true,
    },
    salesPrice: {
      type: Number,
      required: [true, 'Sales price is required'],
      min: [0, 'Sales price cannot be negative'],
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    variants: [variantSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
