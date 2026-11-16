import React from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import { useGlobalContext } from "@/utils/auth";
import { AlreadySubscribedView } from "@/components/subscription/AlreadySubscribedView";
import { IosSubscriptionView } from "@/components/subscription/IosSubscriptionView";
import { AndroidSubscriptionView } from "@/components/subscription/AndroidSubscriptionView";

const SubscriptionTab = () => {
  const { hasPaid } = useGlobalContext();

  if (hasPaid) {
    return (
      <AlreadySubscribedView
        onBack={() => router.replace("/profile")}
        isTab
      />
    );
  }

  if (Platform.OS === "ios") {
    return (
      <IosSubscriptionView
        onBack={() => router.replace("/profile")}
        onSuccess={() => router.replace("/(root)/(tabs)")}
        isTab
      />
    );
  }

  return (
    <AndroidSubscriptionView
      onBack={() => router.replace("/profile")}
      onSuccess={() => router.replace("/(root)/(tabs)")}
      isTab
    />
  );
};

export default SubscriptionTab;
