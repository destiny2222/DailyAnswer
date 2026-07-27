import {
  endConnection,
  fetchProducts,
  initConnection,
  requestPurchase,
  restorePurchases,
  type ProductSubscription,
} from 'expo-iap';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

const PRODUCT_ID = 'com.thedailyanswer.monthly';

export const useAppleIAP = () => {
  const [product, setProduct] = useState<ProductSubscription | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const connectAndFetch = useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    setLoading(true);
    setError(null);
    try {
      logger.info('[IAP] Connecting to StoreKit...');
      const connected = await initConnection();
      if (!connected) {
        throw new Error('Failed to connect to StoreKit');
      }
      logger.info('[IAP] Fetching subscription product:', PRODUCT_ID);
      const items = await fetchProducts({ skus: [PRODUCT_ID], type: 'subs' });
      logger.info('[IAP] Fetched products:', items);

      const foundProduct = items.find((p) => p.id === PRODUCT_ID);
      if (foundProduct) {
        setProduct(foundProduct as ProductSubscription);
      } else {
        logger.warn('[IAP] Product not found in App Store Connect:', PRODUCT_ID);
        setError('Monthly premium subscription product not found.');
      }
    } catch (err: any) {
      logger.error('[IAP] Error initializing StoreKit / fetching products:', err);
      setError(err.message || 'Error communicating with App Store.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    connectAndFetch();
    return () => {
      // Release resources when component unmounts
      endConnection().catch((err) => {
        logger.error('[IAP] Error ending connection:', err);
      });
    };
  }, [connectAndFetch]);

  const handlePurchase = async () => {
    if (Platform.OS !== 'ios') return;
    setLoading(true);
    setError(null);
    try {
      logger.info('[IAP] Requesting purchase for:', PRODUCT_ID);
      await requestPurchase({
        request: {
          apple: {
            sku: PRODUCT_ID,
          },
        },
        type: 'subs',
      });
    } catch (err: any) {
      logger.error('[IAP] Purchase request failed:', err);
      // E_USER_CANCELLED or similar
      if (err.code !== 'E_USER_CANCELLED' && err.code !== 'USER_CANCELLED') {
        setError(err.message || 'Purchase request failed.');
      }
      setLoading(false);
      throw err;
    }
  };

  const handleRestore = async () => {
    if (Platform.OS !== 'ios') return;
    setLoading(true);
    setError(null);
    try {
      logger.info('[IAP] Restoring purchases...');
      await restorePurchases();
      logger.info('[IAP] Restore requested successfully.');
    } catch (err: any) {
      logger.error('[IAP] Restore purchases failed:', err);
      setError(err.message || 'Restore purchases failed.');
      setLoading(false);
      throw err;
    }
  };

  return {
    product,
    loading,
    error,
    subscribe: handlePurchase,
    restore: handleRestore,
    refetchProduct: connectAndFetch,
  };
};
