import logoImage from "@/assets/images/logo.jpeg";
import CustomAlert from "@/components/CustomAlert";
import { apiRequest } from "@/utils/api";
import { getUserProfile, useGlobalContext } from "@/utils/auth";
import { Ionicons } from "@expo/vector-icons";
import { PlatformPay, usePlatformPay } from "@stripe/stripe-react-native";
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

interface Plan {
  id: number;
  plan_id: string;
  name: string;
  price: number;
  interval: string;
}

const Subscription = () => {
  const { setHasPaid, hasPaid } = useGlobalContext();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isRestoringAccess, setIsRestoringAccess] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });

  const {isPlatformPaySupported, confirmPlatformPayPayment} = usePlatformPay();

  useEffect(() => {
    if (Platform.OS === "ios") {
      // Subscription management not available on iOS per App Store guidelines
      router.replace("/(root)/(tabs)");
    }
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      if (Platform.OS === "ios") {
        setPlans([]);
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
      } catch {
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

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleRestoreAccess = async () => {
    if (Platform.OS !== "ios") {
      return;
    }

    setIsRestoringAccess(true);
    try {
      const profile = await getUserProfile();

      if (profile?.has_paid) {
        setHasPaid(true);
        setAlertConfig({
          title: "Access Restored",
          message: "Your subscription is active.",
          type: "success",
        });
        setAlertVisible(true);
        router.replace('/(root)/(tabs)');
        return;
      }

      setAlertConfig({
        title: "Sign In Required",
        message: "Sign in with the account used for your subscription to restore access.",
        type: "error",
      });
      setAlertVisible(true);
      router.push("/(auth)/login");
    } catch (error: any) {
      setAlertConfig({
        title: "Restore Failed",
        message: error?.message || "Unable to check your subscription right now.",
        type: "error",
      });
      setAlertVisible(true);
    } finally {
      setIsRestoringAccess(false);
    }
  };

  const handleSubscribe = async () => {
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
        throw new Error("Apple Pay / Google Pay is not supported on this device.");
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
        applePay: {
          cartItems: [
            {
              label: plan.name,
              amount: plan.price.toString(),
              paymentType: PlatformPay.PaymentType.Immediate,
            },
          ],
          merchantCountryCode: "US",
          currencyCode: "USD",
        },
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

      if (!paymentIntent?.id) {
        throw new Error("Payment was not successful.");
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
          router.replace('/(root)/(tabs)');
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
            onPress={() => router.replace('/profile')}
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
            onPress={() => router.replace('/(root)/(tabs)')}
            className="bg-pink-600 w-full py-4 rounded-xl items-center justify-center mt-4"
          >
            <Text className="text-white text-lg font-bold">
              Go to Home
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#E94B7B" />
        <Text className="text-slate-400 mt-4">Loading plans...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar style="light" />
      <View className="flex-row items-center px-4 py-4 border-b border-slate-800">
        <TouchableOpacity
          onPress={() => router.replace('/profile')}
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
            {Platform.OS === "ios"
              ? "Sign in with the account you used before to restore your subscription access."
              : "Subscribe to get full access to all devotional contents on The Daily Answer."}
          </Text>

          {Platform.OS === "ios" ? (
            <View className="w-full mb-8">
              <View className="flex-row items-center mb-3">
                <Ionicons name="checkmark-circle" size={24} color="#E94B7B" />
                <Text className="text-slate-300 text-base ml-3">Sign in to your account</Text>
              </View>
              <View className="flex-row items-center mb-3">
                <Ionicons name="checkmark-circle" size={24} color="#E94B7B" />
                <Text className="text-slate-300 text-base ml-3">Restore your active access</Text>
              </View>
              <View className="flex-row items-center mb-3">
                <Ionicons name="checkmark-circle" size={24} color="#E94B7B" />
                <Text className="text-slate-300 text-base ml-3">Continue reading in the app</Text>
              </View>
            </View>
          ) : (
            <>
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
                {plans.map((plan) => (
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
                ))}
                {plans.length === 0 && (
                  <Text className="text-slate-400 text-center">No subscription plans available.</Text>
                )}
              </View>
            </>
          )}

          <TouchableOpacity
            onPress={Platform.OS === "ios" ? handleRestoreAccess : handleSubscribe}
            disabled={Platform.OS === "ios" ? isRestoringAccess : isSubscribing || loading || plans.length === 0}
            className="bg-pink-600 w-full py-4 rounded-xl items-center justify-center mb-6 opacity-90 disabled:opacity-50"
          >
            {Platform.OS === "ios" ? (
              isRestoringAccess ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-bold">
                  Sign In / Restore Access
                </Text>
              )
            ) : isSubscribing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-bold">
                Subscribe
              </Text>
            )}
          </TouchableOpacity>

          {/* Legal */}
          {Platform.OS !== "ios" && (
            <View className="items-center mb-6">
              <TouchableOpacity onPress={() => Linking.openURL('#')}>
                <Text className="text-slate-400 underline">Terms of Service</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('#')} className="mt-2">
                <Text className="text-slate-400 underline">Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text className="text-slate-500 text-xs text-center">
            {Platform.OS === "ios"
              ? "On iOS, this screen is for restoring access after sign in."
              : "Your Daily Answer membership will be billed in your local currency. Your payments will be processed securely via Stripe."}
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

export default Subscription;
