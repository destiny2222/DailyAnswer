import { apiRequest } from "../utils/api";

export interface PaymentIntentResponse {
  clientSecret: string;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    has_paid: boolean;
    payment_status: string;
    payment_date: string;
    payment_expires_at: string;
    type?: string;
    amount?: number;
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  data: {
    has_paid: boolean;
    payment_status: string;
    payment_date: string;
    payment_expires_at: string;
    is_expired: boolean;
    subscription_plan?: string;
  };
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  interval_count: number;
  features: string[];
}

export interface PlansResponse {
  success: boolean;
  plans: Plan[];
}


export interface RecurringSupportPlan {
  id: string;
  subscriptionId: string;
  amount: number;
  interval: "monthly" | "yearly";
  nextPaymentDate: string;
  status: string;
}

export interface RecurringSupportPlansResponse {
  success: boolean;
  plans: RecurringSupportPlan[];
}

export interface CreateSubscriptionResponse {
  success: boolean;
  clientSecret: string;
  customerId: string;
}

export interface CreateSupportResponse {
  success: boolean;
  clientSecret: string;
  customerId: string;
  subscriptionId?: string;
  priceId?: string;
  setupIntentId?: string;
  type: 'one_time' | 'recurring';
}

export interface ConfirmRecurringSupportResponse {
  success: boolean;
  subscriptionId: string;
  message: string;
}

export interface CancelSupportResponse {
  success: boolean;
  message: string;
}

/**
 * Get available subscription plans.
 */
export async function getSubscriptionPlans(): Promise<Plan[]> {
  try {
    const response = await apiRequest<PlansResponse>("/payment/plans", {
      method: "GET",
      auth: true,
    });
    return response.plans || [];
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    throw error;
  }
}
/**
 * Get available support plans.
 */
export async function getSupportPlans(): Promise<RecurringSupportPlan[]> {
  try {
    const response = await apiRequest<RecurringSupportPlansResponse>("/payment/recurring-support-plans", {
      method: "GET",
      auth: true,
    });
    return response.plans || [];
  } catch (error) {
    console.error("Error fetching support plans:", error);
    throw error;
  }
}

/**
 * Create a subscription payment intent.
 */
export async function createSubscription(
  planId: string,
): Promise<CreateSubscriptionResponse> {
  try {
    const response = await apiRequest<CreateSubscriptionResponse>(
      "/payment/create-subscription",
      {
        method: "POST",
        body: { plan_id: planId },
        auth: true,
      },
    );
    return response;
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}

/**
 * Create a support payment (one-time or recurring).
 */
export async function createSupport(
  amount: number,
  isRecurring: boolean,
  interval?: 'monthly' | 'yearly'
): Promise<CreateSupportResponse> {
  try {
    const response = await apiRequest<CreateSupportResponse>(
      "/payment/create-support",
      {
        method: "POST",
        body: {
          amount,
          is_recurring: isRecurring,
          interval: isRecurring ? interval : null,
        },
        auth: true,
      },
    );
    return response;
  } catch (error) {
    console.error("Error creating support payment:", error);
    throw error;
  }
}

/**
 * Confirm recurring support subscription after payment method is collected.
 */
export async function confirmRecurringSupport(
  setupIntentId: string,
  priceId: string
): Promise<ConfirmRecurringSupportResponse> {
  try {
    const response = await apiRequest<ConfirmRecurringSupportResponse>(
      "/payment/confirm-recurring-support",
      {
        method: "POST",
        body: {
          setup_intent_id: setupIntentId,
          price_id: priceId,
        },
        auth: true,
      },
    );
    return response;
  } catch (error) {
    console.error("Error confirming recurring support:", error);
    throw error;
  }
}

/**
 * Cancel a recurring support subscription.
 */
export async function cancelRecurringSupport(
  subscriptionId: string
): Promise<CancelSupportResponse> {
  try {
    const response = await apiRequest<CancelSupportResponse>(
      "/payment/cancel-recurring-support",
      {
        method: "POST",
        body: { subscription_id: subscriptionId },
        auth: true,
      },
    );
    return response;
  } catch (error) {
    console.error("Error cancelling recurring support:", error);
    throw error;
  }
}

/**
 * Create a payment intent
 */
export async function createPaymentIntent(): Promise<string> {
  try {
    const response = await apiRequest<PaymentIntentResponse>(
      "/payment/create-intent",
      { method: "POST", auth: true },
    );
    return response.clientSecret;
  } catch (error) {
    throw error;
  }
}

/**
 * Confirm payment with payment intent ID
 */
export async function confirmPayment(
  paymentIntentId: string,
): Promise<ConfirmPaymentResponse> {
  try {
    const response = await apiRequest<ConfirmPaymentResponse>(
      "/payment/confirm",
      {
        method: "POST",
        body: { payment_intent_id: paymentIntentId },
        auth: true,
      },
    );
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(): Promise<PaymentStatusResponse> {
  try {
    const response = await apiRequest<PaymentStatusResponse>(
      "/payment/status",
      { method: "GET", auth: true },
    );
    return response;
  } catch (error) {
    throw error;
  }
}