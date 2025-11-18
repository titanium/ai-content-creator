// Content Routes
// Defines endpoints for content generation and management

const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { authenticate } = require('../middleware/authMiddleware');
const { checkAccess } = require('../middleware/trialMiddleware');

// All content routes require authentication
router.use(authenticate);

// Generate new content (requires active access)
router.post('/generate', checkAccess, contentController.generateContent);

// Get content history
router.get('/history', contentController.getContentHistory);

// Get content statistics
router.get('/stats', contentController.getContentStats);

// Get specific content by ID
router.get('/:id', contentController.getContent);

// Delete content by ID
router.delete('/:id', contentController.deleteContent);

module.exports = router;