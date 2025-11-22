# Stripe Testing Guide - Sandbox/Test Mode

This guide explains how to test subscription extensions and cancellations using Stripe's test mode.

## Setup Test Mode

### 1. Switch to Test Mode in Stripe Dashboard

1. Go to https://dashboard.stripe.com
2. **Toggle to Test mode** (top right corner, switch from "Live" to "Test")
3. You should see "TEST DATA" in the top bar

### 2. Update Environment Variables for Testing

**On your VPS, update `backend/.env` temporarily for testing:**

```bash
cd /var/www/chessrep/chessrep-main/backend
nano .env
```

**Change to test keys:**
```env
# Test Mode Keys (for testing only)
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE
STRIPE_PRICE_PREMIUM_MONTHLY=price_YOUR_TEST_MONTHLY_PRICE_ID
STRIPE_PRICE_PREMIUM_YEARLY=price_YOUR_TEST_YEARLY_PRICE_ID
STRIPE_WEBHOOK_SECRET=whsec_YOUR_TEST_WEBHOOK_SECRET
```

**Get your test keys from:**
- **Test Secret Key**: Stripe Dashboard → Developers → API keys → Secret key (test mode)
- **Test Price IDs**: Stripe Dashboard → Products → Your Premium Plan → Copy the Price IDs (must be in test mode)
- **Test Webhook Secret**: Stripe Dashboard → Developers → Webhooks → Your webhook → Reveal signing secret

### 3. Create Test Products and Prices

If you don't have test products yet:

1. Go to Stripe Dashboard → Products (in Test mode)
2. Click "Add product"
3. Create "Premium Plan" product
4. Add Monthly price: $4.99/month (or any test amount)
5. Add Yearly price: $49.99/year (or any test amount)
6. **Copy the Price IDs** (they start with `price_`)
7. Update your `.env` file with these test Price IDs

### 4. Configure Test Webhook

1. Go to Stripe Dashboard → Developers → Webhooks (in Test mode)
2. Click "Add endpoint" (or use existing test endpoint)
3. Set URL to: `https://chesstrive.com/api/stripe/webhook` (or your test URL)
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret (starts with `whsec_`)
6. Update `STRIPE_WEBHOOK_SECRET` in your `.env`

---

## Testing Scenarios

### Test 1: Basic Subscription (New User)

1. **Restart backend** (to load test keys):
   ```bash
   pm2 restart backend
   ```

2. **Create a test account** on your site

3. **Subscribe to Premium:**
   - Go to `/pricing`
   - Click "Upgrade to Premium"
   - Select Monthly or Yearly

4. **Use Stripe test card:**
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

5. **Verify:**
   - User upgraded to premium
   - Subscription created in Stripe Dashboard → Subscriptions
   - Check database: `subscriptionStatus: 'active'`, `userType: 'premium'`

---

### Test 2: Extend Existing Monthly Subscription

1. **User already has monthly subscription** (from Test 1)

2. **Check current period end:**
   ```bash
   mongosh
   use chessrep
   db.users.findOne({ email: "test@example.com" }, {
     subscriptionCurrentPeriodEnd: 1,
     subscriptionExtendedPeriodEnd: 1
   })
   ```
   Note the current period end date.

3. **Extend subscription:**
   - Go to `/pricing` again
   - Click "Upgrade to Premium" (same or different billing period)
   - Complete checkout with test card

4. **Verify extension:**
   - Check database again:
   ```bash
   db.users.findOne({ email: "test@example.com" }, {
     subscriptionCurrentPeriodEnd: 1,
     subscriptionExtendedPeriodEnd: 1,
     subscriptionCancelAtPeriodEnd: 1
   })
   ```
   - `subscriptionExtendedPeriodEnd` should be set to current period end + 30 days (or 365 for yearly)
   - `subscriptionCancelAtPeriodEnd` should be `false`

5. **Check Stripe Dashboard:**
   - Go to Subscriptions → Your subscription
   - Verify subscription is still active
   - Check metadata for extension info

---

### Test 3: Extend Existing Yearly Subscription

1. **User has yearly subscription**

2. **Extend by purchasing monthly or yearly:**
   - Go to `/pricing`
   - Click "Upgrade to Premium"
   - Select Monthly or Yearly

3. **Verify:**
   - Database shows `subscriptionExtendedPeriodEnd` = current period end + extension period
   - Extension period should be 30 days (monthly) or 365 days (yearly)

---

### Test 4: Cancel Subscription (Cancel at Period End)

1. **User has active subscription**

2. **Cancel subscription:**
   - Call the cancel endpoint (usually through your UI):
   ```bash
   curl -X POST https://chesstrive.com/api/stripe/cancel-subscription \
     -H "x-auth-token: YOUR_TOKEN_HERE"
   ```

