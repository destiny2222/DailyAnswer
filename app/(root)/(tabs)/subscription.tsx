import { Ionicons } from "@expo/vector-icons";
import { useStripe } from "@stripe/stripe-react-native";
import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import logoImage from "@/assets/images/logo.jpeg";
import { useGlobalContext } from "@/utils/auth";
import { createSubscription, getSubscriptionPlans, Plan, confirmPayment } from "@/libs/payment";
import Toast from "react-native-toast-message";

const Subscription = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { setHasPaid } = useGlobalContext();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const availablePlans = await getSubscriptionPlans();
        setPlans(availablePlans);
        if (availablePlans.length > 0) {
          // default to yearly_60
          const defaultPlan = availablePlans.find(p => p.id === 'yearly_60') || availablePlans[0];
          setSelectedPlan(defaultPlan.id);
        }
      } catch (e) {
        setError("Failed to load subscription plans.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      Alert.alert("No Plan Selected", "Please select a subscription plan.");
      return;
    }

    setIsSubscribing(true);
    try {
      const { clientSecret, customerId } = await createSubscription(selectedPlan);

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "The Daily Answer",
        customerId: customerId,
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
      });

      if (initError) {
        Alert.alert("Error", "Failed to initialize payment sheet.");
        setIsSubscribing(false);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert("Payment Error", presentError.message);
        }
      } else {
        // Extract paymentIntentId from clientSecret
        const paymentIntentId = clientSecret.split('_secret')[0];
        
        // Confirm payment on the backend
        const confirmation = await confirmPayment(paymentIntentId);

        if (confirmation.success) {
          setHasPaid(true);
          Toast.show({
            type: 'success',
            text1: 'Subscription Successful!',
            text2: 'Welcome to premium access.',
          });
          router.replace('/(root)/(tabs)');
        } else {
          Alert.alert("Confirmation Failed", confirmation.message || "Could not activate your subscription.");
        }
      }
    } catch (e: any) {
      Alert.alert("Subscription Error", e.message || "An unexpected error occurred.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    setError(null);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setError("No subscription products found. Verify product IDs in your developer console.");
    setIsRestoring(false);
  };

  const features = [
    "Support quality writing",
    "Read devotionals offline in the app",
    "Listen to any devotional",
  ];

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
      <Stack.Screen options={{ 
        headerTitle: 'Subscription',
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: '#1E293B' },
        headerTintColor: '#fff',
        headerTitleStyle: { color: '#fff' },
       }} />
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
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                onPress={() => handleSelectPlan(plan.id)}
                className={`border-2 rounded-xl p-4 mb-4 ${
                  selectedPlan === plan.id
                    ? "border-pink-500 bg-pink-500/10"
                    : "border-slate-700"
                }`}
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-white text-lg font-semibold">{plan.name}</Text>
                  <Text className="text-white text-lg font-bold">${plan.price.toFixed(2)}</Text>
                </View>
                {plan.id === 'yearly_60' && (
                  <Text className="text-pink-500 text-sm font-semibold mt-1">
                    Save 25%
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity
            onPress={handleSubscribe}
            disabled={isSubscribing || loading}
            className="bg-pink-600 w-full py-4 rounded-xl items-center justify-center mb-6"
          >
            {isSubscribing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-bold">
                Subscribe
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore Purchases */}
          <View className="w-full bg-slate-800 rounded-xl p-4 items-center mb-6">
            <TouchableOpacity
              onPress={handleRestorePurchases}
              disabled={isRestoring}
            >
              <Text className="text-pink-500 text-base font-semibold">
                Restore Purchases
              </Text>
            </TouchableOpacity>
            {isRestoring && (
              <ActivityIndicator color="#E94B7B" style={{ marginTop: 12 }} />
            )}
            {error && (
              <View className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mt-4 w-full">
                <Text className="text-red-400 text-center">{error}</Text>
                <TouchableOpacity
                  onPress={handleRestorePurchases}
                  className="bg-red-500/20 rounded-md py-2 mt-3"
                >
                  <Text className="text-white text-center font-semibold">Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Legal */}
          <View className="items-center mb-6">
            <TouchableOpacity onPress={() => Linking.openURL('#')}>
              <Text className="text-slate-400 underline">Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('#')} className="mt-2">
              <Text className="text-slate-400 underline">Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-slate-500 text-xs text-center">
            By clicking "Subscribe", you agree to our Membership Terms of Service. Your payment method will, based on your selection, be charged on a recurring basis $15.00 (monthly), $60.00 or $180.00 (yearly) (prices are subject to change).
            {"\n\n"}
            Your Daily Answer membership will be billed in your local currency, using exchange rates set by Apple/Play. Your payments will be processed by Apple/Play within 24 hours of the end of the current billing cycle.
          </Text>
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

export default Subscription;