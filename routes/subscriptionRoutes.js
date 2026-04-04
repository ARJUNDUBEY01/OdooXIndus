const express = require('express');
const router = express.Router();
const {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  updateSubscriptionStatus,
  pauseSubscription,
  resumeSubscription,
  getSubscriptionInvoices,
} = require('../controllers/subscriptionController');
const { protectRoute, authorizeRoles } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protectRoute, getSubscriptions)
  .post(protectRoute, authorizeRoles('Admin', 'Internal'), createSubscription);

router
  .route('/:id')
  .get(protectRoute, getSubscriptionById);

router.put('/:id/status', protectRoute, authorizeRoles('Admin', 'Internal'), updateSubscriptionStatus);
router.put('/:id/pause', protectRoute, authorizeRoles('Admin', 'Internal'), pauseSubscription);
router.put('/:id/resume', protectRoute, authorizeRoles('Admin', 'Internal'), resumeSubscription);
router.get('/:id/invoices', protectRoute, getSubscriptionInvoices);

module.exports = router;
