import * as SecureStore from "expo-secure-store";
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiRequest } from "./api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  has_paid: boolean;
  payment_status: string | null;
  payment_date: string | null;
  payment_expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  hasPaid: boolean;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  setHasPaid: (hasPaid: boolean) => void;
  refetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  const refetchUser = async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");
      if (token) {
        setIsAuthenticated(true);
        const profile = await getUserProfile();
        if (profile) {
          setUser(profile);
          setHasPaid(profile.has_paid);
        } else {
          // Token is present but profile fetch failed, might be invalid token
          await logout();
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setHasPaid(false);
      }
    } catch (error) {
      console.error("Error during auth state check:", error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetchUser();
  }, []);

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync("access_token");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setHasPaid(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, hasPaid, loading, setUser, setHasPaid, refetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useGlobalContext must be used within an AuthProvider');
  }
  return context;
};

interface ProfileResponse {
  success: boolean;
  data: UserProfile;
}

/**
 * Check if user is authenticated by checking for access token
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await SecureStore.getItemAsync("access_token");
    return !!token;
  } catch (error) {
    // console.error("Error checking authentication:", error);
    return false;
  }
}

/**
 * Get the current user's access token
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync("access_token");
  } catch (error) {
    // console.error("Error retrieving access token:", error);
    return null;
  }
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const completed = await SecureStore.getItemAsync("onboarding_completed");
    return completed === "true";
  } catch (error) {
    // console.error("Error checking onboarding status:", error);
    return false;
  }
}

/**
 * Fetch user profile from the backend
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await apiRequest<ProfileResponse>("/profile", { auth: true });
    if (response.success) {
      return response.data;
    }
    return null;
  } catch (error) {
    // console.error("Error fetching user profile:", error);
    return null;
  }
}

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(): Promise<boolean> {
  try {
    const profile = await getUserProfile();
    return profile?.has_paid ?? false;
  } catch (error) {
    // console.error("Error checking subscription status:", error);
    return false;
  }
}

/**
 * Check both authentication and subscription status
 */
export async function canAccessPremiumContent(): Promise<{
  isAuthenticated: boolean;
  hasSubscription: boolean;
  canAccess: boolean;
}> {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return {
      isAuthenticated: false,
      hasSubscription: false,
      canAccess: false,
    };
  }

  const hasSubscription = await hasActiveSubscription();

  return {
    isAuthenticated: true,
    hasSubscription,
    canAccess: hasSubscription,
  };
}
