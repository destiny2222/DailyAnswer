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
import { ApiError, apiRequest } from "../../utils/api";
import { useGlobalContext } from "../../utils/auth";
import TurnstileWidget from "../../components/TurnstileWidget";

interface LoginResponse {
  success: boolean;
  token?: string;
  otp_required?: boolean;
  message?: string;
}

interface LoginVerifyResponse {
  success: boolean;
  token: string;
}

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
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

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

    if (!turnstileToken) {
      setAlertConfig({
        title: "Security Check",
        message: "Verify you are not a robot.",
        type: "error",
      });
      setAlertVisible(true);
      return;
    }

    try {
      setLoading(true);

      const response = await apiRequest<LoginResponse>("/login", {
        method: "POST",
        body: {
          email,
          password,
          "cf-turnstile-response": turnstileToken,
        },
        auth: false,
      });

      if (response.otp_required) {
        setAlertConfig({
          title: "Verify Email",
          message: response.message || "Please enter the OTP sent to your email.",
          type: "success",
        });
        setAlertVisible(true);
        setStep("otp");
        startResendTimer();
        return;
      }

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
      // logger.error("Login error:", error);
      const errorMessage = ApiError.getMessage(error);

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

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyLoginOtp = async () => {
    if (otp.length !== 6) {
      setAlertConfig({
        title: "Invalid OTP",
        message: "Please enter a 6-digit code.",
        type: "error",
      });
      setAlertVisible(true);
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest<LoginVerifyResponse>("/verify-login-otp", {
        method: "POST",
        body: { email, otp },
        auth: false,
      });

      if (response.success && response.token) {
        await SecureStore.setItemAsync("access_token", response.token);
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
     
      const errorMessage = ApiError.getMessage(error);
      setAlertConfig({
        title: "Verification Failed",
        message: errorMessage,
        type: "error",
      });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    try {
      setLoading(true);
      await apiRequest("/resend-otp", {
        method: "POST",
        body: { email, type: "login" },
        auth: false,
      });

      setAlertConfig({
        title: "OTP Resent",
        message: "A new code has been sent to your email.",
        type: "success",
      });
      setAlertVisible(true);
      startResendTimer();
    } catch (error: any) {
      setAlertConfig({
        title: "Error",
        message: error?.message || "Failed to resend OTP.",
        type: "error",
      });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-900 pt-7">
      <StatusBar style="light" animated={true}/>

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
            {step === "form" ? (
              <>
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

                {/* Turnstile Widget */}
                <TurnstileWidget onVerify={setTurnstileToken} />

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
              </>
            ) : (
              <>
                <View className="mb-8">
                  <Text className="text-white/80 text-sm font-semibold mb-4 text-center">
                    Enter the 6-digit code sent to {email}
                  </Text>
                  <View className="bg-slate-800 rounded-2xl px-4 py-5 flex-row items-center justify-center">
                    <Ionicons name="key-outline" size={24} color="#9CA3AF" />
                    <TextInput
                      value={otp}
                      onChangeText={setOtp}
                      placeholder="123456"
                      placeholderTextColor="#4B5563"
                      keyboardType="number-pad"
                      maxLength={6}
                      className="ml-4 text-white text-3xl font-bold tracking-[10px] flex-1 text-center"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleVerifyLoginOtp}
                  disabled={loading || otp.length < 6}
                  activeOpacity={0.8}
                  className={`mb-6 rounded-2xl py-4 items-center justify-center ${otp.length === 6 ? 'bg-[#E94B7B]' : 'bg-slate-800'}`}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-lg font-bold">
                      Verify OTP
                    </Text>
                  )}
                </TouchableOpacity>

                <View className="flex-row justify-center items-center mb-6">
                  <Text className="text-white/60 text-base">Didn&apos;t receive code? </Text>
                  <TouchableOpacity 
                    onPress={handleResendOtp} 
                    disabled={resendTimer > 0 || loading}
                  >
                    <Text className={`text-base font-semibold ${resendTimer > 0 ? 'text-white/30' : 'text-[#E94B7B]'}`}>
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  onPress={() => setStep("form")} 
                  className="items-center py-2"
                >
                  <Text className="text-white/60 text-sm">Change Credentials</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Sign Up Link */}
            <View className="flex-row items-center justify-center pb-8 mt-4">
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
