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
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as IAP from "expo-iap";
import { initIAPConnection, fetchSubscriptions, requestPurchase, verifyReceiptWithBackend } from "@/libs/iap";

const Subscription = () => {
  const { setHasPaid } = useGlobalContext();
  const [plans, setPlans] = useState<IAP.Subscription[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });

  useEffect(() => {
    let purchaseUpdateSubscription: any = null;
    let purchaseErrorSubscription: any = null;

    const setupIAP = async () => {
      try {
        setLoading(true);
        await initIAPConnection();
        const availablePlans = await fetchSubscriptions();
        
        setPlans(availablePlans);
        if (availablePlans.length > 0) {
          setSelectedPlan(availablePlans[0].productId);
        }

        // Set up listeners for purchases
        purchaseUpdateSubscription = IAP.purchaseUpdatedListener(async (purchase: IAP.ProductPurchase | IAP.SubscriptionPurchase) => {
          const receipt = purchase.transactionReceipt;
          
          if (receipt) {
            try {
              // Send receipt to your Laravel backend for validation
              const verification = await verifyReceiptWithBackend(receipt, purchase.productId);

              if (verification.success) {
                // Tell Apple/Google we've successfully delivered the content
                await IAP.finishTransaction({ purchase, isConsumable: false });
                
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
                throw new Error(verification.message || "Could not verify subscription.");
              }
            } catch (err: any) {
              setIsSubscribing(false);
              setAlertConfig({
                title: "Verification Error",
                message: err.message || "Failed to verify receipt with server.",
                type: "error",
              });
              setAlertVisible(true);
            }
          }
        });

        purchaseErrorSubscription = IAP.purchaseErrorListener((error: IAP.PurchaseError) => {
          setIsSubscribing(false);
          // Don't show an error if the user just cancelled the dialog
          if (error.code !== "E_USER_CANCELLED") {
            setAlertConfig({
              title: "Purchase Error",
              message: error.message,
              type: "error",
            });
            setAlertVisible(true);
          }
        });

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

    setupIAP();

    return () => {
      if (purchaseUpdateSubscription) {
        purchaseUpdateSubscription.remove();
      }
      if (purchaseErrorSubscription) {
        purchaseErrorSubscription.remove();
      }
      IAP.endConnection();
    };
  }, []);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      setAlertConfig({
        title: "No Plan Selected",
        message: "Please select a subscription plan.",
        type: "error",
      });
      setAlertVisible(true);
      return;
    }

    setIsSubscribing(true);
    try {
      await requestPurchase(selectedPlan);
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
                key={plan.productId}
                onPress={() => handleSelectPlan(plan.productId)}
                className={`border-2 rounded-xl p-4 mb-4 ${
                  selectedPlan === plan.productId
                    ? "border-pink-500 bg-pink-500/10"
                    : "border-slate-700"
                }`}
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-white text-lg font-semibold">{plan.title || plan.name}</Text>
                  <Text className="text-white text-lg font-bold">{plan.localizedPrice}</Text>
                </View>
                {plan.description && (
                  <Text className="text-slate-400 text-sm mt-1">{plan.description}</Text>
                )}
              </TouchableOpacity>
            ))}
            {plans.length === 0 && (
              <Text className="text-slate-400 text-center">No subscription plans available.</Text>
            )}
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity
            onPress={handleSubscribe}
            disabled={isSubscribing || loading || plans.length === 0}
            className="bg-pink-600 w-full py-4 rounded-xl items-center justify-center mb-6 opacity-90 disabled:opacity-50"
          >
            {isSubscribing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-bold">
                Subscribe
              </Text>
            )}
          </TouchableOpacity>

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
            Your Daily Answer membership will be billed in your local currency, using exchange rates set by Apple/Play. Your payments will be processed by Apple/Play within 24 hours of the end of the current billing cycle.
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
