import CustomAlert from "@/components/CustomAlert";
import { cancelRecurringSupport, getSupportPlans } from "@/libs/payment";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface RecurringSupport {
  id: string;
  subscriptionId: string;
  amount: number;
  type?: "one_time" | "recurring";
  interval?: "monthly" | "yearly" | null;
  created: string; // ISO date string
  nextPaymentDate?: string; // Optional, but not used for calculation
  status: string;
}

const ManageSupport = () => {
  if (Platform.OS === 'ios') {
    return null;
  }

  // In a real app, fetch this data from your API
  const [supports, setSupports] = useState < RecurringSupport[] > ([]);
  // Track loading state per subscription
  const [loadingId, setLoadingId] = useState < string | null > (null);
  // Track loading state for initial data fetch
  const [initialLoading, setInitialLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });


  useFocusEffect(
    useCallback(() => {
      const fetchSupports = async () => {
        setInitialLoading(true);
        try {
          const plans = await getSupportPlans();
          setSupports(plans);
        } catch {
         
        } finally {
          setInitialLoading(false);
        }
      };

      fetchSupports();
    }, [])
  );



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
      const response = await cancelRecurringSupport(support.subscriptionId);

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
          Manage Support
        </Text>
        <View className="w-11" />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 py-8">
          <Text className="text-white text-2xl font-bold mb-2">
            Your Recurring Donations
          </Text>
          <Text className="text-slate-400 text-base mb-8">
            Manage your ongoing Donations contributions
          </Text>

          {initialLoading ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color="#EC4899" />
            </View>
          ) : supports.length === 0 ? (
            <View className="items-center py-12 px-4 bg-slate-800/40 border border-slate-800 rounded-2xl">
              <Ionicons name="heart-outline" size={48} color="#64748B" style={{ marginBottom: 16 }} />
              <Text className="text-white text-lg font-semibold mb-2 text-center">
                No Active Recurring Donations
              </Text>
              <Text className="text-slate-400 text-sm text-center mb-6 max-w-xs leading-relaxed">
                You do not have any ongoing recurring donation contributions at the moment.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/support" as any)}
                className="bg-pink-600 active:bg-pink-700 px-6 py-3.5 rounded-xl items-center justify-center w-full max-w-xs"
              >
                <Text className="text-white text-base font-bold">
                  Support Our Mission
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
                        {support.type === "one_time" ? "One-Time Donation" : `${support.interval} Donation`}
                      </Text>
                    </View>
                    <View
                      className={`px-3 py-1 rounded-full ${support.status === "active"
                        ? "bg-green-500/20"
                        : "bg-slate-700"
                        }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${support.status === "active"
                          ? "text-green-400"
                          : "text-slate-400"
                          }`}
                      >
                        {support.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {support.type !== "one_time" && (
                    <>
                      <View className="flex-row items-center mb-4">
                        <Ionicons name="calendar" size={16} color="#64748B" />
                        <Text className="text-slate-400 text-sm ml-2">
                          Next payment: {getNextPaymentDate(support.created, support.interval || "monthly")}
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
                            Cancel Recurring Donations
                          </Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ))}

              <TouchableOpacity
                onPress={() => router.push("/support" as any)}
                className="bg-slate-800 border-2 border-pink-500 rounded-xl p-4 items-center mt-4"
              >
                <Text className="text-pink-500 text-base font-semibold">
                  Add More Donations
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
