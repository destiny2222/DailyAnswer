import { useEffect, useState, useCallback, useRef } from "react";
import { Platform } from "react-native";
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type ProductSubscription,
  type Purchase,
  type PurchaseError,
  ErrorCode,
} from "expo-iap";
import { apiRequest } from "@/utils/api";
import { useGlobalContext } from "@/utils/auth";

export const PRODUCT_ID_3MONTHS = "com.thedailyanswer.threemonths";
export const PRODUCT_ID_MONTHLY = "com.thedailyanswer.monthly.subscription";
export const PRODUCT_ID_YEARLY = "com.thedailyanswer.yearly";

const SKUS = [PRODUCT_ID_3MONTHS];

export interface AppleIapState {
  threeMonthsProduct: ProductSubscription | null;
  isLoading: boolean;
  isProcessing: boolean;
  purchaseThreeMonths: () => Promise<{ success: boolean; cancelled?: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; restored: boolean; error?: string }>;
  refreshProducts: () => Promise<void>;
}

export const useAppleIap = (): AppleIapState => {
  const { refetchUser, setHasPaid } = useGlobalContext();
  const [threeMonthsProduct, setThreeMonthsProduct] = useState<ProductSubscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const purchasePromiseResolve = useRef<
    ((value: { success: boolean; cancelled?: boolean; error?: string }) => void) | null
  >(null);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      await initConnection();

      // expo-iap uses fetchProducts with type 'subs' for subscriptions
      const products = await fetchProducts({ skus: SKUS, type: "subs" });
      const subs = products as ProductSubscription[];

      // expo-iap uses `product.id` (not `productId`) to identify a product
      const threeMonths = subs.find((p) => p.id === PRODUCT_ID_3MONTHS) ?? null;

      setThreeMonthsProduct(threeMonths);
    } catch (err) {
      console.warn("[Apple IAP] Error fetching subscriptions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();

    // expo-iap uses purchaseUpdatedListener (not purchaseUpdateListener)
    const purchaseUpdate = purchaseUpdatedListener(async (purchase: Purchase) => {
      // expo-iap uses purchase.purchaseToken as the JWS signed transaction on iOS
      // and purchase.id as the transactionId
      const token = purchase.purchaseToken || purchase.id;
      if (!token) return;

      try {
        setIsProcessing(true);

        const iosPurchase = purchase as any;

        // Send to Laravel backend for verification
        const response = await apiRequest<{ success: boolean; message?: string }>(
          "/payment/verify-apple-subscription",
          {
            method: "POST",
            body: {
              transaction_id: iosPurchase.transactionId ?? purchase.id,
              original_transaction_id:
                iosPurchase.originalTransactionIdentifierIOS ?? purchase.id,
              product_id: purchase.productId,
              transaction_receipt: purchase.purchaseToken,
              transaction_date: purchase.transactionDate,
            },
            auth: true,
          }
        );

        await finishTransaction({ purchase, isConsumable: false });

        if (response.success) {
          await refetchUser();
          setHasPaid(true);
          if (purchasePromiseResolve.current) {
            purchasePromiseResolve.current({ success: true });
            purchasePromiseResolve.current = null;
          }
        } else {
          if (purchasePromiseResolve.current) {
            purchasePromiseResolve.current({
              success: false,
              error: response.message || "Failed to verify subscription with server.",
            });
            purchasePromiseResolve.current = null;
          }
        }
      } catch (e: any) {
        try {
          await finishTransaction({ purchase, isConsumable: false });
        } catch {}
        if (purchasePromiseResolve.current) {
          purchasePromiseResolve.current({
            success: false,
            error: e?.message || "Server verification error.",
          });
          purchasePromiseResolve.current = null;
        }
      } finally {
        setIsProcessing(false);
      }
    });

    const purchaseError = purchaseErrorListener((error: PurchaseError) => {
      setIsProcessing(false);
      const isCancelled =
        error.code === ErrorCode.E_USER_CANCELLED ||
        error.message?.toLowerCase().includes("user canceled") ||
        error.message?.toLowerCase().includes("user cancelled") ||
        error.message?.toLowerCase().includes("cancelled");

      if (purchasePromiseResolve.current) {
        purchasePromiseResolve.current({
          success: false,
          cancelled: isCancelled,
          error: isCancelled ? undefined : error.message || "Purchase failed.",
        });
        purchasePromiseResolve.current = null;
      }
    });

    return () => {
      purchaseUpdate.remove();
      purchaseError.remove();
      endConnection();
    };
  }, [loadProducts, refetchUser, setHasPaid]);

  const requestPurchaseInternal = async (
    productId: string
  ): Promise<{ success: boolean; cancelled?: boolean; error?: string }> => {
    setIsProcessing(true);

    return new Promise(async (resolve) => {
      purchasePromiseResolve.current = resolve;
      try {
        if (Platform.OS === "ios") {
          // expo-iap requestPurchase for iOS takes sku under ios.sku
          await requestPurchase({ ios: { sku: productId } });
        } else {
          await requestPurchase({ android: { skus: [productId] } } as any);
        }
      } catch (err: any) {
        setIsProcessing(false);
        const isCancelled =
          err?.code === ErrorCode.E_USER_CANCELLED ||
          err?.message?.toLowerCase().includes("user canceled") ||
          err?.message?.toLowerCase().includes("user cancelled") ||
          err?.message?.toLowerCase().includes("cancelled");

        purchasePromiseResolve.current = null;
        resolve({
          success: false,
          cancelled: isCancelled,
          error: isCancelled ? undefined : err?.message || "Unable to start purchase.",
        });
      }
    });
  };

  const purchaseThreeMonths = useCallback(async () => {
    return requestPurchaseInternal(PRODUCT_ID_3MONTHS);
  }, []);

  const restorePurchases = useCallback(async (): Promise<{
    success: boolean;
    restored: boolean;
    error?: string;
  }> => {
    try {
      setIsProcessing(true);
      const purchases = await getAvailablePurchases({
        onlyIncludeActiveItemsIOS: true,
      });

      const activeIap = purchases.find(
        (p) =>
          p.productId === PRODUCT_ID_3MONTHS ||
          p.productId === PRODUCT_ID_MONTHLY ||
          p.productId === PRODUCT_ID_YEARLY
      );

      if (activeIap) {
        const iosP = activeIap as any;
        const response = await apiRequest<{ success: boolean; message?: string }>(
          "/payment/verify-apple-subscription",
          {
            method: "POST",
            body: {
              transaction_id: iosP.transactionId ?? activeIap.id,
              original_transaction_id:
                iosP.originalTransactionIdentifierIOS ?? activeIap.id,
              product_id: activeIap.productId,
              transaction_receipt: activeIap.purchaseToken,
            },
            auth: true,
          }
        );

        if (response.success) {
          await refetchUser();
          setHasPaid(true);
          return { success: true, restored: true };
        }
      }

      // Fallback: re-check profile from backend
      await refetchUser();
      const profile = await apiRequest<{ success: boolean; data: { has_paid: boolean } }>(
        "/profile",
        { auth: true }
      );

      if (profile?.data?.has_paid) {
        setHasPaid(true);
        return { success: true, restored: true };
      }

      return { success: true, restored: false };
    } catch (err: any) {
      return {
        success: false,
        restored: false,
        error: err?.message || "Failed to restore purchases.",
      };
    } finally {
      setIsProcessing(false);
    }
  }, [refetchUser, setHasPaid]);

  return {
    threeMonthsProduct,
    isLoading,
    isProcessing,
    purchaseThreeMonths,
    restorePurchases,
    refreshProducts: loadProducts,
  };
};
