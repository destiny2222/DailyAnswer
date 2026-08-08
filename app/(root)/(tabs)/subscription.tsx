import logoImage from "@/assets/images/logo.jpeg";
import CustomAlert from "@/components/CustomAlert";
import { useAppleIap } from "@/hooks/useAppleIap";
import { useGlobalContext } from "@/utils/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SubscriptionTab = () => {
  const { hasPaid } = useGlobalContext();
  const {
    monthlyProduct,
    yearlyProduct,
    isLoading: isIapLoading,
    isProcessing,
    purchaseMonthly,
    purchaseYearly,
    restorePurchases,
  } = useAppleIap();

  const [purchasingPlan, setPurchasingPlan] = useState<"monthly" | "yearly" | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });

  const handlePurchaseMonthly = async () => {
    if (purchasingPlan || isRestoring || isProcessing) return;
    setPurchasingPlan("monthly");

    try {
      const result = await purchaseMonthly();

      if (result.success) {
        setAlertConfig({
          title: "Subscription Active! 🎉",
          message: "Welcome to Daily Answer Premium! Full access to all devotional content is unlocked.",
          type: "success",
        });
        setAlertVisible(true);
        setTimeout(() => {
          router.replace("/(root)/(tabs)");
        }, 2000);
      } else if (!result.cancelled && result.error) {
        setAlertConfig({
          title: "Subscription Error",
          message: result.error,
          type: "error",
        });
        setAlertVisible(true);
      }
    } catch (e: any) {
      setAlertConfig({
        title: "Subscription Error",
        message: e?.message || "An unexpected error occurred. Please try again.",
        type: "error",
      });
      setAlertVisible(true);
    } finally {
      setPurchasingPlan(null);
    }
  };

  const handlePurchaseYearly = async () => {
    if (purchasingPlan || isRestoring || isProcessing) return;
    setPurchasingPlan("yearly");

    try {
      const result = await purchaseYearly();

      if (result.success) {
        setAlertConfig({
          title: "Subscription Active! 🎉",
          message: "Welcome to Daily Answer Premium! Full access to all devotional content is unlocked.",
          type: "success",
        });
        setAlertVisible(true);
        setTimeout(() => {
          router.replace("/(root)/(tabs)");
        }, 2000);
      } else if (!result.cancelled && result.error) {
        setAlertConfig({
          title: "Subscription Error",
          message: result.error,
          type: "error",
        });
        setAlertVisible(true);
      }
    } catch (e: any) {
      setAlertConfig({
        title: "Subscription Error",
        message: e?.message || "An unexpected error occurred. Please try again.",
        type: "error",
      });
      setAlertVisible(true);
    } finally {
      setPurchasingPlan(null);
    }
  };

  const handleRestore = async () => {
    if (purchasingPlan || isRestoring || isProcessing) return;
    setIsRestoring(true);

    try {
      const result = await restorePurchases();

      if (result.success && result.restored) {
        setAlertConfig({
          title: "Purchases Restored",
          message: "Your active Daily Answer Premium subscription has been successfully restored.",
          type: "success",
        });
        setAlertVisible(true);
        setTimeout(() => {
          router.replace("/(root)/(tabs)");
        }, 2000);
      } else if (result.success && !result.restored) {
        setAlertConfig({
          title: "No Active Subscription",
          message: "No active premium subscription was found for this Apple ID account.",
          type: "error",
        });
        setAlertVisible(true);
      } else if (result.error) {
        setAlertConfig({
          title: "Restore Failed",
          message: result.error,
          type: "error",
        });
        setAlertVisible(true);
      }
    } catch (e: any) {
      setAlertConfig({
        title: "Restore Failed",
        message: e?.message || "Unable to restore purchases at this time.",
        type: "error",
      });
      setAlertVisible(true);
    } finally {
      setIsRestoring(false);
    }
  };

  const monthlyPriceString = monthlyProduct?.displayPrice || "$4.99";
  const yearlyPriceString = yearlyProduct?.displayPrice || "$29.99";

  const isBusy = purchasingPlan !== null || isRestoring || isProcessing;

  if (hasPaid) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900">
        <StatusBar style="light" />
        <View className="flex-row items-center px-4 py-4 border-b border-slate-800">
          <TouchableOpacity
            onPress={() => router.replace("/profile")}
            className="w-11 h-11 rounded-full bg-slate-800 items-center justify-center"
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-xl font-bold text-white">
            Daily Answer Premium
          </Text>
          <View className="w-11" />
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="checkmark-circle" size={80} color="#E94B7B" className="mb-6" />
          <Text className="text-white text-2xl font-bold text-center mb-3 mt-6">
            You're All Set!
          </Text>
          <Text className="text-slate-400 text-base text-center mb-8">
            You already have an active subscription and full access to all premium devotional content.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/(root)/(tabs)")}
            className="bg-pink-600 w-full py-4 rounded-xl items-center justify-center mt-4"
          >
            <Text className="text-white text-lg font-bold">Go to Home</Text>
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

  if (isIapLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#E94B7B" />
        <Text className="text-slate-400 mt-4">Connecting to App Store...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar style="light" />
      <View className="flex-row items-center px-4 py-4 border-b border-slate-800">
        <TouchableOpacity
          onPress={() => router.replace("/profile")}
          disabled={isBusy}
          className="w-11 h-11 rounded-full bg-slate-800 items-center justify-center opacity-90 disabled:opacity-50"
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-xl font-bold text-white">
          Daily Answer Premium
        </Text>
        <View className="w-11" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center px-6 py-8">
          <Image source={logoImage} className="w-24 h-24 rounded-full mb-6" />
          <Text className="text-white text-3xl font-bold text-center mb-2">
            Daily Answer Premium
          </Text>
          <Text className="text-pink-400 text-lg font-semibold text-center mb-6">
            Premium devotional content
          </Text>

          {/* Features */}
          <View className="w-full mb-8 bg-slate-800/60 p-5 rounded-2xl border border-slate-800">
            <View className="flex-row items-center mb-3">
              <Ionicons name="checkmark-circle" size={22} color="#E94B7B" />
              <Text className="text-slate-200 text-base ml-3 font-medium">Unlimited premium daily devotionals</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Ionicons name="checkmark-circle" size={22} color="#E94B7B" />
              <Text className="text-slate-200 text-base ml-3 font-medium">Offline reading in the app</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Ionicons name="checkmark-circle" size={22} color="#E94B7B" />
              <Text className="text-slate-200 text-base ml-3 font-medium">Listen to any devotional audio</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={22} color="#E94B7B" />
              <Text className="text-slate-200 text-base ml-3 font-medium">Exclusive prayer and memory tools</Text>
            </View>
          </View>

          {/* Subscription Plans */}
          <View className="w-full mb-6 gap-4">
            {/* Monthly Card */}
            <View className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-5">
              <View className="flex-row justify-between items-center mb-3">
                <View>
                  <Text className="text-white text-xl font-bold">Monthly</Text>
                  <Text className="text-slate-400 text-sm mt-1">Full monthly access</Text>
                </View>
                <Text className="text-pink-400 text-xl font-bold">
                  {monthlyPriceString} / month
                </Text>
              </View>
              <TouchableOpacity
                onPress={handlePurchaseMonthly}
                disabled={isBusy}
                className="bg-pink-600 w-full py-3.5 rounded-xl items-center justify-center mt-2 active:bg-pink-700 disabled:opacity-50"
              >
                {purchasingPlan === "monthly" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base font-bold">Subscribe Monthly</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Yearly Card */}
            <View className="bg-slate-800 border-2 border-pink-500/50 rounded-2xl p-5 relative overflow-hidden">
              <View className="absolute top-0 right-0 bg-pink-600 px-3 py-1 rounded-bl-xl">
                <Text className="text-white text-xs font-bold uppercase tracking-wider">Best Value</Text>
              </View>
              <View className="flex-row justify-between items-center mb-3 mt-1">
                <View>
                  <Text className="text-white text-xl font-bold">Yearly</Text>
                  <Text className="text-slate-400 text-sm mt-1">12 months access</Text>
                </View>
                <Text className="text-pink-400 text-xl font-bold">
                  {yearlyPriceString} / year
                </Text>
              </View>
              <TouchableOpacity
                onPress={handlePurchaseYearly}
                disabled={isBusy}
                className="bg-pink-600 w-full py-3.5 rounded-xl items-center justify-center mt-2 active:bg-pink-700 disabled:opacity-50"
              >
                {purchasingPlan === "yearly" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base font-bold">Subscribe Yearly</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Restore Purchases Button */}
          <TouchableOpacity
            onPress={handleRestore}
            disabled={isBusy}
            className="w-full py-3.5 rounded-xl border border-slate-700 bg-slate-800/80 items-center justify-center mb-6 active:bg-slate-800 disabled:opacity-50"
          >
            {isRestoring ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-slate-300 text-base font-semibold">Restore Purchases</Text>
            )}
          </TouchableOpacity>

          <Text className="text-slate-500 text-xs text-center leading-relaxed">
            Subscriptions auto-renew unless cancelled at least 24 hours before the current period ends. Manage your subscriptions anytime in your Apple ID Account Settings.
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

export default SubscriptionTab;
