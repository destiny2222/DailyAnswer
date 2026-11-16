import React from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import { useGlobalContext } from "@/utils/auth";
import { AlreadySubscribedView } from "@/components/subscription/AlreadySubscribedView";
import { IosSubscriptionView } from "@/components/subscription/IosSubscriptionView";
import { AndroidSubscriptionView } from "@/components/subscription/AndroidSubscriptionView";

const SubscriptionScreen = () => {
  const { hasPaid } = useGlobalContext();

  if (hasPaid) {
    return <AlreadySubscribedView onBack={() => router.back()} />;
  }

  if (Platform.OS === "ios") {
    return (
      <IosSubscriptionView
        onBack={() => router.back()}
        onSuccess={() => router.back()}
      />
    );
  }

  return (
    <AndroidSubscriptionView
      onBack={() => router.back()}
      onSuccess={() => router.back()}
    />
  );
};

export default SubscriptionScreen;
