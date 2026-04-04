const express = require('express');
const router = express.Router();
const {
  createTax,
  getTaxes,
  getTaxById,
  updateTax,
  deleteTax,
} = require('../controllers/taxController');
const { protectRoute, authorizeRoles } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protectRoute, getTaxes)
  .post(protectRoute, authorizeRoles('Admin'), createTax);

router
  .route('/:id')
  .get(protectRoute, getTaxById)
  .put(protectRoute, authorizeRoles('Admin'), updateTax)
  .delete(protectRoute, authorizeRoles('Admin'), deleteTax);

module.exports = router;
