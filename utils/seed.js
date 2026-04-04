const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from project root (seed.js is in utils/)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Product = require('../models/Product');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Tax = require('../models/Tax');
const Discount = require('../models/Discount');
const Counter = require('../models/Counter');
const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany(),
    Product.deleteMany(),
    Plan.deleteMany(),
    Subscription.deleteMany(),
    Invoice.deleteMany(),
    Tax.deleteMany(),
    Discount.deleteMany(),
    Counter.deleteMany(),
  ]);

  console.log('🧹 Cleared existing data');

  // ── USERS ──────────────────────────────────────────
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@saas.com',
    password: 'Admin@1234',
    role: 'Admin',
  });

  const customer1 = await User.create({
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'Alice@1234',
    role: 'Customer',
  });

  const customer2 = await User.create({
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'Bob@12345',
    role: 'Customer',
  });

  console.log('✅ Users seeded');

  // ── TAXES ──────────────────────────────────────────
  await Tax.create({ name: 'GST 18%', percentage: 18 });
  await Tax.create({ name: 'VAT 5%', percentage: 5 });

  console.log('✅ Taxes seeded');

  // ── DISCOUNTS ──────────────────────────────────────
  await Discount.create({
    name: 'LAUNCH20',
    type: 'percentage',
    value: 20,
    minPurchase: 100,
    minQuantity: 1,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2027-12-31'),
    usageLimit: 100,
  });

  console.log('✅ Discounts seeded');

  // ── PRODUCTS ───────────────────────────────────────
  const product1 = await Product.create({
    name: 'Basic SaaS License',
    type: 'Software',
    salesPrice: 999,
    costPrice: 300,
    variants: [
      { attribute: 'Users', value: '5', extraPrice: 0 },
      { attribute: 'Users', value: '10', extraPrice: 200 },
    ],
  });

  await Product.create({
    name: 'Premium SaaS License',
    type: 'Software',
    salesPrice: 2999,
    costPrice: 800,
    variants: [
      { attribute: 'Storage', value: '50GB', extraPrice: 0 },
      { attribute: 'Storage', value: '200GB', extraPrice: 500 },
    ],
  });

  const product3 = await Product.create({
    name: 'Support Package',
    type: 'Service',
    salesPrice: 499,
    costPrice: 100,
    variants: [],
  });

  console.log('✅ Products seeded');

  // ── PLANS ──────────────────────────────────────────
  const plan1 = await Plan.create({
    name: 'Starter Monthly',
    price: 999,
    billingPeriod: 'monthly',
    minQuantity: 1,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2027-12-31'),
    options: { autoClose: false, closable: true, pausable: true, renewable: true },
  });

  const plan2 = await Plan.create({
    name: 'Enterprise Yearly',
    price: 9999,
    billingPeriod: 'yearly',
    minQuantity: 2,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2027-12-31'),
    options: { autoClose: true, closable: true, pausable: false, renewable: true },
  });

  console.log('✅ Plans seeded');

  // ── SUBSCRIPTIONS ──────────────────────────────────
  const sub1 = await Subscription.create({
    customer: customer1._id,
    plan: plan1._id,
    startDate: new Date('2026-01-01'),
    expirationDate: new Date('2026-12-31'),
    paymentTerms: 'immediate',
    status: 'active',
    orderLines: [
      {
        product: product1._id,
        quantity: 1,
        unitPrice: product1.salesPrice,
        tax: 18,
        amount: parseFloat((1 * product1.salesPrice * 1.18).toFixed(2)),
      },
    ],
  });

  await Subscription.create({
    customer: customer2._id,
    plan: plan2._id,
    startDate: new Date('2026-02-01'),
    expirationDate: new Date('2027-01-31'),
    paymentTerms: 'net30',
    status: 'confirmed',
    orderLines: [
      {
        product: product3._id,
        quantity: 3,
        unitPrice: product3.salesPrice,
        tax: 5,
        amount: parseFloat((3 * product3.salesPrice * 1.05).toFixed(2)),
      },
    ],
  });

  console.log('✅ Subscriptions seeded');

  // ── INVOICES ───────────────────────────────────────
  await Invoice.create({
    subscription: sub1._id,
    customer: customer1._id,
    items: [
      {
        description: 'Basic SaaS License x 1',
        quantity: 1,
        unitPrice: product1.salesPrice,
        amount: product1.salesPrice,
      },
    ],
    tax: 18,
    discount: 0,
    status: 'paid',
    dueDate: new Date('2026-02-01'),
  });

  console.log('✅ Invoices seeded');

  console.log('\n🎉 SEED COMPLETE!\n');
  console.log('──────────────────────────────────────────');
  console.log('Admin Login:        admin@saas.com     / Admin@1234');
  console.log('Customer 1 Login:   alice@example.com  / Alice@1234');
  console.log('Customer 2 Login:   bob@example.com    / Bob@12345');
  console.log('──────────────────────────────────────────\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
