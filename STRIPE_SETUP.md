# Stripe Payment Integration Setup

## Overview

This app uses Stripe to handle subscription payments. The integration follows these steps:

1. User clicks "Subscribe Now"
2. App creates a payment intent via backend
3. Stripe Payment Sheet is presented
4. User completes payment
5. Backend confirms payment and updates user status

## Setup Instructions

### 1. Install Dependencies

The Stripe package is already installed in `package.json`:

```json
"@stripe/stripe-react-native": "0.50.3"
```

### 2. Configure Environment Variables

Add your Stripe publishable key to `.env`:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

**Where to find your keys:**

- Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
- Add it to your `.env` file

### 3. Backend Configuration

Ensure your backend has the Stripe secret key configured in `config/services.php`:

```php
'stripe' => [
    'secret' => env('STRIPE_SECRET_KEY'),
],
```

### 4. Test the Integration

#### Test Cards (Development):

- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **Requires Auth:** 4000 0025 0000 3155

Use any future expiry date, any 3-digit CVC, and any ZIP code.

## File Structure

```
├── app/
│   ├── _layout.tsx              # StripeProvider wrapper
│   └── (root)/
│       └── subscription.tsx      # Payment screen
├── components/
│   ├── AuthGuardModal.tsx       # Login prompt
│   └── SubscriptionModal.tsx    # Subscribe prompt
├── libs/
│   └── payment.ts               # Payment API functions
└── utils/
    └── auth.ts                  # Auth & subscription checks
```

## Payment Flow

### 1. User Journey

```
View Devotional → Not Authenticated? → AuthGuardModal
                ↓
           Authenticated → No Subscription? → SubscriptionModal
                ↓
          Has Subscription → View Full Content
```

### 2. API Endpoints Used

**Create Payment Intent:**

```
POST /payment/create-intent
Response: { clientSecret: "pi_xxx_secret_xxx" }
```

**Confirm Payment:**

```
POST /payment/confirm
Body: { payment_intent_id: "pi_xxx" }
Response: { success: true, data: { has_paid: true, ... } }
```

**Check Status:**

```
GET /payment/status
Response: { success: true, data: { has_paid: true, ... } }
```

### 3. Code Flow

1. **User clicks "Subscribe Now" in SubscriptionModal**

   ```typescript
   router.push("/(root)/subscription");
   ```

2. **Subscription screen loads**
   - Creates payment intent: `createPaymentIntent()`
   - Initializes Stripe sheet: `initPaymentSheet()`

3. **User completes payment**
   - Presents payment sheet: `presentPaymentSheet()`
   - On success, confirms with backend: `confirmPayment()`

4. **Backend updates user**
   - Sets `has_paid = true`
   - Sets `payment_expires_at = now + 1 year`
   - Returns updated user data

5. **App refreshes access**
   - Next time user clicks devotional, `canAccessPremiumContent()` returns true
   - User can view full content

## Important Notes

### Security

- ✅ Payment amount is calculated server-side (prevents manipulation)
- ✅ Client secret is generated server-side
- ✅ Payment confirmation happens server-side
- ✅ Never expose secret keys in client code

### Testing

1. Use test mode keys (pk*test*...)
2. Use test cards from Stripe docs
3. Check Stripe Dashboard for test payments

### Production Checklist

- [ ] Replace test keys with live keys
- [ ] Test with real card (small amount)
- [ ] Configure webhook for subscription status
- [ ] Add subscription cancellation
- [ ] Handle failed payments
- [ ] Add receipt email

## Troubleshooting

### "Missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY"

- Add the key to `.env` file
- Restart the development server: `npx expo start -c`

### Payment sheet doesn't open

- Check console for initialization errors
- Verify publishable key is correct
- Ensure backend returns valid client_secret

### Payment succeeds but user not updated

- Check `/payment/confirm` endpoint logs
- Verify payment_intent_id is extracted correctly
- Check backend database for user updates

## Support

For Stripe-specific issues:

- [Stripe React Native Docs](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Support](https://support.stripe.com)
