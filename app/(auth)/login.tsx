import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CustomAlert from "../../components/CustomAlert";
import { apiRequest } from "../../utils/api";
import { useGlobalContext } from "../../utils/auth";

const Login = () => {
  const router = useRouter();
  const { refetchUser } = useGlobalContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertConfig({
        title: "Validation Error",
        message: "Please fill in all fields",
        type: "error",
      });
      setAlertVisible(true);
      return;
    }

    try {
      setLoading(true);

      const response = await apiRequest<{ success: boolean; token: string }>(
        "/login",
        {
          method: "POST",
          body: {
            email,
            password,
          },
          auth: false,
        },
      );

      if (response.success && response.token) {
        await SecureStore.setItemAsync("access_token", response.token);
        
        // Fetch user profile to update global context
        await refetchUser();
        
        setAlertConfig({
          title: "Login Successful!",
          message: "Welcome back",
          type: "success",
        });
        setAlertVisible(true);

        setTimeout(() => {
          router.replace("/(root)/(tabs)");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error?.data?.errors
        ? Array.isArray(error.data.errors)
          ? error.data.errors.join(", ")
          : "Invalid credentials"
        : error?.message || "Login failed. Please try again.";

      setAlertConfig({
        title: "Login Failed",
        message: errorMessage,
        type: "error",
      });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-900 pt-7">
      <StatusBar style="light" />

      <KeyboardAvoidingView  behavior={Platform.OS === "ios" ? "padding" : "height"}  className="flex-1" >
        <ScrollView  className="flex-1 " contentContainerStyle={{ flexGrow: 1, paddingTop: 100 }}  showsVerticalScrollIndicator={false}  >
          {/* Header Section */}
          <View className="px-6 pt-16 pb-8">
            <View className="items-center mb-8">
              {/* <View className="w-20 h-20 rounded-full bg-[#E94B7B]/20 items-center justify-center mb-4">
                <Ionicons name="flower" size={48} color="#FB923C" />
              </View> */}
              <Text className="text-white text-3xl font-bold mb-2">
                Welcome Back
              </Text>
              <Text className="text-white/60 text-base text-center">
                Sign in to continue your spiritual journey
              </Text>
            </View>
          </View>

          {/* Form Section */}
          <View className="flex-1 px-6">
            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-white/80 text-sm font-semibold mb-2">
                Email Address
              </Text>
              <View className="bg-slate-800 rounded-2xl px-4 py-4 flex-row items-center">
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="flex-1 ml-3 text-white text-base"
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <Text className="text-white/80 text-sm font-semibold mb-2">
                Password
              </Text>
              <View className="bg-slate-800 rounded-2xl px-4 py-4 flex-row items-center">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#9CA3AF"
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  className="flex-1 ml-3 text-white text-base"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="ml-2"
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              className="self-end mb-6"
              onPress={() => router.push('/(auth)/forgotPassword')}
            >
              <Text className="text-[#E94B7B] text-sm font-semibold">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
              className="mb-6 rounded-2xl bg-[#E94B7B] py-4 items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-bold">Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            {/* <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-slate-700" />
              <Text className="text-white/40 text-sm px-4">
                or continue with
              </Text>
              <View className="flex-1 h-px bg-slate-700" />
            </View> */}

            {/* Social Login Buttons */}
            {/* <View className="flex-row justify-center gap-4 mb-6">
              <TouchableOpacity className="w-16 h-16 rounded-2xl bg-slate-800 items-center justify-center">
                <Ionicons name="logo-google" size={24} color="#fff" />
              </TouchableOpacity>
            </View> */}

            {/* Sign Up Link */}
            <View className="flex-row items-center justify-center pb-8">
              <Text className="text-white/60 text-base">
                Don't have an account?{" "}
              </Text>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity>
                  <Text className="text-[#E94B7B] text-base font-semibold">
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

export default Login;
