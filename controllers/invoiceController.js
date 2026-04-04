const asyncHandler = require('express-async-handler');
const Invoice = require('../models/Invoice');
const Subscription = require('../models/Subscription');
const Discount = require('../models/Discount');
const invoiceService = require('../services/invoiceService');

// @desc    Generate invoice (manual or from subscription)
// @route   POST /api/invoices
// @access  Admin | Internal
const createInvoice = asyncHandler(async (req, res) => {
  const { subscriptionId, tax, discount, discountCode, dueDate } = req.body;

  if (!subscriptionId) {
    res.status(400);
    throw new Error('subscriptionId is required');
  }

  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  // Generate invoice from subscription
  const invoice = await invoiceService.generateFromSubscription(subscriptionId);

  // Override tax if supplied
  if (tax != null) {
    if (tax < 0) { res.status(400); throw new Error('Tax cannot be negative'); }
    invoice.tax = tax;
  }

  // Apply discount code if given
  if (discountCode) {
    const discountDoc = await Discount.findOne({ name: discountCode });
    if (!discountDoc || !discountDoc.isValid()) {
      res.status(400);
      throw new Error('Discount code is invalid or expired');
    }

    // Check minPurchase threshold
    if (invoice.subtotal < discountDoc.minPurchase) {
      res.status(400);
      throw new Error(`Minimum purchase of ${discountDoc.minPurchase} required for this discount`);
    }

    let discountAmount = 0;
    if (discountDoc.type === 'fixed') {
      discountAmount = discountDoc.value;
    } else {
      // percentage
      discountAmount = parseFloat(((invoice.subtotal * discountDoc.value) / 100).toFixed(2));
    }

    invoice.discount = discountAmount;
    discountDoc.usedCount += 1;
    await discountDoc.save();
  } else if (discount != null) {
    if (discount < 0) { res.status(400); throw new Error('Discount cannot be negative'); }
    invoice.discount = discount;
  }

  if (dueDate) invoice.dueDate = new Date(dueDate);

  await invoice.save();
  res.status(201).json(invoice);
});

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Admin | Internal | Customer (own)
const getInvoices = asyncHandler(async (req, res) => {
  const { status, customerId, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (req.user.role === 'Customer') {
    filter.customer = req.user._id;
  } else if (customerId) {
    filter.customer = customerId;
  }

  if (status) filter.status = status;

  const invoices = await Invoice.find(filter)
    .populate('customer', 'name email')
    .populate('subscription', 'subscriptionNumber')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await Invoice.countDocuments(filter);
  res.json({ total, page: Number(page), invoices });
});

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Admin | Internal | Customer (own)
const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('customer', 'name email')
    .populate('subscription');

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  if (
    req.user.role === 'Customer' &&
    invoice.customer._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to view this invoice');
  }

  res.json(invoice);
});

// @desc    Update invoice status
// @route   PUT /api/invoices/:id/status
// @access  Admin | Internal
const updateInvoiceStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['draft', 'confirmed', 'paid'];

  if (!status || !validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Valid values: ${validStatuses.join(', ')}`);
  }

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  // Prevent backwards status transitions
  const hierarchy = { draft: 0, confirmed: 1, paid: 2 };
  if (hierarchy[status] < hierarchy[invoice.status]) {
    res.status(400);
    throw new Error(`Cannot revert invoice status from '${invoice.status}' to '${status}'`);
  }

  invoice.status = status;
  await invoice.save();
  res.json({ message: `Invoice status updated to '${status}'`, invoice });
});

module.exports = { createInvoice, getInvoices, getInvoiceById, updateInvoiceStatus };
