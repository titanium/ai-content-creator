// Stripe Payment Service
// Handles all Stripe-related operations

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe checkout session
 */
exports.createCheckoutSession = async ({ customerId, customerEmail, userId }) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId || undefined,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: {
        userId: userId
      },
      subscription_data: {
        metadata: {
          userId: userId
        }
      }
    });

    return session;
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    throw new Error('Failed to create checkout session');
  }
};

/**
 * Cancel a subscription
 */
exports.cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    return subscription;
  } catch (error) {
    console.error('Stripe cancel subscription error:', error);
    throw new Error('Failed to cancel subscription');
  }
};

/**
 * Reactivate a canceled subscription
 */
exports.reactivateSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });

    return subscription;
  } catch (error) {
    console.error('Stripe reactivate subscription error:', error);
    throw new Error('Failed to reactivate subscription');
  }
};

/**
 * Get subscription details
 */
exports.getSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Stripe get subscription error:', error);
    throw new Error('Failed to retrieve subscription');
  }
};

/**
 * Create or retrieve a customer
 */
exports.createCustomer = async (email, metadata = {}) => {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata
    });

    return customer;
  } catch (error) {
    console.error('Stripe create customer error:', error);
    throw new Error('Failed to create customer');
  }
};

/**
 * Get customer billing portal URL
 */
exports.createBillingPortalSession = async (customerId) => {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`
    });

    return session;
  } catch (error) {
    console.error('Stripe billing portal error:', error);
    throw new Error('Failed to create billing portal session');
  }
};

/**
 * Construct webhook event from request
 */
exports.constructWebhookEvent = (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
};

/**
 * Get upcoming invoice for a customer
 */
exports.getUpcomingInvoice = async (customerId) => {
  try {
    const invoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId
    });

    return invoice;
  } catch (error) {
    console.error('Stripe get upcoming invoice error:', error);
    throw new Error('Failed to retrieve upcoming invoice');
  }
};

/**
 * Update subscription price
 */
exports.updateSubscriptionPrice = async (subscriptionId, newPriceId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId
          }
        ]
      }
    );

    return updatedSubscription;
  } catch (error) {
    console.error('Stripe update subscription price error:', error);
    throw new Error('Failed to update subscription price');
  }
};