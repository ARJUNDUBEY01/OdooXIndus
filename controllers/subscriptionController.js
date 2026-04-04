const asyncHandler = require('express-async-handler');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const invoiceService = require('../services/invoiceService');

// @desc    Create subscription
// @route   POST /api/subscriptions
// @access  Admin | Internal
const createSubscription = asyncHandler(async (req, res) => {
  const { customer, plan: planId, startDate, expirationDate, paymentTerms, orderLines } = req.body;

  if (!customer || !planId || !startDate || !expirationDate || !orderLines?.length) {
    res.status(400);
    throw new Error('customer, plan, startDate, expirationDate, and orderLines are required');
  }

  // Validate customer exists and is a Customer
  const customerUser = await User.findById(customer);
  if (!customerUser || customerUser.role !== 'Customer') {
    res.status(400);
    throw new Error('Invalid customer ID or user is not a Customer');
  }

  // Validate plan exists and is not expired
  const plan = await Plan.findById(planId);
  if (!plan) {
    res.status(404);
    throw new Error('Plan not found');
  }

  const now = new Date();
  if (plan.endDate < now) {
    res.status(400);
    throw new Error('Cannot create subscription with an expired plan');
  }

  const start = new Date(startDate);
  const expiry = new Date(expirationDate);

  if (start >= expiry) {
    res.status(400);
    throw new Error('Start date must be before expiration date');
  }

  // Validate quantities against plan minQuantity
  for (const line of orderLines) {
    if (line.quantity < plan.minQuantity) {
      res.status(400);
      throw new Error(`Quantity for each order line must be at least ${plan.minQuantity}`);
    }
    if (line.quantity <= 0) {
      res.status(400);
      throw new Error('Quantity must be a positive number');
    }
    if (line.unitPrice < 0) {
      res.status(400);
      throw new Error('Unit price cannot be negative');
    }
  }

  const subscription = await Subscription.create({
    customer,
    plan: planId,
    startDate: start,
    expirationDate: expiry,
    paymentTerms,
    orderLines,
    status: 'draft',
  });

  res.status(201).json(subscription);
});

// @desc    Get all subscriptions
// @route   GET /api/subscriptions
// @access  Admin | Internal | Customer (own)
const getSubscriptions = asyncHandler(async (req, res) => {
  const { status, customerId, page = 1, limit = 20 } = req.query;
  const filter = {};

  // Customers can only see their own subscriptions
  if (req.user.role === 'Customer') {
    filter.customer = req.user._id;
  } else if (customerId) {
    filter.customer = customerId;
  }

  if (status) filter.status = status;

  const subscriptions = await Subscription.find(filter)
    .populate('customer', 'name email')
    .populate('plan', 'name billingPeriod price')
    .populate('orderLines.product', 'name salesPrice')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await Subscription.countDocuments(filter);
  res.json({ total, page: Number(page), subscriptions });
});

// @desc    Get subscription by ID
// @route   GET /api/subscriptions/:id
// @access  Admin | Internal | Customer (own)
const getSubscriptionById = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id)
    .populate('customer', 'name email')
    .populate('plan')
    .populate('orderLines.product', 'name salesPrice');

  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  // Customer can only view their own subscriptions
  if (
    req.user.role === 'Customer' &&
    subscription.customer._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to view this subscription');
  }

  res.json(subscription);
});

// @desc    Update subscription status (lifecycle)
// @route   PUT /api/subscriptions/:id/status
// @access  Admin | Internal
const updateSubscriptionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('Status is required');
  }

  const subscription = await Subscription.findById(req.params.id).populate('plan');
  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  const validNext = Subscription.schema.statics
    ? Subscription.validTransitions
    : [];

  // Access via model
  const allowed = Subscription.validTransitions[subscription.status] || [];

  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(
      `Invalid transition: '${subscription.status}' → '${status}'. Allowed: ${allowed.join(', ') || 'none'}`
    );
  }

  // Business rule: cannot close if plan is not closable
  if (status === 'closed' && subscription.plan && !subscription.plan.options.closable) {
    res.status(400);
    throw new Error('This subscription plan does not allow manual closing');
  }

  // Business rule: cannot pause if plan is not pausable
  if (status === 'paused' && subscription.plan && !subscription.plan.options.pausable) {
    res.status(400);
    throw new Error('This subscription plan does not allow pausing');
  }

  const previousStatus = subscription.status;
  subscription.status = status;

  // Track pause time
  if (status === 'paused') {
    subscription.pausedAt = new Date();
  } else if (status === 'active' && previousStatus === 'paused') {
    subscription.pausedAt = null;
  }

  // Auto-generate invoice when subscription becomes active
  if (status === 'active' && previousStatus === 'confirmed') {
    await invoiceService.generateFromSubscription(subscription._id);
  }

  await subscription.save();
  res.json({ message: `Subscription status updated to '${status}'`, subscription });
});

// @desc    Pause subscription
// @route   PUT /api/subscriptions/:id/pause
// @access  Admin | Internal
const pauseSubscription = asyncHandler(async (req, res) => {
  req.body = { status: 'paused' };
  return updateSubscriptionStatus(req, res);
});

// @desc    Resume subscription
// @route   PUT /api/subscriptions/:id/resume
// @access  Admin | Internal
const resumeSubscription = asyncHandler(async (req, res) => {
  req.body = { status: 'active' };
  return updateSubscriptionStatus(req, res);
});

// @desc    Get subscription invoices
// @route   GET /api/subscriptions/:id/invoices
// @access  Admin | Internal | Customer (own)
const getSubscriptionInvoices = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);
  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  if (
    req.user.role === 'Customer' &&
    subscription.customer.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const invoices = await Invoice.find({ subscription: req.params.id }).sort({ createdAt: -1 });
  res.json(invoices);
});

module.exports = {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  updateSubscriptionStatus,
  pauseSubscription,
  resumeSubscription,
  getSubscriptionInvoices,
};
