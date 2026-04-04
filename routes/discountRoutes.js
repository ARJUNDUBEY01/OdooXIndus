const express = require('express');
const router = express.Router();
const {
  createDiscount,
  getDiscounts,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
} = require('../controllers/discountController');
const { protectRoute, authorizeRoles } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protectRoute, authorizeRoles('Admin', 'Internal'), getDiscounts)
  .post(protectRoute, authorizeRoles('Admin'), createDiscount);

router
  .route('/:id')
  .get(protectRoute, authorizeRoles('Admin', 'Internal'), getDiscountById)
  .put(protectRoute, authorizeRoles('Admin'), updateDiscount)
  .delete(protectRoute, authorizeRoles('Admin'), deleteDiscount);

module.exports = router;
