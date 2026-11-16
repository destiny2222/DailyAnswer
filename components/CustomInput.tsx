import React, { forwardRef, useState } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  required?: boolean;
  containerClassName?: string;
  inputWrapperClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
}

export const CustomInput = forwardRef<TextInput, CustomInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isPassword = false,
      required = false,
      containerClassName = "mb-4",
      inputWrapperClassName = "",
      inputClassName = "",
      labelClassName = "",
      secureTextEntry,
      onFocus,
      onBlur,
      editable = true,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isSecure = isPassword ? !showPassword : secureTextEntry;

    const renderLeftIcon = () => {
      if (!leftIcon) return null;
      if (typeof leftIcon === "string") {
        return (
          <Ionicons
            name={leftIcon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={error ? "#F87171" : isFocused ? "#E94B7B" : "#9CA3AF"}
          />
        );
      }
      return leftIcon;
    };

    return (
      <View className={`w-full ${containerClassName}`}>
        {/* Label */}
        {label && (
          <View className="flex-row items-center mb-2">
            <Text
              className={`text-white/80 text-sm font-semibold ${labelClassName}`}
            >
              {label}
            </Text>
            {required && <Text className="text-pink-500 ml-1 font-bold">*</Text>}
          </View>
        )}

        {/* Input Wrapper */}
        <View
          className={`flex-row items-center bg-slate-800 rounded-2xl px-4 h-14 border ${
            error
              ? "border-red-500 bg-red-500/5"
              : isFocused
              ? "border-[#E94B7B] bg-slate-800"
              : "border-slate-700/60"
          } ${!editable ? "opacity-60" : ""} ${inputWrapperClassName}`}
        >
          {/* Left Icon */}
          {renderLeftIcon()}

          {/* Text Input */}
          <TextInput
            ref={ref}
            editable={editable}
            placeholderTextColor="#9CA3AF"
            secureTextEntry={isSecure}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            className={`flex-1 h-full text-white text-[16px] ${
              leftIcon ? "ml-3" : ""
            } ${inputClassName}`}
            style={[{ paddingVertical: 0, textAlignVertical: "center" }, props.style]}
            {...props}
          />

          {/* Right Icon / Password Toggle */}
          {isPassword ? (
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              activeOpacity={0.7}
              className="ml-2 p-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={isFocused ? "#E94B7B" : "#9CA3AF"}
              />
            </TouchableOpacity>
          ) : (
            rightIcon && <View className="ml-2">{rightIcon}</View>
          )}
        </View>

        {/* Error or Helper Text */}
        {error ? (
          <View className="flex-row items-center mt-1.5 ml-1">
            <Ionicons name="alert-circle" size={14} color="#F87171" />
            <Text className="text-red-400 text-xs ml-1 font-medium">{error}</Text>
          </View>
        ) : helperText ? (
          <Text className="text-slate-400 text-xs mt-1.5 ml-1 font-medium">
            {helperText}
          </Text>
        ) : null}
      </View>
    );
  }
);

CustomInput.displayName = "CustomInput";
export default CustomInput;
