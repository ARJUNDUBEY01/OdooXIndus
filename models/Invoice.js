const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: [true, 'Subscription reference is required'],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
    },
    items: [invoiceItemSchema],
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    subtotal: { type: Number, default: 0 },
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['draft', 'confirmed', 'paid'],
      default: 'draft',
    },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

// Auto-compute totals before save
invoiceSchema.pre('save', async function () {
  if (this.isNew) {
    const Counter = require('./Counter');
    const counter = await Counter.findOneAndUpdate(
      { name: 'invoiceNumber' },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true }
    );
    this.invoiceNumber = `INV-${String(counter.seq).padStart(5, '0')}`;
  }

  // Calculate subtotal from items
  this.subtotal = parseFloat(
    this.items.reduce((acc, item) => acc + item.amount, 0).toFixed(2)
  );

  // Apply tax then subtract discount (discount never exceeds total)
  const afterTax = parseFloat((this.subtotal * (1 + this.tax / 100)).toFixed(2));
  const discountAmount = Math.min(this.discount, afterTax);
  this.totalAmount = Math.max(0, parseFloat((afterTax - discountAmount).toFixed(2)));

});

module.exports = mongoose.model('Invoice', invoiceSchema);
