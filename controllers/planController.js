const asyncHandler = require('express-async-handler');
const Plan = require('../models/Plan');

// @desc    Create plan
// @route   POST /api/plans
// @access  Admin
const createPlan = asyncHandler(async (req, res) => {
  const { name, price, billingPeriod, minQuantity, startDate, endDate, options } = req.body;

  if (!name || price == null || !billingPeriod || !startDate || !endDate) {
    res.status(400);
    throw new Error('Name, price, billingPeriod, startDate, and endDate are required');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) {
    res.status(400);
    throw new Error('Start date must be before end date');
  }

  const plan = await Plan.create({ name, price, billingPeriod, minQuantity, startDate: start, endDate: end, options });
  res.status(201).json(plan);
});

// @desc    Get all plans
// @route   GET /api/plans
// @access  Private
const getPlans = asyncHandler(async (req, res) => {
  const { active } = req.query;
  let plans = await Plan.find({});

  if (active === 'true') {
    const now = new Date();
    plans = plans.filter(p => p.startDate <= now && p.endDate >= now);
  }

  res.json({ total: plans.length, plans });
});

// @desc    Get plan by ID
// @route   GET /api/plans/:id
// @access  Private
const getPlanById = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) {
    res.status(404);
    throw new Error('Plan not found');
  }
  res.json(plan);
});

// @desc    Update plan
// @route   PUT /api/plans/:id
// @access  Admin
const updatePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) {
    res.status(404);
    throw new Error('Plan not found');
  }

  const startDate = req.body.startDate ? new Date(req.body.startDate) : plan.startDate;
  const endDate = req.body.endDate ? new Date(req.body.endDate) : plan.endDate;

  if (startDate >= endDate) {
    res.status(400);
    throw new Error('Start date must be before end date');
  }

  Object.assign(plan, req.body, { startDate, endDate });
  const updated = await plan.save();
  res.json(updated);
});

// @desc    Delete plan
// @route   DELETE /api/plans/:id
// @access  Admin
const deletePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) {
    res.status(404);
    throw new Error('Plan not found');
  }
  await plan.deleteOne();
  res.json({ message: 'Plan removed successfully' });
});

module.exports = { createPlan, getPlans, getPlanById, updatePlan, deletePlan };
