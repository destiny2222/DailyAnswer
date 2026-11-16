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
  RefreshControl,
} from "react-native";
import CustomAlert from "../../components/CustomAlert";
import { CustomInput, CustomButton } from "../../components";
import { ApiError, apiRequest } from "../../utils/api";
import TurnstileWidget from "../../components/TurnstileWidget";
import { useGlobalContext } from "../../utils/auth";
import { useOtpAutoFill } from "../../utils/useOtpAutoFill";

interface RegisterResponse {
  success: boolean;
  message: string;
  otp_required?: boolean;
  email?: string;
}

interface RegistrationVerifyResponse {
  success: boolean;
  token?: string;
}

const SignUp = () => {
  const router = useRouter();
  const { refetchUser } = useGlobalContext();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState(""); // Restored
  const [email, setEmail] = useState(""); // Restored
  const [password, setPassword] = useState(""); // Restored
  const [confirmPassword, setConfirmPassword] = useState(""); // Restored
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState(""); // New field
  const [showPassword, setShowPassword] = useState(false); // Restored
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setFullName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPhone("");
    setReferralCode("");
    setOtp("");
    setStep("form");
    setRefreshing(false);
  }, []);

  useOtpAutoFill(step === "otp", setOtp);

  const handleSignUp = async () => {
    

    if (!fullName || !email || !password || !confirmPassword) {
      setAlertConfig({
        title: "Validation Error",
        message: "Please fill in all required fields",
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

    if (password.length < 8) {
      setAlertConfig({
        title: "Weak Password",
        message: "Password must be at least 8 characters and include symbols",
        type: "error",
      });
      setAlertVisible(true);
      return;
    }

    if (!recaptchaToken) {
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

      const response = await apiRequest<RegisterResponse>("/auth/register", {
        method: "POST",
        body: {
          name: fullName,
          email,
          phone,
          username,
          password,
          password_confirmation: confirmPassword,
          referral_code: referralCode,
          "cf-turnstile-response": recaptchaToken,
        },
        auth: false,
      });

      if (response.otp_required) {
        setAlertConfig({
          title: "Verify Email",
          message: response.message || "Please verify your email with the OTP sent.",
          type: "success",
        });
        setAlertVisible(true);
        setStep("otp");
        startResendTimer();
        return;
      }

      setAlertConfig({
        title: "Registration Successful!",
        message: "Your account has been created.",
        type: "success",
      });
      setAlertVisible(true);

      // Redirect to login after a brief delay
      setTimeout(() => {
        router.push("/(auth)/login");
      }, 2000);
    } catch (error: any) {
      const errorMessage = ApiError.getMessage(error);

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

  const handleVerifyRegistrationOtp = async () => {
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
      const response = await apiRequest<RegistrationVerifyResponse>("/auth/verify-registration-otp", {
        method: "POST",
        body: { email, otp },
        auth: false,
      });

      setAlertConfig({
        title: "Verification Successful!",
        message: "Your email has been verified. Welcome!",
        type: "success",
      });
      setAlertVisible(true);

      if (response.token) {
        await SecureStore.setItemAsync("access_token", response.token);
        await refetchUser();
      }

      setTimeout(() => {
        router.replace("/(root)/(tabs)");
      }, 2000);
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
      await apiRequest("/auth/resend-otp", {
        method: "POST",
        body: { email, type: "registration" },
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
      const errorMessage = ApiError.getMessage(error);
      setAlertConfig({
        title: "Error",
        message: errorMessage,
        type: "error",
      });
      setAlertVisible(true);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <View className="flex-1 bg-slate-900 align-center justify-center">
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E94B7B"
              colors={["#E94B7B"]}
            />
          }
        >
          {/* Header Section */}
          <View className="px-6 pt-24 pb-6">
            <View className="relative">
              {(step === "otp" || router.canGoBack()) && (
                <TouchableOpacity
                  onPress={() => {
                    if (step === "otp") {
                      setStep("form");
                    } else {
                      router.back();
                    }
                  }}
                  className="w-11 h-11 rounded-full bg-slate-800 items-center justify-center absolute"
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity> 
              )}
            </View>
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
            {step === "form" ? (
              <>
                {/* Full Name Input */}
                <CustomInput
                  label="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your fullname"
                  autoCapitalize="none"
                  autoComplete="name"
                  leftIcon="person-outline"
                />

                {/* Email Input */}
                <CustomInput
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon="mail-outline"
                />

                {/* Phone Input */}
                <CustomInput
                  label="Phone Number (Optional)"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1234567890"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  leftIcon="call-outline"
                />

                {/* Password Input */}
                <CustomInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  isPassword
                  autoCapitalize="none"
                  autoComplete="password-new"
                  leftIcon="lock-closed-outline"
                />

                {/* Confirm Password Input */}
                <CustomInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  isPassword
                  autoCapitalize="none"
                  autoComplete="password-new"
                  leftIcon="lock-closed-outline"
                />

                {/* Referral Code Input */}
                <CustomInput
                  label="Referral Code (Optional)"
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder="Enter referral code"
                  autoCapitalize="characters"
                  leftIcon="gift-outline"
                  containerClassName="mb-6"
                />

                <TurnstileWidget onVerify={setRecaptchaToken} />

                {/* Sign Up Button */}
                <CustomButton
                  title="Create Account"
                  onPress={handleSignUp}
                  loading={loading}
                  className="mb-6"
                />
              </>
            ) : (
              <>
                <View className="mb-8 ">
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
                      textContentType="oneTimeCode"
                      autoComplete="one-time-code"
                      autoFocus={true}
                      className="ml-4 text-white text-3xl font-bold tracking-[10px] flex-1 text-center"
                      secureTextEntry={true}
                    />
                  </View>
                </View>

                <CustomButton
                  title="Verify OTP"
                  onPress={handleVerifyRegistrationOtp}
                  loading={loading}
                  disabled={loading || otp.length < 6}
                  className="mb-6"
                />

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
              </>
            )}

            {/* Login Link */}
            <View className="flex-row items-center justify-center pb-8 mt-1">
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
