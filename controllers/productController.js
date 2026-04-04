const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// @desc    Create product
// @route   POST /api/products
// @access  Admin | Internal
const createProduct = asyncHandler(async (req, res) => {
  const { name, type, salesPrice, costPrice, variants } = req.body;

  if (!name || !type || salesPrice == null || costPrice == null) {
    res.status(400);
    throw new Error('Name, type, salesPrice, and costPrice are required');
  }

  if (salesPrice < 0 || costPrice < 0) {
    res.status(400);
    throw new Error('Prices cannot be negative');
  }

  const product = await Product.create({ name, type, salesPrice, costPrice, variants });
  res.status(201).json(product);
});

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (type) filter.type = type;

  const products = await Product.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Product.countDocuments(filter);
  res.json({ total, page: Number(page), products });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin | Internal
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const { salesPrice, costPrice } = req.body;
  if (salesPrice != null && salesPrice < 0) {
    res.status(400);
    throw new Error('Sales price cannot be negative');
  }
  if (costPrice != null && costPrice < 0) {
    res.status(400);
    throw new Error('Cost price cannot be negative');
  }

  Object.assign(product, req.body);
  const updated = await product.save();
  res.json(updated);
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  await product.deleteOne();
  res.json({ message: 'Product removed successfully' });
});

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };
