const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const validatePassword = require('../utils/validatePassword');

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public (Admin only for Internal users – enforced here)
const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email, and password are required');
  }

  // Password strength validation
  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) {
    res.status(400);
    throw new Error(pwCheck.errors.join('. '));
  }

  // Only Admin can create Internal users
  if (role === 'Internal') {
    // Check if there's an authenticated admin calling this
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      res.status(403);
      throw new Error('Only Admin can create Internal users');
    }

    const jwt = require('jsonwebtoken');
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      res.status(403);
      throw new Error('Only Admin can create Internal users');
    }

    const callerUser = await User.findById(decoded.id);
    if (!callerUser || callerUser.role !== 'Admin') {
      res.status(403);
      throw new Error('Only Admin can create Internal users');
    }
  }

  // Role override: only 'Customer' or 'Internal' can be set via signup
  // 'Admin' can only be seeded or created directly in DB
  const assignedRole = role === 'Internal' ? 'Internal' : 'Customer';

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('Email already registered');
  }

  const user = await User.create({ name, email, password, role: assignedRole });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
});

// @desc    Reset password (basic – requires current password)
// @route   POST /api/auth/reset-password
// @access  Private
const resetPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Current password and new password are required');
  }

  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.valid) {
    res.status(400);
    throw new Error(pwCheck.errors.join('. '));
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password updated successfully' });
});

// @desc    Get all users (Admin/Internal)
// @route   GET /api/auth/users
// @access  Admin | Internal
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

module.exports = { signup, login, resetPassword, getUsers };
