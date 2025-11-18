// Subscription Controller
// Handles Stripe subscription management and webhooks

const { PrismaClient } = require('@prisma/client');
const { 
  createCheckoutSession, 
  cancelSubscription,
  constructWebhookEvent 
} = require('../services/stripeService');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// CREATE CHECKOUT SESSION - Initialize Stripe checkout
exports.createCheckout = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { subscription: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create or get Stripe customer
    let customerId = user.subscription.stripeCustomerId;

    // Create checkout session
    const session = await createCheckoutSession({
      customerId,
      customerEmail: user.email,
      userId: user.id
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session' 
    });
  }
};

// STRIPE WEBHOOK - Handle Stripe events
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    // Verify webhook signature
    const event = constructWebhookEvent(req.body, signature);

    console.log('Stripe webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ 
      error: 'Webhook error',
      message: error.message 
    });
  }
};

// Handle successful checkout
async function handleCheckoutCompleted(session) {
  try {
    const userId = session.metadata.userId;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    await prisma.subscription.update({
      where: { userId },
      data: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: 'active',
        isTrialActive: false
      }
    });

    console.log(`Subscription activated for user: ${userId}`);
  } catch (error) {
    console.error('Handle checkout completed error:', error);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription) {
  try {
    const stripeSubscriptionId = subscription.id;
    
    const existingSub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId }
    });

    if (!existingSub) {
      console.log('Subscription not found for update');
      return;
    }

    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        status: subscription.status === 'active' ? 'active' : 'canceled'
      }
    });

    console.log(`Subscription updated: ${stripeSubscriptionId}`);
  } catch (error) {
    console.error('Handle subscription updated error:', error);
  }
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription) {
  try {
    const stripeSubscriptionId = subscription.id;

    const existingSub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId }
    });

    if (!existingSub) {
      console.log('Subscription not found for deletion');
      return;
    }

    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        status: 'canceled',
        stripeSubscriptionId: null
      }
    });

    console.log(`Subscription canceled: ${stripeSubscriptionId}`);
  } catch (error) {
    console.error('Handle subscription deleted error:', error);
  }
}

// Handle failed payments
async function handlePaymentFailed(invoice) {
  try {
    const customerId = invoice.customer;

    const subscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (subscription) {
      // You might want to send an email notification here
      console.log(`Payment failed for customer: ${customerId}`);
    }
  } catch (error) {
    console.error('Handle payment failed error:', error);
  }
}

// GET SUBSCRIPTION STATUS - Get current subscription info
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userId }
    });

    if (!subscription) {
      return res.status(404).json({ 
        error: 'Subscription not found' 
      });
    }

    // Calculate trial days remaining
    let trialDaysRemaining = 0;
    if (subscription.isTrialActive) {
      const now = new Date();
      const trialEnd = new Date(subscription.trialEndDate);
      trialDaysRemaining = Math.max(
        0, 
        Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))
      );
    }

    res.json({
      status: subscription.status,
      isTrialActive: subscription.isTrialActive,
      trialDaysRemaining,
      trialEndDate: subscription.trialEndDate,
      stripeCurrentPeriodEnd: subscription.stripeCurrentPeriodEnd,
      hasActiveSubscription: subscription.status === 'active'
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch subscription status' 
    });
  }
};

// CANCEL SUBSCRIPTION - Cancel active subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userId }
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(400).json({ 
        error: 'No active subscription to cancel' 
      });
    }

    // Cancel in Stripe
    await cancelSubscription(subscription.stripeSubscriptionId);

    // Update database
    await prisma.subscription.update({
      where: { userId: req.userId },
      data: {
        status: 'canceled'
      }
    });

    res.json({ 
      message: 'Subscription canceled successfully. Access will continue until the end of the billing period.' 
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription' 
    });
  }
};