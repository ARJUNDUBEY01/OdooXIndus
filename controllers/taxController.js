const asyncHandler = require('express-async-handler');
const Tax = require('../models/Tax');

// @desc    Create tax
// @route   POST /api/tax
// @access  Admin
const createTax = asyncHandler(async (req, res) => {
  const { name, percentage } = req.body;

  if (!name || percentage == null) {
    res.status(400);
    throw new Error('Name and percentage are required');
  }

  if (percentage < 0 || percentage > 100) {
    res.status(400);
    throw new Error('Tax percentage must be between 0 and 100');
  }

  const tax = await Tax.create({ name, percentage });
  res.status(201).json(tax);
});

// @desc    Get all taxes
// @route   GET /api/tax
// @access  Private
const getTaxes = asyncHandler(async (req, res) => {
  const taxes = await Tax.find({ isActive: true }).sort({ name: 1 });
  res.json({ total: taxes.length, taxes });
});

// @desc    Get tax by ID
// @route   GET /api/tax/:id
// @access  Private
const getTaxById = asyncHandler(async (req, res) => {
  const tax = await Tax.findById(req.params.id);
  if (!tax) {
    res.status(404);
    throw new Error('Tax not found');
  }
  res.json(tax);
});

// @desc    Update tax
// @route   PUT /api/tax/:id
// @access  Admin
const updateTax = asyncHandler(async (req, res) => {
  const tax = await Tax.findById(req.params.id);
  if (!tax) {
    res.status(404);
    throw new Error('Tax not found');
  }
  Object.assign(tax, req.body);
  const updated = await tax.save();
  res.json(updated);
});

// @desc    Delete (deactivate) tax
// @route   DELETE /api/tax/:id
// @access  Admin
const deleteTax = asyncHandler(async (req, res) => {
  const tax = await Tax.findById(req.params.id);
  if (!tax) {
    res.status(404);
    throw new Error('Tax not found');
  }
  tax.isActive = false;
  await tax.save();
  res.json({ message: 'Tax deactivated successfully' });
});

module.exports = { createTax, getTaxes, getTaxById, updateTax, deleteTax };
