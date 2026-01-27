import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import CustomAlert from "../../components/CustomAlert";
import { apiRequest } from "../../utils/api";

const ForgotPassword = () => {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });

  const handleSendOtp = async () => {
    if (!email) {
      setAlertConfig({
        title: "Validation Error",
        message: "Please enter your email address.",
        type: "error",
      });
      setAlertVisible(true);
      return;
    }
    try {
      setLoading(true);
      const response = await apiRequest<{ success: boolean; message: string }>(
        "/send-reset-otp",
        {
          method: "POST",
          body: { email },
          auth: false,
        }
      );
      if (response.success) {
        setAlertConfig({
          title: "OTP Sent",
          message: response.message,
          type: "success",
        });
        setAlertVisible(true);
        setStep("otp");
      } else {
        setAlertConfig({
          title: "Error",
          message: response.message || "Failed to send OTP.",
          type: "error",
        });
        setAlertVisible(true);
      }
    } catch (error: any) {
      setAlertConfig({
        title: "Error",
        message: error?.message || "Failed to send OTP.",
        type: "error",
      });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !password || !passwordConfirmation) {
      setAlertConfig({
        title: "Validation Error",
        message: "Please fill in all fields.",
        type: "error",
      });
      setAlertVisible(true);
      return;
    }
    if (password !== passwordConfirmation) {
      setAlertConfig({
        title: "Validation Error",
        message: "Passwords do not match.",
        type: "error",
      });
      setAlertVisible(true);
      return;
    }
    try {
      setLoading(true);
      const response = await apiRequest<{ success: boolean; message: string }>(
        "/reset-password",
        {
          method: "POST",
          body: {
            email,
            otp,
            password,
            password_confirmation: passwordConfirmation,
          },
          auth: false,
        }
      );
      if (response.success) {
        setAlertConfig({
          title: "Success",
          message: response.message || "Password reset successful.",
          type: "success",
        });
        setAlertVisible(true);
        setTimeout(() => {
          router.replace("/(auth)/login");
        }, 1500);
      } else {
        setAlertConfig({
          title: "Error",
          message: response.message || "Failed to reset password.",
          type: "error",
        });
        setAlertVisible(true);
      }
    } catch (error: any) {
      setAlertConfig({
        title: "Error",
        message: error?.message || "Failed to reset password.",
        type: "error",
      });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-900 pt-7">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingTop: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 pt-16 pb-8">
            <View className="items-center mb-8">
              <Text className="text-white text-3xl font-bold mb-2">
                Forgot Password
              </Text>
              <Text className="text-white/60 text-base text-center">
                {step === "email"
                  ? "Enter your email to receive a reset code."
                  : "Enter the OTP sent to your email and your new password."}
              </Text>
            </View>
          </View>

          <View className="flex-1 px-6">
            {step === "email" ? (
              <>
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
                <TouchableOpacity
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.8}
                  className="mb-6 rounded-2xl bg-[#E94B7B] py-4 items-center justify-center"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-lg font-bold">Send OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="mb-4">
                  <Text className="text-white/80 text-sm font-semibold mb-2">
                    OTP Code
                  </Text>
                  <View className="bg-slate-800 rounded-2xl px-4 py-4 flex-row items-center">
                    <Ionicons name="key-outline" size={20} color="#9CA3AF" />
                    <TextInput
                      value={otp}
                      onChangeText={setOtp}
                      placeholder="Enter the OTP code"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      className="flex-1 ml-3 text-white text-base"
                    />
                  </View>
                </View>
                <View className="mb-4">
                  <Text className="text-white/80 text-sm font-semibold mb-2">
                    New Password
                  </Text>
                  <View className="bg-slate-800 rounded-2xl px-4 py-4 flex-row items-center">
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter new password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      className="flex-1 ml-3 text-white text-base"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((prev) => !prev)}
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
                <View className="mb-6">
                  <Text className="text-white/80 text-sm font-semibold mb-2">
                    Confirm Password
                  </Text>
                  <View className="bg-slate-800 rounded-2xl px-4 py-4 flex-row items-center">
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                    <TextInput
                      value={passwordConfirmation}
                      onChangeText={setPasswordConfirmation}
                      placeholder="Confirm new password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      className="flex-1 ml-3 text-white text-base"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword((prev) => !prev)}
                      className="ml-2"
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.8}
                  className="mb-6 rounded-2xl bg-[#E94B7B] py-4 items-center justify-center"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-lg font-bold">Reset Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
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

export default ForgotPassword;
