# Apple In-App Purchase (IAP) Setup Guide

This guide details the configurations and steps required to manage and test the Apple In-App Purchase monthly subscription in App Store Connect and local development.

---

## 1. StoreKit Subscription Details

- **Product ID**: `com.thedailyanswer.monthly`
- **Product Type**: Auto-renewable Subscription
- **Billing Period**: Monthly
- **Subscription Group**: Create a new subscription group (e.g., "Daily Answer Premium Group") to house this product.

---

## 2. App Store Connect Configuration Steps

1. **Paid Apps Agreement**:
   - Go to **Business** in App Store Connect.
   - Ensure the **Paid Apps Agreement** is signed, active, and bank/tax details are configured. Otherwise, IAP products will not resolve or load.

2. **Create Subscription Group**:
   - Navigate to **Apps** > **Daily Answer** > **In-App Purchases** > **Subscriptions**.
   - Under **Subscription Groups**, click **Create**. Name it `Daily Answer Premium Group`.

3. **Create the Product**:
   - Click the plus `+` icon inside your new Subscription Group.
   - Enter Reference Name: `Daily Answer Premium Monthly`.
   - Enter Product ID: `com.thedailyanswer.monthly`.

4. **Pricing and Metadata**:
   - Select your pricing tier (e.g., $9.99/month).
   - Enter **Localization** details: Title: `Daily Answer Premium`, Description: `Unlock full access to premium devotional content, offline reading, and audio playback.`
   - Select a **Tax Category**: Recommend matching the parent app's primary category (e.g., *App Store - Books / Reference*).

5. **App Review Metadata**:
   - Upload an **App Review Screenshot** of the subscription screen (dimensions matching the device size).
   - Add **Review Notes** detailing how to test:
     
     > “Daily Answer Premium is a monthly auto-renewable subscription that unlocks full access to premium devotional content, devotional audio playback, and offline reading.
     >
     > To locate the subscription:
     > 1. Sign in to the app.
     > 2. Open Profile.
     > 3. Select Subscription.
     > 4. Tap Subscribe.
     >
     > The iOS subscription is processed exclusively through Apple In-App Purchase using StoreKit. The previous Stripe and Apple Pay payment flow for digital subscriptions has been removed from the iOS app. Restore Purchases is available on the subscription screen. The previous external Support Us payment option has been removed from the iOS app. Phone number is no longer required during registration.”

---

## 3. App Store Server Notifications

Verify and set up Notification URLs in App Store Connect (**General** > **App Information** > **App Store Server Notifications**):
- **Production Server URL**: `https://your-api-url.com/api/v1/webhooks/apple/app-store`
- **Sandbox Server URL**: `https://your-api-url.com/api/v1/webhooks/apple/app-store` (or a sandbox-specific URL)
- **Version**: Version 2 notifications (signed JWT payload).

---

## 4. Required Backend Environment Credentials

To verify StoreKit 2 transactions server-side, the backend requires:
- **Apple Issuer ID** (from App Store Connect > Users and Access > Integrations > App Store Connect API).
- **Apple Key ID** (from the same page, after creating an API Key).
- **Apple Private Key (.p8 file)** (downloaded upon key generation, stored securely).
- **App Bundle ID**: `com.thedailyanswer`

---

## 5. Development & Testing Instructions

### Sandbox Tester Setup
1. In App Store Connect, go to **Users and Access** > **Sandbox Testers**.
2. Create a new sandbox tester profile using a real email alias.
3. On your testing iOS device, go to **Settings** > **App Store** > **Sandbox Account** and sign in with the sandbox credentials.

### Common Build Commands
- **Create iOS Development Build (EAS)**:
  ```bash
  eas build --profile development --platform ios
  ```
- **Create Production Build / TestFlight (EAS)**:
  ```bash
  eas build --profile production --platform ios
  ```

### IAP Testing Checklist
- **Purchase**: Tap "Subscribe". Complete the sandbox purchase. Verify that the screen transitions to "You're All Set!" and backend records the premium entitlement.
- **Cancel Subscription**: Go to **Settings** > **Apple ID** > **Subscriptions** on the device to manage and cancel sandbox renewals.
- **Restore Purchases**: Reinstall the app (or log out and sign in with a different account) and tap **Restore Purchases** on the subscription screen. Ensure premium entitlement is successfully verified and restored.
- **Expiration/Renewal**: Sandbox subscriptions renew at accelerated rates (a 1-month subscription expires/renews every 5 minutes). Check renewal hooks and backend state updates.
- **Refund / Revocation**: Simulate refunds inside App Store Connect Sandbox management to verify the server revokes premium access.

---

## 6. Common Reasons StoreKit Returns No Products

If `fetchProducts` returns an empty array:
1. The **Paid Apps Agreement** is not active in App Store Connect.
2. The subscription product has not been created inside a **Subscription Group**, or the Product ID does not match.
3. The App Store screenshot or localizations have not been filled in.
4. The iOS bundle identifier in the build (`com.thedailyanswer`) does not match the app's bundle identifier in App Store Connect.
5. You are running on an iOS Simulator where StoreKit products can occasionally fail to load unless configured with a local `.storekit` configuration file. Try on a real device.
