import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

export interface FormContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerTitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  containerClassName?: string;
  contentContainerClassName?: string;
}

export const FormContainer: React.FC<FormContainerProps> = ({
  children,
  title,
  subtitle,
  headerTitle,
  onBack,
  showBack = false,
  refreshing = false,
  onRefresh,
  containerClassName = "bg-slate-900",
  contentContainerClassName = "px-6",
}) => {
  return (
    <SafeAreaView className={`flex-1 ${containerClassName}`}>
      <StatusBar style="light" />

      {/* Top Navigation Bar */}
      {(showBack || headerTitle) && (
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-800">
          {showBack && onBack ? (
            <TouchableOpacity
              onPress={onBack}
              className="w-11 h-11 rounded-full bg-slate-800 items-center justify-center opacity-90"
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <View className="w-11" />
          )}

          {headerTitle && (
            <Text className="text-white text-lg font-bold text-center flex-1">
              {headerTitle}
            </Text>
          )}

          <View className="w-11" />
        </View>
      )}

      {/* Keyboard Avoiding Scroll Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#E94B7B"
                colors={["#E94B7B"]}
              />
            ) : undefined
          }
        >
          {/* Optional Title Section */}
          {(title || subtitle) && (
            <View className="px-6 pt-8 pb-6 items-center">
              {title && (
                <Text className="text-white text-3xl font-bold mb-2 text-center">
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text className="text-white/60 text-base text-center leading-relaxed">
                  {subtitle}
                </Text>
              )}
            </View>
          )}

          {/* Form Content */}
          <View className={`flex-1 ${contentContainerClassName}`}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default FormContainer;
