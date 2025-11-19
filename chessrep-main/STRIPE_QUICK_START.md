# Stripe Integration - Quick Start

## Quick Setup Steps

1. **Install dependencies:**
   ```bash
   cd chessrep-main/backend && npm install
   cd ../frontend && npm install
   ```

2. **Get Stripe API keys:**
   - Sign up at https://stripe.com
   - Go to Dashboard → Developers → API keys
   - Copy your **Secret key** (starts with `sk_test_...` or `sk_live_...`)

3. **Create products in Stripe:**
   - Go to Products → Add product
   - Create Premium product: $4.99/month and $49.99/year
   - Copy the Price IDs (start with `price_...`)

4. **Set up webhooks (for local testing):**
   ```bash
   # Install Stripe CLI
   stripe login
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   # Copy the webhook secret (whsec_...)
   ```

5. **Configure environment variables:**
   
   **Backend `.env`:**
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_PREMIUM_MONTHLY=price_...
   STRIPE_PRICE_PREMIUM_YEARLY=price_...
   FRONTEND_URL=http://localhost:3000
   ```

6. **Test it:**
   - Start your backend and frontend
   - Go to `/pricing` page
   - Click a plan button
   - Use test card: `4242 4242 4242 4242`
   - Check Stripe Dashboard to verify subscription was created

## What Was Implemented

✅ Stripe checkout session creation
✅ Webhook handling for subscription events
✅ User subscription status tracking
✅ Subscription cancellation/reactivation
✅ Customer portal integration
✅ Frontend pricing page integration
✅ User model updated with subscription fields

## Files Modified/Created

**Backend:**
- `backend/package.json` - Added Stripe SDK
- `backend/models/User.js` - Added subscription fields
- `backend/routes/stripe.js` - Stripe API routes
- `backend/server.js` - Registered Stripe routes

**Frontend:**
- `frontend/package.json` - Added Stripe React libraries
- `frontend/src/services/stripeService.js` - Stripe API service
- `frontend/src/components/ui/pricing.tsx` - Integrated Stripe checkout

**Documentation:**
- `STRIPE_SETUP.md` - Complete setup guide
- `STRIPE_QUICK_START.md` - This file

## Next Steps

1. Read `STRIPE_SETUP.md` for detailed instructions
2. Set up production webhooks when deploying
3. Test thoroughly with Stripe test mode
4. Switch to live mode keys when ready for production

## Support

For detailed setup instructions, see `STRIPE_SETUP.md`

