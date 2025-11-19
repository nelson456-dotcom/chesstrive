const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');
const User = require('../models/User');

// Plan configuration - map plan names to Stripe Price IDs
// You'll need to create these in your Stripe Dashboard and add the IDs to your .env
const PLAN_CONFIG = {
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
    amount: 499, // $4.99 in cents
    name: 'Premium'
  }
};

// @route   POST /api/stripe/create-checkout-session
// @desc    Create a Stripe checkout session
// @access  Private
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const { plan, billingPeriod } = req.body; // billingPeriod: 'monthly' or 'yearly'
    
    if (!plan || plan !== 'premium') {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    if (!billingPeriod || !['monthly', 'yearly'].includes(billingPeriod)) {
      return res.status(400).json({ message: 'Invalid billing period' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const planConfig = PLAN_CONFIG[plan];
    const priceId = planConfig[billingPeriod];

    if (!priceId) {
      return res.status(400).json({ 
        message: `Price ID not configured for ${plan} ${billingPeriod} plan. Please set STRIPE_PRICE_${plan.toUpperCase()}_${billingPeriod.toUpperCase()} in your .env file.` 
      });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || user.username,
        metadata: {
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      metadata: {
        userId: user._id.toString(),
        plan: plan,
        billingPeriod: billingPeriod
      },
      subscription_data: {
        metadata: {
          userId: user._id.toString(),
          plan: plan
        }
      },
      allow_promotion_codes: true,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    res.status(500).json({ message: 'Error creating checkout session', error: error.message });
  }
});

// Export webhook handler separately for use before express.json() middleware
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        await handlePaymentSucceeded(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        await handlePaymentFailed(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

// Helper function to handle checkout completion
async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    console.error('User not found for checkout session');
    return;
  }

  // Retrieve the subscription to get full details
  const subscriptionId = session.subscription;
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await updateUserSubscription(user, subscription);
  }
}

// Helper function to handle subscription updates
async function handleSubscriptionUpdate(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    console.error('User not found for subscription update');
    return;
  }

  await updateUserSubscription(user, subscription);
}

// Helper function to handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    console.error('User not found for subscription deletion');
    return;
  }

  user.stripeSubscriptionId = null;
  user.subscriptionStatus = 'canceled';
  user.subscriptionPlan = null;
  user.subscriptionCurrentPeriodEnd = null;
  user.subscriptionCancelAtPeriodEnd = false;
  user.userType = 'free';
  
  await user.save();
  console.log(`Subscription canceled for user ${userId}`);
}

// Helper function to handle successful payment
async function handlePaymentSucceeded(invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    await handleSubscriptionUpdate(subscription);
  }
}

// Helper function to handle failed payment
async function handlePaymentFailed(invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata?.userId;
    
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.subscriptionStatus = 'past_due';
        await user.save();
        console.log(`Payment failed for user ${userId}, subscription status set to past_due`);
      }
    }
  }
}

// Helper function to update user subscription
async function updateUserSubscription(user, subscription) {
  const plan = subscription.metadata?.plan || user.subscriptionPlan;
  
  user.stripeSubscriptionId = subscription.id;
  user.subscriptionStatus = subscription.status;
  user.subscriptionPlan = plan;
  user.subscriptionCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);
  user.subscriptionCancelAtPeriodEnd = subscription.cancel_at_period_end;
  
  // Update userType based on subscription status
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    user.userType = 'premium';
  } else {
    user.userType = 'free';
  }
  
  await user.save();
  console.log(`Subscription updated for user ${user._id}: ${plan} - ${subscription.status}`);
}

// @route   GET /api/stripe/subscription-status
// @desc    Get current user's subscription status
// @access  Private
router.get('/subscription-status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let subscriptionDetails = null;
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        subscriptionDetails = {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          items: subscription.items.data.map(item => ({
            priceId: item.price.id,
            product: item.price.product
          }))
        };
      } catch (error) {
        console.error('Error retrieving subscription from Stripe:', error);
      }
    }

    res.json({
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
      subscriptionCancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd,
      userType: user.userType,
      stripeCustomerId: user.stripeCustomerId,
      subscriptionDetails
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ message: 'Error retrieving subscription status' });
  }
});

// @route   POST /api/stripe/cancel-subscription
// @desc    Cancel user's subscription
// @access  Private
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No active subscription found' });
    }

    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: true
      }
    );

    user.subscriptionCancelAtPeriodEnd = true;
    await user.save();

    res.json({ 
      message: 'Subscription will be canceled at the end of the billing period',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ message: 'Error canceling subscription', error: error.message });
  }
});

// @route   POST /api/stripe/reactivate-subscription
// @desc    Reactivate a canceled subscription
// @access  Private
router.post('/reactivate-subscription', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No subscription found' });
    }

    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: false
      }
    );

    user.subscriptionCancelAtPeriodEnd = false;
    await user.save();

    res.json({ 
      message: 'Subscription reactivated',
      cancelAtPeriodEnd: false
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({ message: 'Error reactivating subscription', error: error.message });
  }
});

// @route   POST /api/stripe/create-portal-session
// @desc    Create a Stripe customer portal session for managing subscription
// @access  Private
router.post('/create-portal-session', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.stripeCustomerId) {
      return res.status(400).json({ message: 'No Stripe customer found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ message: 'Error creating portal session', error: error.message });
  }
});

// Also add webhook route to router for consistency (though it won't be used if registered before express.json)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
module.exports.handleWebhook = handleWebhook;

