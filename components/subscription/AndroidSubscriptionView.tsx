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
import { useStripeSubscription } from "@/hooks/useStripeSubscription";
import { Plan } from "@/libs/payment";

interface AndroidSubscriptionViewProps {
  onBack: () => void;
  onSuccess: () => void;
  isTab?: boolean;
}

export const AndroidSubscriptionView: React.FC<AndroidSubscriptionViewProps> = ({
  onBack,
  onSuccess,
  isTab = false,
}) => {
  const {
    plans,
    selectedPlan,
    setSelectedPlan,
    isLoading,
    plansError,
    isProcessing,
    subscribe,
    refreshPlans,
  } = useStripeSubscription();

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });

  const handleSubscribe = async () => {
    if (isProcessing || !selectedPlan) return;

    try {
      const result = await subscribe(selectedPlan.serverId || selectedPlan.id);

      if (result.success) {
        setAlertConfig({
          title: "Payment Successful! 🎉",
          message: "Welcome to Daily Answer Premium! Full access to all devotional content is unlocked.",
          type: "success",
        });
        setAlertVisible(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else if (!result.cancelled && result.error) {
        setAlertConfig({
          title: "Payment Error",
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
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar style="light" />
      <View className="flex-row items-center px-4 py-4 border-b border-slate-800">
        <TouchableOpacity
          onPress={onBack}
          disabled={isProcessing}
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
            {isLoading ? (
              <View className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 items-center justify-center">
                <ActivityIndicator size="small" color="#E94B7B" />
                <Text className="text-slate-400 text-sm mt-3 font-medium">Loading subscription plans...</Text>
              </View>
            ) : plansError ? (
              <View className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 items-center">
                <Text className="text-slate-300 text-center">{plansError}</Text>
                <TouchableOpacity
                  onPress={refreshPlans}
                  className="bg-pink-600 px-6 py-3 rounded-xl items-center mt-4"
                >
                  <Text className="text-white font-bold">Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : plans.length > 1 ? (
              // Multiple Plans Selector
              <View className="w-full">
                {plans.map((plan: Plan) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  const formattedPrice = `$${plan.price.toFixed(2)}`;
                  const duration =
                    plan.interval_count && plan.interval_count > 1
                      ? `${plan.interval_count} ${plan.interval}s`
                      : plan.interval;

                  return (
                    <TouchableOpacity
                      key={plan.id}
                      onPress={() => setSelectedPlan(plan)}
                      activeOpacity={0.8}
                      className={`border-2 rounded-2xl p-5 mb-4 relative overflow-hidden ${
                        isSelected
                          ? "bg-slate-800 border-pink-500"
                          : "bg-slate-800/80 border-slate-700"
                      }`}
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1 mr-3">
                          <View className="flex-row items-center">
                            <Text className="text-white text-xl font-bold">{plan.name}</Text>
                            {plan.id.toLowerCase().includes("quarter") && (
                              <View className="ml-2 bg-pink-600 px-2 py-0.5 rounded-full">
                                <Text className="text-white text-[10px] font-bold uppercase">Popular</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-slate-400 text-sm mt-1">Full access for {duration}</Text>
                        </View>
                        <Text className="text-pink-400 text-xl font-bold">
                          {formattedPrice}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  onPress={handleSubscribe}
                  disabled={isProcessing || !selectedPlan}
                  className="bg-pink-600 w-full py-4 rounded-xl items-center justify-center mt-2 active:bg-pink-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-base font-bold">Subscribe Now</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : selectedPlan ? (
              // Single Plan Card (Quarterly)
              <View className="bg-slate-800 border-2 border-pink-500/50 rounded-2xl p-5 relative overflow-hidden">
                <View className="absolute top-0 right-0 bg-pink-600 px-3 py-1 rounded-bl-xl">
                  <Text className="text-white text-xs font-bold uppercase tracking-wider">Recommended Plan</Text>
                </View>

                <View className="flex-row justify-between items-center mb-3 mt-1">
                  <View>
                    <Text className="text-white text-xl font-bold">{selectedPlan?.name || "Quarterly"}</Text>
                    <Text className="text-slate-400 text-sm mt-1">Full 3-month access</Text>
                  </View>
                  <Text className="text-pink-400 text-xl font-bold">
                    ${selectedPlan?.price?.toFixed(2) || "9.99"} / 3 months
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleSubscribe}
                  disabled={isProcessing || !selectedPlan}
                  className="bg-pink-600 w-full py-3.5 rounded-xl items-center justify-center mt-2 active:bg-pink-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-base font-bold">Subscribe Now</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <Text className="text-slate-500 text-xs text-center leading-relaxed">
            Subscriptions auto-renew unless cancelled at least 24 hours before the current period ends. You can manage or cancel your subscription anytime in your account.
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

