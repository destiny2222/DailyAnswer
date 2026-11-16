import React from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
  rightIcon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
  className?: string;
  textClassName?: string;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  className = "",
  textClassName = "",
  onPress,
  ...props
}) => {
  const isInteractive = !loading && !disabled;

  // Variant container styles
  const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-[#E94B7B] active:bg-[#D43D6D]",
    secondary: "bg-slate-800 border border-slate-700 active:bg-slate-700",
    outline: "bg-transparent border border-[#E94B7B] active:bg-[#E94B7B]/10",
    ghost: "bg-transparent active:bg-white/5",
  };

  // Variant text styles
  const variantTextStyles: Record<ButtonVariant, string> = {
    primary: "text-white font-bold",
    secondary: "text-slate-200 font-semibold",
    outline: "text-[#E94B7B] font-bold",
    ghost: "text-[#E94B7B] font-semibold",
  };

  // Size styles
  const sizeStyles: Record<ButtonSize, string> = {
    sm: "py-2.5 px-4 rounded-xl",
    md: "py-4 px-6 rounded-2xl",
    lg: "py-4.5 px-8 rounded-2xl",
  };

  const sizeTextStyles: Record<ButtonSize, string> = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const renderIcon = (icon: keyof typeof Ionicons.glyphMap | React.ReactNode) => {
    if (!icon) return null;
    if (typeof icon === "string") {
      const color =
        variant === "primary" ? "#FFFFFF" : variant === "outline" ? "#E94B7B" : "#CBD5E1";
      return (
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={size === "sm" ? 16 : 20}
          color={color}
        />
      );
    }
    return icon;
  };

  return (
    <TouchableOpacity
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      activeOpacity={0.8}
      className={`w-full flex-row items-center justify-center ${variantStyles[variant]} ${
        sizeStyles[size]
      } ${!isInteractive ? "opacity-50" : ""} ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#FFFFFF" : "#E94B7B"}
        />
      ) : (
        <View className="flex-row items-center justify-center">
          {leftIcon && <View className="mr-2">{renderIcon(leftIcon)}</View>}
          <Text
            className={`${variantTextStyles[variant]} ${sizeTextStyles[size]} ${textClassName}`}
          >
            {title}
          </Text>
          {rightIcon && <View className="ml-2">{renderIcon(rightIcon)}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;
