import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAlert from "@/components/CustomAlert";
import { cancelRecurringSupport, getSupportPlans } from "@/libs/payment";

interface RecurringSupport {
  id: string;
  subscriptionId: string;
  amount: number;
  interval: "monthly" | "yearly";
  created: string; // ISO date string
  nextPaymentDate?: string; // Optional, but not used for calculation
  status: string;
}

const ManageSupport = () => {
  // In a real app, fetch this data from your API
  const [supports, setSupports] = useState<RecurringSupport[]>([]);
  // Track loading state per subscription
  const [loadingId, setLoadingId] = useState<string | null>(null);
  // Track loading state for initial data fetch
  const [initialLoading, setInitialLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });


  useEffect(() => {
    const fetchSupports = async () => {
      setInitialLoading(true);
      try {
        const plans = await getSupportPlans();
        setSupports(plans);
      } catch (error) {
        console.error("Failed to fetch support plans:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchSupports();
  }, []);

  const handleCancelSupport = (support: RecurringSupport) => {
    Alert.alert(
      "Cancel Recurring Support",
      `Are you sure you want to cancel your ${support.interval} support of $${support.amount}?`,
      [
        {
          text: "No, Keep It",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => confirmCancelSupport(support),
        },
      ]
    );
  };

  const confirmCancelSupport = async (support: RecurringSupport) => {
    setLoadingId(support.id);
    try {
      const response = await cancelRecurringSupport(support.subscription_id);

      if (response.success) {
        // Remove the cancelled support from the list
        setSupports(supports.filter((s) => s.id !== support.id));

        setAlertConfig({
          title: "Cancelled",
          message: "Your recurring support has been cancelled successfully.",
          type: "success",
        });
        setAlertVisible(true);
      } else {
        setAlertConfig({
          title: "Error",
          message: "Failed to cancel recurring support. Please try again.",
          type: "error",
        });
        setAlertVisible(true);
      }
    } catch (error: any) {
      setAlertConfig({
        title: "Error",
        message: error.message || "An unexpected error occurred.",
        type: "error",
      });
      setAlertVisible(true);
    } finally {
      setLoadingId(null);
    }
  };

  // Calculate the next payment date based on created date and interval
  const getNextPaymentDate = (created: string, interval: "monthly" | "yearly") => {
    const createdDate = new Date(created);
    const now = new Date();
    let next = new Date(createdDate);

    // Find the next payment date after today
    while (next <= now) {
      if (interval === "monthly") {
        next.setMonth(next.getMonth() + 1);
      } else {
        next.setFullYear(next.getFullYear() + 1);
      }
    }
    return next.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <Stack.Screen
        options={{
          headerTitle: "Manage Support",
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: "#1E293B" },
          headerTintColor: "#fff",
          headerTitleStyle: { color: "#fff" },
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 py-8">
          <Text className="text-white text-2xl font-bold mb-2">
            Your Recurring Support
          </Text>
          <Text className="text-slate-400 text-base mb-8">
            Manage your ongoing support contributions
          </Text>

          {initialLoading ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color="#EC4899" />
            </View>
          ) : supports.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="heart-outline" size={64} color="#64748B" />
              <Text className="text-slate-400 text-lg text-center mt-4 mb-6">
                You don't have any active recurring support.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(root)/support")}
                className="bg-pink-600 px-6 py-3 rounded-xl"
              >
                <Text className="text-white text-base font-semibold">
                  Start Supporting
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {supports.filter((support) => support.status === "completed").map((support) => (
                <View
                  key={support.id}
                  className="bg-slate-800 rounded-xl p-4 mb-4 border-2 border-slate-700"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-white text-xl font-bold mb-1">
                        ${support.amount}
                      </Text>
                      <Text className="text-slate-400 text-sm capitalize">
                        {support.interval} Support
                      </Text>
                    </View>
                    <View
                      className={`px-3 py-1 rounded-full ${
                        support.status === "active"
                          ? "bg-green-500/20"
                          : "bg-slate-700"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          support.status === "active"
                            ? "text-green-400"
                            : "text-slate-400"
                        }`}
                      >
                        {support.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center mb-4">
                    <Ionicons name="calendar" size={16} color="#64748B" />
                    <Text className="text-slate-400 text-sm ml-2">
                      Next payment: {getNextPaymentDate(support.created_at, support.interval)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleCancelSupport(support)}
                    disabled={loadingId === support.id}
                    className="bg-red-500/10 border border-red-500/30 rounded-lg py-3 items-center"
                  >
                    {loadingId === support.id ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <Text className="text-red-400 font-semibold">
                        Cancel Recurring Support
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                onPress={() => router.push("/(root)/support")}
                className="bg-slate-800 border-2 border-pink-500 rounded-xl p-4 items-center mt-4"
              >
                <Text className="text-pink-500 text-base font-semibold">
                  Add More Support
                </Text>
              </TouchableOpacity>
            </View>
          )}
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

export default ManageSupport;