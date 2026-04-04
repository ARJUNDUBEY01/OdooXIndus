const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');

// @desc    Record a payment
// @route   POST /api/payments
// @access  Admin | Internal
const createPayment = asyncHandler(async (req, res) => {
  const { invoice: invoiceId, method, amount, note } = req.body;

  if (!invoiceId || !method || amount == null) {
    res.status(400);
    throw new Error('invoice, method, and amount are required');
  }

  if (amount <= 0) {
    res.status(400);
    throw new Error('Payment amount must be positive');
  }

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  if (invoice.status === 'paid') {
    res.status(400);
    throw new Error('Invoice is already fully paid');
  }

  if (amount > invoice.totalAmount) {
    res.status(400);
    throw new Error(`Payment amount (${amount}) exceeds invoice total (${invoice.totalAmount})`);
  }

  const payment = await Payment.create({ invoice: invoiceId, method, amount, note });

  // Mark invoice as paid when payment amount matches total
  if (amount >= invoice.totalAmount) {
    invoice.status = 'paid';
    await invoice.save();
  }

  res.status(201).json({
    payment,
    invoiceStatus: invoice.status,
    message: invoice.status === 'paid' ? 'Invoice marked as PAID' : 'Partial payment recorded',
  });
});

// @desc    Get all payments
// @route   GET /api/payments
// @access  Admin | Internal
const getPayments = asyncHandler(async (req, res) => {
  const { invoiceId, method, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (invoiceId) filter.invoice = invoiceId;
  if (method) filter.method = method;

  const payments = await Payment.find(filter)
    .populate('invoice', 'invoiceNumber totalAmount status')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await Payment.countDocuments(filter);
  res.json({ total, page: Number(page), payments });
});

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Admin | Internal
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate('invoice');
  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }
  res.json(payment);
});

module.exports = { createPayment, getPayments, getPaymentById };
