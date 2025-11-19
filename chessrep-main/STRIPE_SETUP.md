# Stripe Payment Integration Setup Guide

This guide will walk you through setting up Stripe payments for your chess training platform.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Access to your Stripe Dashboard
3. Your website domain (for production webhooks)

## Step 1: Install Dependencies

The Stripe dependencies have already been added to your `package.json` files. Install them:

```bash
# Backend
cd chessrep-main/backend
npm install

# Frontend
cd ../frontend
npm install
```

## Step 2: Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **API keys**
3. Copy your **Publishable key** and **Secret key**
   - For testing, use the **Test mode** keys
   - For production, use the **Live mode** keys

## Step 3: Create Products and Prices in Stripe

You need to create products and prices for each subscription plan in your Stripe Dashboard.

### Premium Plan:

1. Go to **Products** in your Stripe Dashboard
2. Click **+ Add product**
3. Create the Premium product with the following details:

#### Premium Plan
- **Name**: Premium Plan
- **Description**: Unlock all features with premium access
- **Pricing**: 
  - Monthly: $4.99 (recurring monthly)
  - Yearly: $49.99 (recurring yearly, billed annually)

4. After creating each price, copy the **Price ID** (starts with `price_...`)

**Note**: The Free plan doesn't require Stripe setup as it's handled directly in your application.

## Step 4: Configure Environment Variables

### Backend Environment Variables

Add these to your `chessrep-main/backend/.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe Secret Key (use sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_...  # Your webhook signing secret (see Step 5)

# Stripe Price IDs (from Step 3)
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...

# Frontend URL (for redirects after checkout)
FRONTEND_URL=http://localhost:3000  # Change to your production URL when deploying
```

### Frontend Environment Variables

Add these to your `chessrep-main/frontend/.env` file:

```env
# API URL
REACT_APP_API_URL=http://localhost:3001/api  # Change to your production API URL when deploying

# Stripe Publishable Key (optional, if you need it for direct Stripe.js integration)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe Publishable Key
```

## Step 5: Set Up Stripe Webhooks

Webhooks allow Stripe to notify your server about subscription events (payments, cancellations, etc.).

### For Local Development (Testing):

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_...`) and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### For Production:

1. Go to **Developers** → **Webhooks** in your Stripe Dashboard
2. Click **+ Add endpoint**
3. Set the endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** and add it to your production `.env` file

## Step 6: Set Up Customer Portal (Optional but Recommended)

The Customer Portal allows users to manage their subscriptions, update payment methods, and view invoices.

1. Go to **Settings** → **Billing** → **Customer portal** in your Stripe Dashboard
2. Configure the portal settings:
   - Enable subscription cancellation
   - Allow customers to update payment methods
   - Customize branding if desired
3. The portal is automatically available via the `/api/stripe/create-portal-session` endpoint

## Step 7: Test the Integration

### Test Mode

1. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Use any future expiry date, any CVC, any ZIP
2. Test the checkout flow:
   - Go to your pricing page
   - Click on a plan
   - Complete checkout with a test card
   - Verify the subscription is created in Stripe Dashboard
   - Check that your user's subscription status is updated

### Verify Webhooks

1. Check your server logs for webhook events
2. Verify in Stripe Dashboard → **Developers** → **Webhooks** → **Events** that events are being sent
3. Ensure your database is updated with subscription information

## Step 8: Production Deployment Checklist

Before going live:

- [ ] Switch to **Live mode** API keys in production `.env`
- [ ] Update `FRONTEND_URL` to your production domain
- [ ] Update `REACT_APP_API_URL` to your production API URL
- [ ] Set up production webhook endpoint in Stripe Dashboard
- [ ] Test with real payment methods (use small amounts first)
- [ ] Set up email notifications in Stripe for important events
- [ ] Configure tax collection if required in your region
- [ ] Set up proper error monitoring and logging
- [ ] Review Stripe's security best practices: https://stripe.com/docs/security

## API Endpoints

### Create Checkout Session
```
POST /api/stripe/create-checkout-session
Body: { plan: 'premium', billingPeriod: 'monthly' | 'yearly' }
Headers: { 'x-auth-token': <user-token> }
```

### Get Subscription Status
```
GET /api/stripe/subscription-status
Headers: { 'x-auth-token': <user-token> }
```

### Cancel Subscription
```
POST /api/stripe/cancel-subscription
Headers: { 'x-auth-token': <user-token> }
```

### Reactivate Subscription
```
POST /api/stripe/reactivate-subscription
Headers: { 'x-auth-token': <user-token> }
```

### Create Customer Portal Session
```
POST /api/stripe/create-portal-session
Headers: { 'x-auth-token': <user-token> }
```

## Troubleshooting

### Webhook Not Working
- Verify the webhook secret is correct
- Check that the webhook endpoint is accessible (not behind a firewall)
- Ensure the webhook route is registered before `express.json()` middleware
- Check server logs for webhook errors

### Checkout Not Redirecting
- Verify `FRONTEND_URL` is set correctly
- Check that Stripe Price IDs are correct in `.env`
- Ensure user is authenticated before creating checkout session

### Subscription Not Updating
- Check webhook events in Stripe Dashboard
- Verify webhook handler is processing events correctly
- Check database to ensure user model has subscription fields
- Review server logs for errors

## Security Notes

1. **Never commit** your `.env` files to version control
2. Always use HTTPS in production
3. Validate webhook signatures (already implemented)
4. Use environment-specific API keys (test vs. live)
5. Regularly rotate your API keys
6. Monitor for suspicious activity in Stripe Dashboard

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Stripe API Reference: https://stripe.com/docs/api

## Additional Features You Can Add

- Free trials (configure in Stripe Dashboard when creating prices)
- Coupon codes (use Stripe's promotion codes feature)
- Proration for plan changes
- Usage-based billing (if needed)
- Multiple payment methods
- Invoice generation and emailing

