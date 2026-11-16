import { useCallback, useEffect, useState } from "react";
import { useStripe } from "@stripe/stripe-react-native";
import {
  confirmPayment,
  createSubscription,
  getSubscriptionPlans,
  Plan,
} from "@/libs/payment";
import { useGlobalContext } from "@/utils/auth";

export interface StripeSubscriptionState {
  plans: Plan[];
  selectedPlan: Plan | null;
  setSelectedPlan: (plan: Plan | null) => void;
  isLoading: boolean;
  plansError: string | null;
  isProcessing: boolean;
  subscribe: (targetPlanId?: string) => Promise<{
    success: boolean;
    cancelled?: boolean;
    error?: string;
  }>;
  refreshPlans: () => Promise<void>;
}

export const useStripeSubscription = (): StripeSubscriptionState => {
  const { setHasPaid, refetchUser, user } = useGlobalContext();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setPlansError(null);
    try {
      const availablePlans: unknown = await getSubscriptionPlans();
      const normalizedPlans: Plan[] = Array.isArray(availablePlans)
        ? availablePlans.flatMap((rawPlan: unknown): Plan[] => {
            if (typeof rawPlan !== "object" || rawPlan === null) return [];
            const plan = rawPlan as Record<string, unknown>;

            // `plan_id` is the public plan identifier, `id` is the database row id.
            // The API creates subscriptions from the row id, so keep both around.
            const planId =
              (typeof plan.plan_id === "string" && plan.plan_id.trim()) ||
              (typeof plan.id === "string" && plan.id.trim()) ||
              (typeof plan.id === "number" ? String(plan.id) : "");
            if (!planId) return [];

            const serverId =
              typeof plan.id === "number"
                ? String(plan.id)
                : typeof plan.id === "string" && /^\d+$/.test(plan.id.trim())
                  ? plan.id.trim()
                  : undefined;

            const rawInterval =
              typeof plan.interval === "string" ? plan.interval : "month";
            const interval = rawInterval.toLowerCase();
            const rawIntervalCount =
              plan.interval_count ?? plan.interval_count_months;
            let intervalCount =
              typeof rawIntervalCount === "number" &&
              Number.isFinite(rawIntervalCount) &&
              rawIntervalCount > 0
                ? rawIntervalCount
                : 1;

            if (
              typeof rawIntervalCount !== "number" ||
              !Number.isFinite(rawIntervalCount) ||
              rawIntervalCount <= 0
            ) {
              if (interval.includes("quarter") || interval.includes("3")) {
                intervalCount = 3;
              } else if (
                interval.includes("year") ||
                interval.includes("annual")
              ) {
                intervalCount = 12;
              } else if (interval.includes("semi") || interval.includes("6")) {
                intervalCount = 6;
              }
            }

            const price =
              typeof plan.price === "number"
                ? plan.price
                : typeof plan.price === "string"
                  ? Number.parseFloat(plan.price)
                  : 0;
            const currency =
              typeof plan.currency === "string" ? plan.currency : "USD";

            return [
              {
                id: planId,
                serverId,
                name:
                  typeof plan.name === "string" ? plan.name : "Premium Plan",
                price: Number.isFinite(price) ? price : 0,
                currency: currency.toUpperCase(),
                interval: (interval.startsWith("year")
                  ? "year"
                  : "month") as "month" | "year",
                interval_count: intervalCount,
                features: Array.isArray(plan.features)
                  ? plan.features.filter(
                      (feature): feature is string =>
                        typeof feature === "string",
                    )
                  : [],
              },
            ];
          })
        : [];

      setPlans(normalizedPlans);

      if (normalizedPlans.length > 0) {
        // Default to quarterly plan if available, otherwise first plan
        const defaultPlan =
          normalizedPlans.find(
            (p) =>
              p.id?.toLowerCase().includes("quarter") ||
              p.name?.toLowerCase().includes("quarter") ||
              p.interval_count === 3
          ) || normalizedPlans[0];

        setSelectedPlan(defaultPlan);
      } else {
        setSelectedPlan(null);
        setPlansError(
          "Subscription plans are unavailable. Please try again later.",
        );
      }
    } catch (e: unknown) {
      console.warn("[Stripe] Failed to fetch subscription plans:", e);
      setPlans([]);
      setSelectedPlan(null);
      setPlansError(
        e instanceof Error
          ? e.message
          : "Unable to load subscription plans. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const subscribe = useCallback(
    async (targetPlanId?: string) => {
      const planId =
        targetPlanId ||
        selectedPlan?.serverId ||
        selectedPlan?.id;
      if (!planId) {
        return {
          success: false,
          error: "No subscription plan selected.",
        };
      }

      setIsProcessing(true);
      try {
        const { clientSecret, customerId } = await createSubscription(planId);

        if (!clientSecret) {
          throw new Error("Failed to initialize subscription session.");
        }

        const { error: initError } = await initPaymentSheet({
          merchantDisplayName: "The Daily Answer",
          customerId,
          paymentIntentClientSecret: clientSecret,
          allowsDelayedPaymentMethods: false,
          defaultBillingDetails: user?.name
            ? {
                name: user.name,
                email: user.email || undefined,
              }
            : undefined,
        });

        if (initError) {
          return {
            success: false,
            error: initError.message || "Failed to initialize payment sheet.",
          };
        }

        const { error: presentError } = await presentPaymentSheet();

        if (presentError) {
          const isCancelled =
            presentError.code === "Canceled" ||
            presentError.message?.toLowerCase().includes("cancel");

          return {
            success: false,
            cancelled: isCancelled,
            error: isCancelled ? undefined : presentError.message,
          };
        }

        // Extract paymentIntentId from clientSecret (format: pi_123_secret_456)
        const paymentIntentId = clientSecret.split("_secret")[0];
        const confirmation = await confirmPayment(paymentIntentId);

        if (confirmation.success) {
          setHasPaid(true);
          await refetchUser();
          return { success: true };
        } else {
          return {
            success: false,
            error: confirmation.message || "Could not confirm subscription with server.",
          };
        }
      } catch (e: any) {
        return {
          success: false,
          error: e?.message || "An unexpected error occurred during subscription.",
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedPlan, initPaymentSheet, presentPaymentSheet, setHasPaid, refetchUser, user]
  );

  return {
    plans,
    selectedPlan,
    setSelectedPlan,
    isLoading,
    plansError,
    isProcessing,
    subscribe,
    refreshPlans: fetchPlans,
  };
};

