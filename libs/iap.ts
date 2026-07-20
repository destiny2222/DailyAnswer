import * as IAP from 'expo-iap';
import { apiRequest } from '../utils/api';
import { Platform } from 'react-native';

// The SKUs should be provided by the user and match App Store Connect / Google Play Console
export const itemSkus = Platform.select({
  ios: [
    'com.thedailyanswer.premium.monthly'
  ],
  android: [
    'com.dailyanswer.monthly',
  ]
}) || [];

export interface VerifyReceiptResponse {
  success: boolean;
  message: string;
}

/**
 * Initializes the IAP connection.
 * Should be called when the app or subscription screen mounts.
 */
export async function initIAPConnection() {
  try {
    await IAP.initConnection();
  } catch (err) {
    console.error('Failed to initialize IAP connection:', err);
  }
}

/**
 * Ends the IAP connection.
 * Should be called when the subscription screen unmounts.
 */
export async function endIAPConnection() {
  try {
    await IAP.endConnection();
  } catch (err) {
    console.error('Failed to end IAP connection:', err);
  }
}

/**
 * Fetches available subscriptions from the store.
 */
export async function fetchSubscriptions() {
  try {
    const products = await IAP.fetchProducts({ skus: itemSkus, type: 'subs' });
    return products as IAP.ProductSubscription[];
  } catch (err) {
    console.error('Failed to fetch subscriptions:', err);
    throw err;
  }
}

/**
 * Requests a subscription purchase.
 * @param sku The product ID to purchase.
 */
export async function requestPurchase(sku: string) {
  try {
    await IAP.requestPurchase({
      request: {
        apple: { sku },
        google: { skus: [sku] }, // Note: For Android subscriptions, you may also need to provide an offerToken
      },
      type: 'subs'
    });
  } catch (err) {
    console.error('Failed to request purchase:', err);
    throw err;
  }
}

/**
 * Verifies the receipt with your Laravel backend.
 * @param receipt The transaction receipt string.
 * @param productId The ID of the product purchased.
 */
export async function verifyReceiptWithBackend(receipt: string, productId: string): Promise<VerifyReceiptResponse> {
  try {
    // TODO: The exact endpoint URL needs to be provided by the user
    const response = await apiRequest<VerifyReceiptResponse>('/payment/verify-receipt', {
      method: 'POST',
      body: {
        receipt,
        platform: Platform.OS,
        product_id: productId,
      },
      auth: true,
    });
    return response;
  } catch (error) {
    console.error('Receipt verification failed:', error);
    throw error;
  }
}
