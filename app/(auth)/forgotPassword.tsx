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
import { CustomInput, CustomButton } from "../../components";
import { apiRequest } from "../../utils/api";
import TurnstileWidget from "../../components/TurnstileWidget";
import { useOtpAutoFill } from "../../utils/useOtpAutoFill";

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
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  useOtpAutoFill(step === "otp", setOtp);

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
      const response = await apiRequest<{ success: boolean; message: string }>(
        "/auth/send-reset-otp",
        {
          method: "POST",
          body: { 
            email,
            "cf-turnstile-response": recaptchaToken,
          },
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
        "/auth/reset-password",
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
    <View className="flex-1 bg-slate-900 pt-24">
      {(step === "otp" || router.canGoBack()) && (
        <TouchableOpacity
          onPress={() => {
            if (step === "otp") {
              setStep("email");
            } else {
              router.back();
            }
          }}
          className="absolute top-32 left-6 z-10 p-2"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      )}
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

                <TurnstileWidget onVerify={setRecaptchaToken} />

                <CustomButton
                  title="Send OTP"
                  onPress={handleSendOtp}
                  loading={loading}
                  className="mb-6"
                />
              </>
            ) : (
              <>
                <CustomInput
                  label="OTP Code"
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="Enter the OTP code"
                  keyboardType="number-pad"
                  maxLength={6}
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  autoFocus={true}
                  leftIcon="key-outline"
                />

                <CustomInput
                  label="New Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter new password"
                  isPassword
                  autoCapitalize="none"
                  leftIcon="lock-closed-outline"
                />

                <CustomInput
                  label="Confirm Password"
                  value={passwordConfirmation}
                  onChangeText={setPasswordConfirmation}
                  placeholder="Confirm new password"
                  isPassword
                  autoCapitalize="none"
                  leftIcon="lock-closed-outline"
                  containerClassName="mb-6"
                />

                <CustomButton
                  title="Reset Password"
                  onPress={handleResetPassword}
                  loading={loading}
                  className="mb-6"
                />
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
