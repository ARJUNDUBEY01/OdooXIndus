const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoiceStatus,
} = require('../controllers/invoiceController');
const { protectRoute, authorizeRoles } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protectRoute, getInvoices)
  .post(protectRoute, authorizeRoles('Admin', 'Internal'), createInvoice);

router
  .route('/:id')
  .get(protectRoute, getInvoiceById);

router.put('/:id/status', protectRoute, authorizeRoles('Admin', 'Internal'), updateInvoiceStatus);

module.exports = router;
