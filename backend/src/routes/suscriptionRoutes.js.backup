// Subscription Routes
// Defines endpoints for subscription management

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/authMiddleware');

// Stripe webhook (no authentication needed - verified by Stripe signature)
router.post('/webhook', subscriptionController.handleWebhook);

// Protected routes
router.use(authenticate);

// Create checkout session
router.post('/create-checkout', subscriptionController.createCheckout);

// Get subscription status
router.get('/status', subscriptionController.getSubscriptionStatus);

// Cancel subscription
router.post('/cancel', subscriptionController.cancelSubscription);

module.exports = router;