const express = require('express');
const router = express.Router();
const {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deletePlan,
} = require('../controllers/planController');
const { protectRoute, authorizeRoles } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protectRoute, getPlans)
  .post(protectRoute, authorizeRoles('Admin'), createPlan);

router
  .route('/:id')
  .get(protectRoute, getPlanById)
  .put(protectRoute, authorizeRoles('Admin'), updatePlan)
  .delete(protectRoute, authorizeRoles('Admin'), deletePlan);

module.exports = router;
