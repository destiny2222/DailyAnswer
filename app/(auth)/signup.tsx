import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
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

const SignUp = () => {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });

  const handleSignUp = async () => {
    if (!fullName || !username || !email || !password || !confirmPassword) {
      setAlertConfig({
        title: "Validation Error",
        message: "Please fill in all fields",
        type: "error",
      });
      setAlertVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setAlertConfig({
        title: "Password Mismatch",
        message: "Passwords do not match",
        type: "error",
      });
      setAlertVisible(true);
      return;
    }

    if (password.length < 6) {
      setAlertConfig({
        title: "Weak Password",
        message: "Password must be at least 6 characters",
        type: "error",
      });
      setAlertVisible(true);
      return;
    }

    try {
      setLoading(true);

      await apiRequest("/register", {
        method: "POST",
        body: {
          name: fullName,
          email,
          username,
          password,
          password_confirmation: confirmPassword,
        },
        auth: false,
      });

      setAlertConfig({
        title: "Registration Successful!",
        message: "Please login to continue",
        type: "success",
      });
      setAlertVisible(true);

      // Redirect to login after a brief delay
      setTimeout(() => {
        router.push("/(auth)/login");
      }, 2000);
    } catch (error: any) {
      console.error("SignUp error:", error);
      const errorMessage = error?.data?.errors
        ? Object.values(error.data.errors).flat().join(", ")
        : error?.message || "Sign up failed. Please try again.";

      setAlertConfig({
        title: "Registration Failed",
        message: errorMessage,
        type: "error",
      });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-900">
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View className="px-6 pt-16 pb-6">
            <View className="items-center mb-6">
              {/* <View className="w-20 h-20 rounded-full bg-[#E94B7B]/20 items-center justify-center mb-4">
                <Ionicons name="flower" size={48} color="#FB923C" />
              </View> */}
              <Text className="text-white text-3xl font-bold mb-2">
                Create Account
              </Text>
              <Text className="text-white/60 text-base text-center">
                Start your spiritual journey with us
              </Text>
            </View>
          </View>

          {/* Form Section */}
          <View className="flex-1 px-6">
            {/* Full Name Input */}
            <View className="mb-4">
              <Text className="text-white/80 text-sm font-semibold mb-2">
                Full Name
              </Text>
              <View className="bg-slate-800 rounded-2xl px-4 py-4 flex-row items-center">
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  autoComplete="name"
                  className="flex-1 ml-3 text-white text-base"
                />
              </View>
            </View>

            {/* Username Input */}
            {/* <View className="mb-4">
              <Text className="text-white/80 text-sm font-semibold mb-2">
                Username
              </Text>
              <View className="bg-slate-800 rounded-2xl px-4 py-4 flex-row items-center">
                <Ionicons name="at-outline" size={20} color="#9CA3AF" />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Choose a username"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoComplete="username"
                  className="flex-1 ml-3 text-white text-base"
                />
              </View>
            </View> */}

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
            <View className="mb-4">
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
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
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

            {/* Confirm Password Input */}
            <View className="mb-6">
              <Text className="text-white/80 text-sm font-semibold mb-2">
                Confirm Password
              </Text>
              <View className="bg-slate-800 rounded-2xl px-4 py-4 flex-row items-center">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#9CA3AF"
                />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  className="flex-1 ml-3 text-white text-base"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="ml-2"
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-outline" : "eye-off-outline"
                    }
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.8}
              className="mb-6 rounded-2xl bg-[#E94B7B] py-4 items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-bold">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* Terms and Privacy */}
            <Text className="text-white/40 text-xs text-center mb-6 px-4">
              By signing up, you agree to our{" "}
              <Text className="text-[#E94B7B]">Terms of Service</Text> and{" "}
              <Text className="text-[#E94B7B]">Privacy Policy</Text>
            </Text>

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-slate-700" />
              <Text className="text-white/40 text-sm px-4">
                or sign up with
              </Text>
              <View className="flex-1 h-px bg-slate-700" />
            </View>

            {/* Social Sign Up Buttons */}
            <View className="flex-row justify-center gap-4 mb-6">
              <TouchableOpacity className="w-16 h-16 rounded-2xl bg-slate-800 items-center justify-center">
                <Ionicons name="logo-google" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <View className="flex-row items-center justify-center pb-8">
              <Text className="text-white/60 text-base">
                Already have an account?{" "}
              </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-[#E94B7B] text-base font-semibold">
                    Sign In
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

export default SignUp;
