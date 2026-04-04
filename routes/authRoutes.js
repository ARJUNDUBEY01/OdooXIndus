const express = require('express');
const router = express.Router();
const { signup, login, resetPassword, getUsers } = require('../controllers/authController');
const { protectRoute, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/reset-password', protectRoute, resetPassword);
router.get('/users', protectRoute, authorizeRoles('Admin', 'Internal'), getUsers);

module.exports = router;
