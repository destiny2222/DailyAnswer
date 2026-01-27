import { Ionicons } from "@expo/vector-icons";
import { useStripe } from "@stripe/stripe-react-native";
import { Stack, router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import logoImage from "@/assets/images/logo.jpeg";
import CustomAlert from "@/components/CustomAlert";
import { createSupport, confirmPayment, confirmRecurringSupport } from "@/libs/payment";

const Support = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [amount, setAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });

  const predefinedAmounts = [5, 10, 25, 50, 100];

  const handleAmountSelect = (value: number) => {
    setAmount(value.toString());
  };

  
  const handleSupport = async () => {
  const parsedAmount = parseFloat(amount);

  if (!amount || parsedAmount < 1) {
    setAlertConfig({
      title: "Invalid Amount",
      message: "Please enter an amount of at least $1.",
      type: "error",
    });
    setAlertVisible(true);
    return;
  }

  setIsProcessing(true);
  try {
    const response = await createSupport(
      parsedAmount,
      isRecurring,
      isRecurring ? interval : undefined
    );

    const { clientSecret, customerId, type, priceId, setupIntentId } = response;

    if (isRecurring) {
      // For recurring payments, use setupIntentClientSecret
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "The Daily Answer",
        customerId: customerId,
        setupIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: false,
      });

      if (initError) {
        setAlertConfig({
          title: "Error",
          message: "Failed to initialize payment sheet.",
          type: "error",
        });
        setAlertVisible(true);
        setIsProcessing(false);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== "Canceled") {
          setAlertConfig({
            title: "Payment Error",
            message: presentError.message,
            type: "error",
          });
          setAlertVisible(true);
        }
        setIsProcessing(false);
        return;
      }

      // After successful payment method collection, create the subscription
      const confirmation = await confirmRecurringSupport(setupIntentId, priceId);

      if (confirmation.success) {
        setAlertConfig({
          title: "Thank You! 🎉",
          message: `Your recurring support of $${parsedAmount.toFixed(2)} has been set up successfully. We truly appreciate your generosity!`,
          type: "success",
        });
        setAlertVisible(true);

        // Reset form
        setAmount("");
        setIsRecurring(false);

      } else {
        setAlertConfig({
          title: "Confirmation Failed",
          message: confirmation.message || "Could not set up recurring support.",
          type: "error",
        });
        setAlertVisible(true);
      }
    } else {
      // For one-time payments
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "The Daily Answer",
        customerId: customerId,
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
      });

      if (initError) {
        setAlertConfig({
          title: "Error",
          message: "Failed to initialize payment sheet.",
          type: "error",
        });
        setAlertVisible(true);
        setIsProcessing(false);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== "Canceled") {
          setAlertConfig({
            title: "Payment Error",
            message: presentError.message,
            type: "error",
          });
          setAlertVisible(true);
        }
        setIsProcessing(false);
        return;
      }

      const paymentIntentId = clientSecret.split("_secret")[0];
      const confirmation = await confirmPayment(paymentIntentId);

      if (confirmation.success) {
        setAlertConfig({
          title: "Thank You! 🎉",
          message: `Your one-time support of $${parsedAmount.toFixed(2)} has been processed successfully. We truly appreciate your generosity!`,
          type: "success",
        });
        setAlertVisible(true);

        // Reset form
        setAmount("");

        // Navigate back after a delay
        setTimeout(() => {
          router.back();
        }, 2500);
      } else {
        setAlertConfig({
          title: "Confirmation Failed",
          message: confirmation.message || "Could not process your support payment.",
          type: "error",
        });
        setAlertVisible(true);
      }
    }
  } catch (e: any) {
    setAlertConfig({
      title: "Payment Error",
      message: e.message || "An unexpected error occurred.",
      type: "error",
    });
    setAlertVisible(true);
  } finally {
    setIsProcessing(false);
  }
};
  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <Stack.Screen
        options={{
          headerTitle: "Support Us",
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: "#1E293B" },
          headerTintColor: "#fff",
          headerTitleStyle: { color: "#fff" },
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center px-6 py-8">
          <Image source={logoImage} className="w-24 h-24 rounded-full mb-6" />
          <Text className="text-white text-2xl font-bold text-center mb-3">
            Support Our Mission
          </Text>
          <Text className="text-slate-400 text-base text-center mb-8">
            Your generous support helps us continue providing quality devotional
            content to people around the world.
          </Text>

          {/* Why Support Section */}
          <View className="w-full mb-8">
            <Text className="text-white text-lg font-semibold mb-4">
              Why Your Support Matters:
            </Text>
            <View className="flex-row items-center mb-3">
              <Ionicons name="heart" size={24} color="#E94B7B" />
              <Text className="text-slate-300 text-base ml-3">
                Help us reach more people with daily devotionals
              </Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Ionicons name="create" size={24} color="#E94B7B" />
              <Text className="text-slate-300 text-base ml-3">
                Support quality content creation
              </Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Ionicons name="globe" size={24} color="#E94B7B" />
              <Text className="text-slate-300 text-base ml-3">
                Keep the app free for those who need it
              </Text>
            </View>
          </View>

          {/* Predefined Amounts */}
          <View className="w-full mb-6">
            <Text className="text-white text-lg font-semibold mb-3">
              Quick Select:
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {predefinedAmounts.map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => handleAmountSelect(value)}
                  className={`w-[30%] border-2 rounded-xl p-3 mb-3 items-center ${
                    amount === value.toString()
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-slate-700"
                  }`}
                >
                  <Text className="text-white text-lg font-bold">
                    ${value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Amount Input */}
          <View className="w-full mb-6">
            <Text className="text-white text-lg font-semibold mb-3">
              Or Enter Custom Amount:
            </Text>
            <View className="flex-row items-center bg-slate-800 rounded-xl px-4 py-3 border-2 border-slate-700">
              <Text className="text-white text-2xl mr-2">$</Text>
              <TextInput
                className="flex-1 text-white text-lg"
                placeholder="0.00"
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          {/* Recurring Option */}
          <View className="w-full mb-6">
            <TouchableOpacity
              onPress={() => setIsRecurring(!isRecurring)}
              className="flex-row items-center bg-slate-800 rounded-xl p-4 border-2 border-slate-700"
            >
              <View
                className={`w-6 h-6 rounded-md mr-3 items-center justify-center ${
                  isRecurring ? "bg-pink-500" : "bg-slate-700"
                }`}
              >
                {isRecurring && (
                  <Ionicons name="checkmark" size={18} color="white" />
                )}
              </View>
              <Text className="text-white text-base flex-1">
                Make this recurring
              </Text>
            </TouchableOpacity>
          </View>

          {/* Interval Selection */}
          {isRecurring && (
            <View className="w-full mb-6">
              <Text className="text-white text-lg font-semibold mb-3">
                Frequency:
              </Text>
              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={() => setInterval("monthly")}
                  className={`flex-1 mr-2 border-2 rounded-xl p-4 items-center ${
                    interval === "monthly"
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-slate-700"
                  }`}
                >
                  <Text className="text-white text-base font-semibold">
                    Monthly
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setInterval("yearly")}
                  className={`flex-1 ml-2 border-2 rounded-xl p-4 items-center ${
                    interval === "yearly"
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-slate-700"
                  }`}
                >
                  <Text className="text-white text-base font-semibold">
                    Yearly
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Support Button */}
          <TouchableOpacity
            onPress={handleSupport}
            disabled={isProcessing || !amount}
            className={`w-full py-4 rounded-xl items-center justify-center mb-6 ${
              isProcessing || !amount ? "bg-pink-600/50" : "bg-pink-600"
            }`}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-bold">
                {amount
                  ? `Support with $${parseFloat(amount || "0").toFixed(2)}`
                  : "Enter Amount"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Info Text */}
          <Text className="text-slate-500 text-xs text-center">
            {isRecurring
              ? `Your payment method will be charged $${parseFloat(amount || "0").toFixed(2)} ${interval} on a recurring basis. You can cancel at any time.`
              : "This is a secure one-time payment. Your support goes directly to maintaining and improving The Daily Answer."}
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

export default Support;