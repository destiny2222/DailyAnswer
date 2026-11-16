import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

interface AlreadySubscribedViewProps {
  onBack: () => void;
  isTab?: boolean;
}

export const AlreadySubscribedView: React.FC<AlreadySubscribedViewProps> = ({
  onBack,
  isTab = false,
}) => {
  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar style="light" />
      <View className="flex-row items-center px-4 py-4 border-b border-slate-800">
        <TouchableOpacity
          onPress={onBack}
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
          onPress={onBack}
          className="bg-pink-600 w-full py-4 rounded-xl items-center justify-center mt-4"
        >
          <Text className="text-white text-lg font-bold">
            {isTab ? "Go to Home" : "Go Back"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

