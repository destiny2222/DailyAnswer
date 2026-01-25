# Fixing Authentication Error in Payment Flow

## Error

```
ERROR  Payment error: [ApiError: Call to a member function update() on null]
```

## Root Cause

The backend's `$request->user()` is returning `null`, which means the user is not authenticated when the `/payment/confirm` endpoint is called.

## Solutions

### Solution 1: Check Backend Route Middleware

Your backend routes for payment endpoints **MUST** have the `auth:sanctum` middleware.

**Check your `routes/api.php`:**

```php
// ❌ WRONG - No auth middleware
Route::post('/payment/create-intent', [PaymentController::class, 'createPaymentIntent']);
Route::post('/payment/confirm', [PaymentController::class, 'confirmPayment']);

// ✅ CORRECT - With auth middleware
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/payment/create-intent', [PaymentController::class, 'createPaymentIntent']);
    Route::post('/payment/confirm', [PaymentController::class, 'confirmPayment']);
    Route::get('/payment/status', [PaymentController::class, 'checkPaymentStatus']);
});
```

### Solution 2: Verify Token is Saved After Login

**Check your login/signup endpoints** to ensure they return and save the token properly.

**Frontend - After successful login:**

```typescript
// In your login handler
const response = await apiRequest("/auth/login", {
  method: "POST",
  body: { email, password },
  auth: false, // Don't require auth for login
});

// Save the token
if (response.token) {
  await SecureStore.setItemAsync("access_token", response.token);
}
```

**Backend - Your login should return:**

```php
return response()->json([
    'success' => true,
    'token' => $user->createToken('auth-token')->plainTextToken,
    'user' => $user,
]);
```

### Solution 3: Check CORS and Headers

Make sure your Laravel backend accepts the Authorization header:

**In `config/cors.php`:**

```php
'allowed_headers' => ['*'],
// or specifically
'allowed_headers' => ['Content-Type', 'Authorization', 'Accept'],
```

### Solution 4: Debug the Issue

1. **Navigate to the debug screen:**

   ```
   /(root)/auth-debug
   ```

2. **Check if token exists** - Should show your bearer token

3. **Click "Test Profile Fetch"** - If this fails, the issue is authentication setup

4. **Check console logs** - The app now logs:
   - Token being used
   - Payment intent creation
   - Payment confirmation
   - Backend responses

### Solution 5: Verify Backend User Query

In your `PaymentController.php`, add debugging:

```php
public function confirmPayment(Request $request)
{
    $request->validate([
        'payment_intent_id' => 'required|string',
    ]);

    // Debug: Check if user is authenticated
    $user = $request->user();

    if (!$user) {
        \Log::error('User not authenticated in confirmPayment');
        return response()->json([
            'success' => false,
            'message' => 'User not authenticated. Please log in again.',
        ], 401);
    }

    Stripe::setApiKey(config('services.stripe.secret'));

    try {
        // ... rest of your code
    }
}
```

### Solution 6: Check Sanctum Configuration

**In `config/sanctum.php`:**

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,127.0.0.1')),

'guard' => ['web'],

'expiration' => null, // Tokens don't expire

'middleware' => [
    'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
    'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
],
```

### Testing Steps

1. **Clear app data** and log in fresh
2. **Check console logs** for "Using auth token: ..." message
3. **If no token**, check your login flow
4. **If token exists but backend says null**, check backend middleware
5. **Try the auth-debug screen** to verify profile fetch works

### Quick Fix Checklist

- [ ] Backend routes have `auth:sanctum` middleware
- [ ] Token is being saved after login: `SecureStore.setItemAsync('access_token', token)`
- [ ] Token is being sent with requests (check console logs)
- [ ] CORS allows Authorization header
- [ ] Sanctum is properly configured
- [ ] User model uses `HasApiTokens` trait

## Expected Console Output (Success)

```
Step 1: Creating payment intent...
Using auth token: eyJ0eXAiOiJKV1QiLCJ...
Payment intent created successfully

Step 2: Initializing payment sheet...
Step 3: Presenting payment sheet...
Payment sheet completed successfully

Step 4: Confirming payment on backend, ID: pi_xxx
Using auth token: eyJ0eXAiOiJKV1QiLCJ...
Confirming payment with ID: pi_xxx
Payment confirmed successfully: { success: true, ... }
```

## Still Not Working?

Share:

1. Console output from the payment flow
2. Your Laravel route definition for `/payment/confirm`
3. Result from the auth-debug screen
