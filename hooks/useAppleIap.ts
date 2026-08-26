import { useCallback, useEffect, useRef, useState } from "react";
import { useIAP, getAvailablePurchases as getAvailablePurchasesRoot } from "expo-iap";
import type { Purchase } from "expo-iap";
import { apiRequest } from "@/utils/api";
import { useGlobalContext } from "@/utils/auth";

export const PRODUCT_ID_3MONTHS = "com.thedailyanswer.threemonths";

const SUBSCRIPTION_SKUS = [
  PRODUCT_ID_3MONTHS,
];

export interface AppleIapState {
  threeMonthsProduct: import("expo-iap").ProductSubscription | null;
  isLoading: boolean;
  isProcessing: boolean;
  purchaseThreeMonths: () => Promise<{
    success: boolean;
    cancelled?: boolean;
    error?: string;
  }>;
  restorePurchases: () => Promise<{
    success: boolean;
    restored: boolean;
    error?: string;
  }>;
  refreshProducts: () => Promise<void>;
}

export const useAppleIap = (): AppleIapState => {
  const { refetchUser, setHasPaid } = useGlobalContext();

  const [isProcessing, setIsProcessing] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);

  const purchasePromiseResolve = useRef<
    ((value: { success: boolean; cancelled?: boolean; error?: string }) => void) | null
  >(null);
  const activeProductId = useRef<string | null>(null);

  // We need finishTransaction inside the success callback, so we keep a ref
  const finishTransactionRef = useRef<
    ((params: { purchase: Purchase; isConsumable?: boolean }) => Promise<void>) | null
  >(null);

  const verifyAndFinish = useCallback(
    async (purchase: Purchase): Promise<{ success: boolean; error?: string }> => {
      const iosPurchase = purchase as any;

      try {
        const response = await apiRequest<{ success: boolean; message?: string }>(
          "/payment/verify-apple-subscription",
          {
            method: "POST",
            body: {
              transaction_id: iosPurchase.transactionId ?? purchase.id,
              original_transaction_id:
                iosPurchase.originalTransactionIdentifierIOS ?? purchase.id,
              product_id: purchase.productId,
              // purchaseToken is the JWS / receipt on modern StoreKit 2
              transaction_receipt: purchase.purchaseToken,
              transaction_date: purchase.transactionDate,
            },
            auth: true,
          }
        );

        // Always finish after server verification attempt
        if (finishTransactionRef.current) {
          await finishTransactionRef.current({
            purchase,
            isConsumable: false,
          });
        }

        if (response.success) {
          await refetchUser();
          setHasPaid(true);
        }

        return {
          success: !!response.success,
          error: response.success
            ? undefined
            : response.message || "Failed to verify subscription with server.",
        };
      } catch (e: any) {
        // Still try to finish so the transaction doesn't stay stuck
        try {
          if (finishTransactionRef.current) {
            await finishTransactionRef.current({
              purchase,
              isConsumable: false,
            });
          }
        } catch {}
        return {
          success: false,
          error: e?.message || "Server verification error.",
        };
      }
    },
    [refetchUser, setHasPaid]
  );

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    getActiveSubscriptions, // preferred for subscriptions when available
  } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      // console.log("[Apple IAP] onPurchaseSuccess:", purchase.productId);

      const isCurrentRequest =
        activeProductId.current !== null &&
        purchase.productId === activeProductId.current;

      setIsProcessing(true);

      const result = await verifyAndFinish(purchase);

      if (isCurrentRequest && purchasePromiseResolve.current) {
        purchasePromiseResolve.current(result);
        purchasePromiseResolve.current = null;
        activeProductId.current = null;
      }

      setIsProcessing(false);
    },

    onPurchaseError: (error: any) => {
      // console.warn("[Apple IAP] onPurchaseError:", error);
      setIsProcessing(false);

      const isCancelled =
        error?.code === "user-cancelled" ||
        error?.code === "E_USER_CANCELLED" ||
        error?.message?.toLowerCase?.().includes("cancel");

      if (purchasePromiseResolve.current) {
        purchasePromiseResolve.current({
          success: false,
          cancelled: isCancelled,
          error: isCancelled ? undefined : error?.message || "Purchase failed.",
        });
        purchasePromiseResolve.current = null;
        activeProductId.current = null;
      }
    },

    onError: (error: Error) => {
      // console.warn("[Apple IAP] hook error:", error);
    },
  });

  // Keep finishTransaction in a ref so verifyAndFinish can use the latest one
  useEffect(() => {
    finishTransactionRef.current = finishTransaction;
  }, [finishTransaction]);

  const threeMonthsProduct =
    subscriptions.find((p) => p.id === PRODUCT_ID_3MONTHS) ?? null;

  // ─── Auto-fetch products when connected ────────────────────────────────────
  const refreshProducts = useCallback(async () => {
    if (!connected) return;
    try {
      // console.log("[Apple IAP] Fetching products...", SUBSCRIPTION_SKUS);
      await fetchProducts({ skus: SUBSCRIPTION_SKUS, type: "subs" });
      // Temporary debug – remove later
      // console.log("[Apple IAP] Raw subscriptions after fetch:", JSON.stringify(subscriptions, null, 2));
      // console.log("[Apple IAP] Requested SKUs:", SUBSCRIPTION_SKUS);
      setProductsLoaded(true);
      // console.log("[Apple IAP] Products fetched");
    } catch (err: any) {
      // console.error("[Apple IAP] fetchProducts ERROR:", err);
      setProductsLoaded(true); // still mark as attempted so UI can show error 
    }
  }, [connected, fetchProducts]);

  useEffect(() => {
    if (connected) {
      refreshProducts();
    }
  }, [connected, refreshProducts]);

  // Debug (remove in production)
  useEffect(() => {
    if (__DEV__) {
      // console.log("========== APPLE IAP DEBUG ==========");
      // console.log("Connected:", connected);
      // console.log("Products loaded:", productsLoaded);
      // console.log("Subscriptions count:", subscriptions.length);
      // console.log("3 Month Product:", threeMonthsProduct?.id, threeMonthsProduct?.displayPrice);
      // console.log("=====================================");
    }
  }, [connected, productsLoaded, subscriptions, threeMonthsProduct]);

  // ─── Purchase ──────────────────────────────────────────────────────────────
  const purchaseThreeMonths = useCallback(async () => {
    if (!threeMonthsProduct) {
      return {
        success: false,
        error: "Product not loaded yet. Please try again in a moment.",
      };
    }
    if (isProcessing) {
      return { success: false, error: "A purchase is already in progress." };
    }

    setIsProcessing(true);

    return new Promise<{ success: boolean; cancelled?: boolean; error?: string }>(
      async (resolve) => {
        purchasePromiseResolve.current = resolve;
        activeProductId.current = PRODUCT_ID_3MONTHS;

        try {
          await requestPurchase({
            request: {
              apple: { sku: PRODUCT_ID_3MONTHS },
              // Google needs offer tokens when you support Android later
              google: { skus: [PRODUCT_ID_3MONTHS] },
            },
            type: "subs",
          });
          // Success/error will be delivered via onPurchaseSuccess / onPurchaseError
        } catch (err: any) {
          setIsProcessing(false);
          purchasePromiseResolve.current = null;
          activeProductId.current = null;

          const isCancelled =
            err?.code === "user-cancelled" ||
            err?.code === "E_USER_CANCELLED" ||
            err?.message?.toLowerCase?.().includes("cancel");

          resolve({
            success: false,
            cancelled: isCancelled,
            error: isCancelled
              ? undefined
              : err?.message || "Unable to start purchase.",
          });
        }
      }
    );
  }, [threeMonthsProduct, isProcessing, requestPurchase]);

  // ─── Restore ───────────────────────────────────────────────────────────────
  const restorePurchases = useCallback(async () => {
    try {
      setIsProcessing(true);

      // Prefer root API so we get the array immediately (no stale state)
      const purchases = await getAvailablePurchasesRoot({
        onlyIncludeActiveItemsIOS: true,
      });

      const activeIap = purchases.find(
        (p) =>
          p.productId === PRODUCT_ID_3MONTHS
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

      // Fallback: trust your backend status
      await refetchUser();
      const profile = await apiRequest<{
        success: boolean;
        data: { has_paid: boolean };
      }>("/profile", { auth: true });

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
    isLoading: !connected || !productsLoaded,
    isProcessing,
    purchaseThreeMonths,
    restorePurchases,
    refreshProducts,
  };
};