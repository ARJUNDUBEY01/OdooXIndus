const express = require('express');
const router = express.Router();
const {
  revenueReport,
  subscriptionsReport,
  paymentsReport,
} = require('../controllers/reportController');
const { protectRoute, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/revenue', protectRoute, authorizeRoles('Admin', 'Internal'), revenueReport);
router.get('/subscriptions', protectRoute, authorizeRoles('Admin', 'Internal'), subscriptionsReport);
router.get('/payments', protectRoute, authorizeRoles('Admin', 'Internal'), paymentsReport);

module.exports = router;
