const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Subscription = require('../models/Subscription');

// Helper: build date filter
const buildDateFilter = (from, to, field = 'createdAt') => {
  const filter = {};
  if (from || to) {
    filter[field] = {};
    if (from) filter[field].$gte = new Date(from);
    if (to) filter[field].$lte = new Date(to);
  }
  return filter;
};

// @desc    Revenue report
// @route   GET /api/reports/revenue
// @access  Admin | Internal
const revenueReport = asyncHandler(async (req, res) => {
  const { from, to, status } = req.query;
  const dateFilter = buildDateFilter(from, to);
  const invoiceFilter = { ...dateFilter };
  if (status) invoiceFilter.status = status;

  const invoices = await Invoice.find(invoiceFilter).populate('customer', 'name email');

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalTax = invoices.reduce((sum, inv) => {
    return sum + parseFloat(((inv.subtotal * inv.tax) / 100).toFixed(2));
  }, 0);
  const totalDiscount = invoices.reduce((sum, inv) => sum + inv.discount, 0);

  const byStatus = invoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + inv.totalAmount;
    return acc;
  }, {});

  res.json({
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    totalDiscount: parseFloat(totalDiscount.toFixed(2)),
    invoiceCount: invoices.length,
    revenueByStatus: byStatus,
    invoices,
  });
});

// @desc    Subscriptions report
// @route   GET /api/reports/subscriptions
// @access  Admin | Internal
const subscriptionsReport = asyncHandler(async (req, res) => {
  const { from, to, status } = req.query;
  const dateFilter = buildDateFilter(from, to);
  const filter = { ...dateFilter };
  if (status) filter.status = status;

  const subscriptions = await Subscription.find(filter)
    .populate('customer', 'name email')
    .populate('plan', 'name billingPeriod price');

  const byStatus = subscriptions.reduce((acc, sub) => {
    acc[sub.status] = (acc[sub.status] || 0) + 1;
    return acc;
  }, {});

  res.json({
    total: subscriptions.length,
    byStatus,
    subscriptions,
  });
});

// @desc    Payments report
// @route   GET /api/reports/payments
// @access  Admin | Internal
const paymentsReport = asyncHandler(async (req, res) => {
  const { from, to, method } = req.query;
  const dateFilter = buildDateFilter(from, to, 'date');
  const filter = { ...dateFilter };
  if (method) filter.method = method;

  const payments = await Payment.find(filter).populate({
    path: 'invoice',
    select: 'invoiceNumber totalAmount status customer',
    populate: { path: 'customer', select: 'name email' },
  });

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const byMethod = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount;
    return acc;
  }, {});

  res.json({
    total: payments.length,
    totalCollected: parseFloat(totalCollected.toFixed(2)),
    byMethod,
    payments,
  });
});

module.exports = { revenueReport, subscriptionsReport, paymentsReport };
