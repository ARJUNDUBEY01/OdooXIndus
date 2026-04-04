const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPayments,
  getPaymentById,
} = require('../controllers/paymentController');
const { protectRoute, authorizeRoles } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protectRoute, authorizeRoles('Admin', 'Internal'), getPayments)
  .post(protectRoute, authorizeRoles('Admin', 'Internal'), createPayment);

router.route('/:id').get(protectRoute, authorizeRoles('Admin', 'Internal'), getPaymentById);

module.exports = router;
