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

export interface CreateSubscriptionResponse {
  success: boolean;
  clientSecret: string;
  customerId: string;
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
    // console.error("Error creating payment intent:", error);
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
    // console.error("Error confirming payment:", error);
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
