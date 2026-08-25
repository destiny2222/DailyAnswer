import { useCallback, useRef } from "react";
import { useIAP } from "expo-iap";
import type { Purchase } from "expo-iap";
import { apiRequest } from "@/utils/api";
import { useGlobalContext } from "@/utils/auth";

export const PRODUCT_ID_3MONTHS = "com.thedailyanswer.threemonths";
export const PRODUCT_ID_MONTHLY = "com.thedailyanswer.monthly.subscription";
export const PRODUCT_ID_YEARLY = "com.thedailyanswer.yearly";

const SUBSCRIPTION_SKUS = [
  PRODUCT_ID_3MONTHS,
  PRODUCT_ID_MONTHLY,
  PRODUCT_ID_YEARLY,
];

export interface AppleIapState {
  threeMonthsProduct: import("expo-iap").ProductSubscription | null;
  isLoading: boolean;
  isProcessing: boolean;
  purchaseThreeMonths: () => Promise<{ success: boolean; cancelled?: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; restored: boolean; error?: string }>;
  refreshProducts: () => Promise<void>;
}

export const useAppleIap = (): AppleIapState => {
  const { refetchUser, setHasPaid } = useGlobalContext();

  const purchasePromiseResolve = useRef<
    ((value: { success: boolean; cancelled?: boolean; error?: string }) => void) | null
  >(null);
  const activeProductId = useRef<string | null>(null);
  const isProcessingRef = useRef(false);

  // ─── Verify a purchase with the backend and finish the transaction ───────────
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
        }

        return {
          success: response.success,
          error: response.success
            ? undefined
            : response.message || "Failed to verify subscription with server.",
        };
      } catch (e: any) {
        // Always attempt to finish even if verification fails, to prevent
        // the transaction from getting stuck in the queue.
        try {
          await finishTransaction({ purchase, isConsumable: false });
        } catch {}
        return { success: false, error: e?.message || "Server verification error." };
      }
    },
    [refetchUser, setHasPaid]
  );

  // ─── useIAP hook — handles initConnection / endConnection / listeners ────────
  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    getAvailablePurchases,
    availablePurchases,
  } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      console.log("[Apple IAP] purchaseUpdatedListener:", purchase);

      const isCurrentRequest =
        activeProductId.current !== null &&
        purchase.productId === activeProductId.current;

      isProcessingRef.current = true;

      const result = await verifyAndFinish(purchase);

      // Only resolve the waiting promise if this transaction belongs to
      // the currently in-flight purchase request (not a stale replay).
      if (isCurrentRequest && purchasePromiseResolve.current) {
        purchasePromiseResolve.current(result);
        purchasePromiseResolve.current = null;
        activeProductId.current = null;
      }

      isProcessingRef.current = false;
    },

    onPurchaseError: (error: any) => {
      console.warn("[Apple IAP] purchaseErrorListener:", error);
      isProcessingRef.current = false;

      const isCancelled =
        error.code === "user-cancelled" ||
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
        activeProductId.current = null;
      }
    },

    onError: (error: Error) => {
      console.warn("[Apple IAP] hook error:", error);
    },
  });

  // ─── Load subscription products ──────────────────────────────────────────────
  const refreshProducts = useCallback(async () => {
    try {
      await fetchProducts({ skus: SUBSCRIPTION_SKUS, type: "subs" });
      console.log("[Apple IAP] Subscriptions fetched:", subscriptions);
    } catch (err) {
      console.warn("[Apple IAP] fetchProducts error:", err);
    }
  }, [fetchProducts, subscriptions]);

  // Derive the 3-month product from the subscriptions list managed by useIAP
  const threeMonthsProduct =
    subscriptions.find((p) => p.id === PRODUCT_ID_3MONTHS) ?? null;

  // ─── Trigger a subscription purchase ────────────────────────────────────────
  const purchaseThreeMonths = useCallback(async (): Promise<{
    success: boolean;
    cancelled?: boolean;
    error?: string;
  }> => {
    if (!threeMonthsProduct) {
      return { success: false, error: "Product not loaded yet. Please try again." };
    }

    isProcessingRef.current = true;

    return new Promise(async (resolve) => {
      purchasePromiseResolve.current = resolve;
      activeProductId.current = PRODUCT_ID_3MONTHS;

      try {
        await requestPurchase({
          request: {
            apple: { sku: PRODUCT_ID_3MONTHS },
            google: { skus: [PRODUCT_ID_3MONTHS] },
          },
          type: "subs",
        });
      } catch (err: any) {
        isProcessingRef.current = false;

        const isCancelled =
          err?.code === "user-cancelled" ||
          err?.message?.toLowerCase().includes("user canceled") ||
          err?.message?.toLowerCase().includes("user cancelled") ||
          err?.message?.toLowerCase().includes("cancelled");

        purchasePromiseResolve.current = null;
        activeProductId.current = null;

        resolve({
          success: false,
          cancelled: isCancelled,
          error: isCancelled ? undefined : err?.message || "Unable to start purchase.",
        });
      }
    });
  }, [threeMonthsProduct, requestPurchase]);

  // ─── Restore previous purchases ──────────────────────────────────────────────
  const restorePurchases = useCallback(async (): Promise<{
    success: boolean;
    restored: boolean;
    error?: string;
  }> => {
    try {
      isProcessingRef.current = true;
      await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });

      const activeIap = availablePurchases.find(
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

      // Fallback: re-check subscription status from backend
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
      isProcessingRef.current = false;
    }
  }, [getAvailablePurchases, availablePurchases, refetchUser, setHasPaid]);

  return {
    threeMonthsProduct,
    isLoading: !connected,
    isProcessing: isProcessingRef.current,
    purchaseThreeMonths,
    restorePurchases,
    refreshProducts,
  };
};
