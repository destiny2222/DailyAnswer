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
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import logoImage from "@/assets/images/logo.jpeg";
import CustomAlert from "@/components/CustomAlert";
import { useAppleIap } from "@/hooks/useAppleIap";

interface IosSubscriptionViewProps {
  onBack: () => void;
  onSuccess: () => void;
  isTab?: boolean;
}

export const IosSubscriptionView: React.FC<IosSubscriptionViewProps> = ({
  onBack,
  onSuccess,
  isTab = false,
}) => {
  const {
    threeMonthsProduct,
    isLoading,
    isProcessing,
    purchaseThreeMonths,
    restorePurchases,
  } = useAppleIap();

  const [purchasingPlan, setPurchasingPlan] = useState<"threemonths" | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });

  const handlePurchaseThreeMonths = async () => {
    if (purchasingPlan || isRestoring || isProcessing) return;
    setPurchasingPlan("threemonths");

    try {
      const result = await purchaseThreeMonths();

      if (result.success) {
        setAlertConfig({
          title: "Subscription Active! 🎉",
          message: "Welcome to Daily Answer Premium! Full access to all devotional content is unlocked.",
          type: "success",
        });
        setAlertVisible(true);
        setTimeout(() => {
          onSuccess();
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
          onSuccess();
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

  const isBusy = purchasingPlan !== null || isRestoring || isProcessing;

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar style="light" />
      <View className="flex-row items-center px-4 py-4 border-b border-slate-800">
        <TouchableOpacity
          onPress={onBack}
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

      <ScrollView contentContainerStyle={{ paddingBottom: isTab ? 100 : 40 }}>
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
          <View className="w-full mb-6">
            {/* Quarterly Card */}
            <View className="bg-slate-800 border-2 border-pink-500/50 rounded-2xl p-5 relative overflow-hidden">
              <View className="absolute top-0 right-0 bg-pink-600 px-3 py-1 rounded-bl-xl">
                <Text className="text-white text-xs font-bold uppercase tracking-wider">Recommended Plan</Text>
              </View>

              {isLoading ? (
                <View className="py-8 items-center justify-center">
                  <ActivityIndicator size="small" color="#E94B7B" />
                  <Text className="text-slate-400 text-sm mt-3 font-medium">Loading subscription details...</Text>
                </View>
              ) : (
                <>
                  <View className="flex-column  justify-between items-center mb-3 mt-5">
                    <View>
                      <Text className="text-white text-xl text-center font-bold">Quarterly</Text>
                      <Text className="text-slate-400 text-center text-sm mt-1">Full {threeMonthsProduct?.displayName ?? "Quarterly"} Access</Text>
                    </View>
                    <Text className="text-pink-400 text-xl font-bold">
                      {threeMonthsProduct?.displayPrice ?? "—"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handlePurchaseThreeMonths}
                    disabled={isBusy || !threeMonthsProduct}
                    className="bg-pink-600 w-full py-3.5 rounded-xl items-center justify-center mt-2 active:bg-pink-700 disabled:opacity-50"
                  >
                    {purchasingPlan === "threemonths" ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white text-base font-bold">Subscribe Now</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Restore Purchases Button */}
          <TouchableOpacity
            onPress={handleRestore}
            disabled={isBusy || isLoading || !threeMonthsProduct}
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