3. **Verify:**
   - Check database:
   ```bash
   db.users.findOne({ email: "test@example.com" }, {
     subscriptionCancelAtPeriodEnd: 1,
     subscriptionCurrentPeriodEnd: 1
   })
   ```
   - `subscriptionCancelAtPeriodEnd` should be `true`
   - User should still be premium until `subscriptionCurrentPeriodEnd`

4. **Check Stripe Dashboard:**
   - Go to Subscriptions → Your subscription
   - Should show "Cancel at period end" or similar
   - `cancel_at_period_end` should be `true`

---

### Test 5: Extend Canceled Subscription

1. **User has subscription that's canceled at period end**

2. **Extend subscription:**
   - Go to `/pricing`
   - Click "Upgrade to Premium"
   - Complete checkout

3. **Verify:**
   - `subscriptionCancelAtPeriodEnd` should become `false`
   - `subscriptionExtendedPeriodEnd` should be set
   - Subscription should be reactivated

---

### Test 6: Multiple Extensions

1. **User has active subscription**

2. **Extend multiple times:**
   - Extend subscription once (check period end)
   - Extend again (should add to the already extended period end)
   - Each extension should add to the effective period end

3. **Verify:**
   - Final `subscriptionExtendedPeriodEnd` = original period end + sum of all extensions

---

## Test Cards for Different Scenarios

Stripe provides test cards for various scenarios:

### Successful Payment
- `4242 4242 4242 4242` - Always succeeds

### Payment Declined
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds

### 3D Secure Authentication
- `4000 0027 6000 3184` - Requires authentication
- Enter any code when prompted

### Subscription Trials
- Use any test card with a subscription that has a trial period

---

## Monitoring Test Events

### View Webhook Events

1. **Stripe Dashboard → Developers → Webhooks**
2. Click on your webhook endpoint
3. View "Recent events" tab
4. See all webhook events fired
5. Click on an event to see:
   - Request payload
   - Response from your server
   - Response time

### View Test Data

**Subscriptions:**
- Stripe Dashboard → Customers → Click customer → Subscriptions tab

**Invoices:**
- Stripe Dashboard → Customers → Click customer → Invoices tab

**Payment Methods:**
- Stripe Dashboard → Customers → Click customer → Payment methods tab

---

## Testing Webhook Locally

If you want to test webhooks locally, use Stripe CLI:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to http://localhost:8001/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

---

## Switching Back to Live Mode

**After testing:**

1. **Switch back to Live mode** in Stripe Dashboard
2. **Update `.env` with live keys:**
   ```bash
   nano backend/.env
   # Change back to live keys
   ```
3. **Restart backend:**
   ```bash
   pm2 restart backend
   ```

---

## Common Issues

### Webhook Not Receiving Events

1. **Check webhook endpoint URL** is correct
2. **Verify webhook secret** matches in `.env`
3. **Check backend logs:**
   ```bash
   pm2 logs backend --lines 50
   ```

### Extension Not Working

1. **Check database** for `subscriptionExtendedPeriodEnd`
2. **Verify webhook fired** in Stripe Dashboard
3. **Check backend logs** for extension processing

### Cancellation Not Working

1. **Verify** `subscriptionCancelAtPeriodEnd` is set to `true`
2. **Check Stripe Dashboard** shows subscription is set to cancel
3. **Wait for period end** - cancellation happens automatically

---

## Test Checklist

- [ ] Test mode enabled in Stripe Dashboard
- [ ] Test keys in `.env` file
- [ ] Test products and prices created
- [ ] Test webhook configured
- [ ] Backend restarted with test keys
- [ ] New subscription works
- [ ] Subscription extension works
- [ ] Multiple extensions work
- [ ] Cancellation works
- [ ] Extension after cancellation works
- [ ] Webhook events received
- [ ] Database updated correctly

---

## Quick Test Commands

**Check user subscription in database:**
```bash
mongosh
use chessrep
db.users.findOne({ email: "test@example.com" }, {
  email: 1,
  userType: 1,
  subscriptionStatus: 1,
  subscriptionCurrentPeriodEnd: 1,
  subscriptionExtendedPeriodEnd: 1,
  subscriptionCancelAtPeriodEnd: 1
})
```

**Check backend logs:**
```bash
pm2 logs backend --lines 100 | grep -i stripe
```

**Test subscription status endpoint:**
```bash
curl -X GET https://chesstrive.com/api/stripe/subscription-status \
  -H "x-auth-token: YOUR_TOKEN"
```

---

That's it! Use these steps to thoroughly test subscription extensions and cancellations before going live.

