const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protectRoute, authorizeRoles } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protectRoute, getProducts)
  .post(protectRoute, authorizeRoles('Admin', 'Internal'), createProduct);

router
  .route('/:id')
  .get(protectRoute, getProductById)
  .put(protectRoute, authorizeRoles('Admin', 'Internal'), updateProduct)
  .delete(protectRoute, authorizeRoles('Admin'), deleteProduct);

module.exports = router;
