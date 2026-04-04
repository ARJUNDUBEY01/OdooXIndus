const asyncHandler = require('express-async-handler');
const Discount = require('../models/Discount');

// @desc    Create discount
// @route   POST /api/discounts
// @access  Admin
const createDiscount = asyncHandler(async (req, res) => {
  const { name, type, value, minPurchase, minQuantity, startDate, endDate, usageLimit } = req.body;

  if (!name || !type || value == null || !startDate || !endDate) {
    res.status(400);
    throw new Error('name, type, value, startDate, and endDate are required');
  }

  if (value < 0) {
    res.status(400);
    throw new Error('Discount value cannot be negative');
  }

  if (type === 'percentage' && value > 100) {
    res.status(400);
    throw new Error('Percentage discount cannot exceed 100%');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start >= end) {
    res.status(400);
    throw new Error('Start date must be before end date');
  }

  const discount = await Discount.create({
    name, type, value, minPurchase, minQuantity, startDate: start, endDate: end, usageLimit,
  });

  res.status(201).json(discount);
});

// @desc    Get all discounts
// @route   GET /api/discounts
// @access  Admin | Internal
const getDiscounts = asyncHandler(async (req, res) => {
  const { active } = req.query;
  const filter = {};
  if (active === 'true') filter.isActive = true;

  const discounts = await Discount.find(filter).sort({ createdAt: -1 });
  res.json({ total: discounts.length, discounts });
});

// @desc    Get discount by ID
// @route   GET /api/discounts/:id
// @access  Admin | Internal
const getDiscountById = asyncHandler(async (req, res) => {
  const discount = await Discount.findById(req.params.id);
  if (!discount) {
    res.status(404);
    throw new Error('Discount not found');
  }
  res.json(discount);
});

// @desc    Update discount
// @route   PUT /api/discounts/:id
// @access  Admin
const updateDiscount = asyncHandler(async (req, res) => {
  const discount = await Discount.findById(req.params.id);
  if (!discount) {
    res.status(404);
    throw new Error('Discount not found');
  }

  Object.assign(discount, req.body);
  const updated = await discount.save();
  res.json(updated);
});

// @desc    Delete discount
// @route   DELETE /api/discounts/:id
// @access  Admin
const deleteDiscount = asyncHandler(async (req, res) => {
  const discount = await Discount.findById(req.params.id);
  if (!discount) {
    res.status(404);
    throw new Error('Discount not found');
  }
  await discount.deleteOne();
  res.json({ message: 'Discount removed successfully' });
});

module.exports = { createDiscount, getDiscounts, getDiscountById, updateDiscount, deleteDiscount };
