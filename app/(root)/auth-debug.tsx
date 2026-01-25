import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserProfile } from '../../utils/auth';

const AuthDebugScreen = () => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const accessToken = await SecureStore.getItemAsync('access_token');
    setToken(accessToken);
  };

  const testProfileFetch = async () => {
    setLoading(true);
    try {
      const userProfile = await getUserProfile();
      setProfile(userProfile);
      Alert.alert('Success', 'Profile fetched successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearToken = async () => {
    await SecureStore.deleteItemAsync('access_token');
    setToken(null);
    setProfile(null);
    Alert.alert('Success', 'Token cleared');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-4">Auth Debug</Text>
      </View>

      <View className="p-4">
        <View className="mb-4">
          <Text className="text-lg font-bold mb-2">Access Token:</Text>
          <View className="bg-gray-100 p-3 rounded">
            <Text className="text-xs font-mono" numberOfLines={3}>
              {token || 'No token found'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="bg-blue-500 p-4 rounded mb-3"
          onPress={testProfileFetch}
          disabled={loading}
        >
          <Text className="text-white text-center font-bold">
            {loading ? 'Loading...' : 'Test Profile Fetch'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-red-500 p-4 rounded mb-3"
          onPress={clearToken}
        >
          <Text className="text-white text-center font-bold">Clear Token</Text>
        </TouchableOpacity>

        {profile && (
          <View className="mt-4">
            <Text className="text-lg font-bold mb-2">Profile Data:</Text>
            <View className="bg-gray-100 p-3 rounded">
              <Text className="text-xs">{JSON.stringify(profile, null, 2)}</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default AuthDebugScreen;
