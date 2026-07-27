import logoImage from "@/assets/images/logo.jpeg";
import CustomAlert from "@/components/CustomAlert";
import { useGlobalContext } from "@/utils/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlatformPay, PlatformPay } from "@stripe/stripe-react-native";
import { apiRequest } from "@/utils/api";
import { useAppleIAP } from "@/hooks/useAppleIAP";

interface Plan {
  id: number;
  plan_id: string;
  name: string;
  price: number;
  interval: string;
}

const SubscriptionScreen = () => {
  const { setHasPaid, hasPaid, isVerifying, iapError: globalIapError, clearIapError } = useGlobalContext();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });

  // Stripe hooks safely scoped to Platform check
  const stripe = Platform.OS === 'android' ? usePlatformPay() : { isPlatformPaySupported: async () => false, confirmPlatformPayPayment: async () => ({}) };
  const { isPlatformPaySupported, confirmPlatformPayPayment } = stripe as any;

  // StoreKit hook for iOS
  const {
    product: iapProduct,
    loading: iapLoading,
    error: iapError,
    subscribe: iapSubscribe,
    restore: iapRestore,
  } = useAppleIAP();

  useEffect(() => {
    const fetchPlans = async () => {
      if (Platform.OS === 'ios') {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await apiRequest<{ success: boolean; plans: Plan[] }>("/payment/plans", { auth: true });
        
        if (response.success) {
          setPlans(response.plans);
          if (response.plans.length > 0) {
            setSelectedPlan(response.plans[0].id.toString());
          }
        }
      } catch (e) {
        setAlertConfig({
          title: "Error",
          message: "Failed to load subscription plans.",
          type: "error",
        });
        setAlertVisible(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Handle local & global IAP error notifications
  useEffect(() => {
    if (iapError) {
      setAlertConfig({
        title: "StoreKit Error",
        message: iapError,
        type: "error",
      });
      setAlertVisible(true);
    }
  }, [iapError]);

  useEffect(() => {
    if (globalIapError) {
      setAlertConfig({
        title: "Verification Error",
        message: globalIapError,
        type: "error",
      });
      setAlertVisible(true);
      clearIapError();
    }
  }, [globalIapError, clearIapError]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    if (Platform.OS === 'ios') {
      setIsSubscribing(true);
      try {
        await iapSubscribe();
      } catch (e: any) {
        // Error will be caught by hook or listeners
      } finally {
        setIsSubscribing(false);
      }
      return;
    }

    if (!selectedPlan) {
      setAlertConfig({ title: "No Plan Selected", message: "Please select a subscription plan.", type: "error" });
      setAlertVisible(true);
      return;
    }

    const plan = plans.find(p => p.id.toString() === selectedPlan);
    if (!plan) return;

    setIsSubscribing(true);
    try {
      if (!(await isPlatformPaySupported({ googlePay: { testEnv: true } }))) {
        throw new Error("Google Pay is not supported on this device.");
      }

      // 1. Create PaymentIntent on backend
      const intentResponse = await apiRequest<{ success: boolean; clientSecret: string; customerId: string }>("/payment/create-subscription", {
        method: "POST",
        body: { plan_id: plan.id },
        auth: true,
      });

      if (!intentResponse.success || !intentResponse.clientSecret) {
        throw new Error("Failed to initialize payment.");
      }

      // 2. Confirm with PlatformPay
      const { error, paymentIntent } = await confirmPlatformPayPayment(intentResponse.clientSecret, {
        googlePay: {
          testEnv: true,
          merchantName: "Daily Answer",
          merchantCountryCode: "US",
          currencyCode: "USD",
        },
      });

      if (error) {
        throw new Error(error.message || "Payment was not successful.");
      }

      // 3. Confirm with backend
      const confirmResponse = await apiRequest<{ success: boolean; message: string }>("/payment/confirm", {
        method: "POST",
        body: { payment_intent_id: paymentIntent.id },
        auth: true,
      });

      if (confirmResponse.success) {
        setHasPaid(true);
        setIsSubscribing(false);
        setAlertConfig({
          title: "Payment Successful! 🎉",
          message: "Your subscription is now active. Enjoy full access to all premium features!",
          type: "success",
        });
        setAlertVisible(true);
        setTimeout(() => {
          router.back();
        }, 2000);
      } else {
        throw new Error(confirmResponse.message || "Failed to confirm payment on server.");
      }
    } catch (e: any) {
      setIsSubscribing(false);
      setAlertConfig({
        title: "Subscription Error",
        message: e.message || "An unexpected error occurred.",
        type: "error",
      });
      setAlertVisible(true);
    }
  };

  const features = [
    "Support quality writing",
    "Read devotionals offline in the app",
    "Listen to any devotional",
  ];

  if (hasPaid) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900">
        <StatusBar style="light" />
        <View className="flex-row items-center px-4 py-4 border-b border-slate-800">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 rounded-full bg-slate-800 items-center justify-center"
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-xl font-bold text-white">
            Subscription
          </Text>
          <View className="w-11" />
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="checkmark-circle" size={80} color="#E94B7B" className="mb-6" />
          <Text className="text-white text-2xl font-bold text-center mb-3 mt-6">
            You're All Set!
          </Text>
          <Text className="text-slate-400 text-base text-center mb-8">
            You already have an active subscription and full access to all devotional contents.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-pink-600 w-full py-4 rounded-xl items-center justify-center mt-4"
          >
            <Text className="text-white text-lg font-bold">
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => setAlertVisible(false)}
        />
      </SafeAreaView>
    );
  }

  if (loading || isVerifying) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#E94B7B" />
        <Text className="text-slate-400 mt-4">
          {isVerifying ? "Verifying transaction with server..." : "Loading plans..."}
        </Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar style="light" />
      <View className="flex-row items-center px-4 py-4 border-b border-slate-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-11 h-11 rounded-full bg-slate-800 items-center justify-center"
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-xl font-bold text-white">
          Subscription
        </Text>
        <View className="w-11" />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center px-6 py-8">
          <Image source={logoImage} className="w-24 h-24 rounded-full mb-6"  />
          <Text className="text-white text-2xl font-bold text-center mb-3">
            Get Full Access
          </Text>
          <Text className="text-slate-400 text-base text-center mb-8">
            Subscribe to get full access to all devotional contents on The Daily
            Answer.
          </Text>

          {/* Features */}
          <View className="w-full mb-8">
            {features.map((feature, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <Ionicons name="checkmark-circle" size={24} color="#E94B7B" />
                <Text className="text-slate-300 text-base ml-3">{feature}</Text>
              </View>
            ))}
          </View>

          {/* Plan Selection */}
          <View className="w-full mb-6">
            {Platform.OS === 'ios' ? (
              iapProduct ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  className="border-2 rounded-xl p-4 mb-4 border-pink-500 bg-pink-500/10"
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-white text-lg font-semibold">Daily Answer Premium (Monthly)</Text>
                    <Text className="text-white text-lg font-bold">{iapProduct.displayPrice}</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <Text className="text-slate-400 text-center">Loading subscription from App Store...</Text>
              )
            ) : (
              plans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  onPress={() => handleSelectPlan(plan.id.toString())}
                  className={`border-2 rounded-xl p-4 mb-4 ${
                    selectedPlan === plan.id.toString()
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-slate-700"
                  }`}
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-white text-lg font-semibold">{plan.name}</Text>
                    <Text className="text-white text-lg font-bold">${plan.price.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
            {Platform.OS !== 'ios' && plans.length === 0 && (
              <Text className="text-slate-400 text-center">No subscription plans available.</Text>
            )}
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity
            onPress={handleSubscribe}
            disabled={isSubscribing || iapLoading || loading || (Platform.OS !== 'ios' && plans.length === 0)}
            className="bg-pink-600 w-full py-4 rounded-xl items-center justify-center mb-6 opacity-90 disabled:opacity-50"
          >
            {isSubscribing || iapLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-bold">
                Subscribe
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore Purchases (iOS only) */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              onPress={iapRestore}
              disabled={isSubscribing || iapLoading || isVerifying}
              className="border-2 border-slate-700 w-full py-4 rounded-xl items-center justify-center mb-6 opacity-90 disabled:opacity-50"
            >
              <Text className="text-white text-lg font-bold">
                Restore Purchases
              </Text>
            </TouchableOpacity>
          )}

          {/* Legal */}
          <View className="items-center mb-6">
            <TouchableOpacity onPress={() => Linking.openURL('https://thedailyanswer.com/terms')}>
              <Text className="text-slate-400 underline">Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://thedailyanswer.com/privacy')} className="mt-2">
              <Text className="text-slate-400 underline">Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          {Platform.OS === 'ios' && (
            <Text className="text-slate-500 text-xs text-center mb-4 leading-relaxed">
              Payment will be charged to your Apple ID. The subscription automatically renews unless canceled at least 24 hours before the end of the current billing period. You can manage or cancel your subscription in your Apple account settings.
            </Text>
          )}

          <Text className="text-slate-500 text-xs text-center">
            Your Daily Answer membership will be billed in your local currency. Your payments will be processed securely via {Platform.OS === 'ios' ? 'Apple StoreKit' : 'Stripe'}.
          </Text>
        </View>
      </ScrollView>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

export default SubscriptionScreen;
