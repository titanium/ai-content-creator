// Admin Routes
// Defines endpoints for admin dashboard

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// All admin routes require authentication and admin privileges
router.use(authenticate);
router.use(isAdmin);

// Get overall platform statistics
router.get('/stats', adminController.getAdminStats);

// Get all users with filtering and pagination
router.get('/users', adminController.getAllUsers);

// Get specific user details
router.get('/users/:userId', adminController.getUserDetails);

// Get all content for a specific user
router.get('/users/:userId/content', adminController.getUserContent);

module.exports = router;
