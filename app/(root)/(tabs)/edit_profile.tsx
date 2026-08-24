import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useGlobalContext } from '../../../utils/auth';
import { apiRequest, ApiError } from '../../../utils/api';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import CustomAlert from '../../../components/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const EditProfile = () => {
  const {user, setUser, loading: isFetchingUser, refetchUser} = useGlobalContext();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchUser();
    setRefreshing(false);
  };

  useEffect(() => {
    
    if (user) {
      setName(user.name);
      setUsername(user.username);
      setEmail(user.email);
      setProfileImage(user.profile_image_url);
    }
  }, [user]);

  const handleChoosePhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      setAlertInfo({
        visible: true,
        title: 'Permission required',
        message: 'You need to allow access to your photos to change your profile picture.',
        type: 'error',
      });
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
    });

    if (!pickerResult.canceled) {
        setProfileImage(pickerResult.assets[0].uri);
        handleImageUpload(pickerResult.assets[0].uri);
    }
  };

const handleImageUpload = async (uri: string) => {
  if (!uri) return;

  const formData = new FormData();

  // Normalize file name and type for the request
  const fileName = uri.split('/').pop() || 'profile.jpg';
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const type = ext === 'png' ? 'image/png' : 'image/jpeg';

  formData.append("profile_image", {
    uri,
    name: fileName,
    type: type,
  } as any);

  setImageUploading(true);

  try {
    const response = await apiRequest<{
      success: boolean;
      message: string;
      data: any;
    }>("/profile/change-image", {
      method: "POST",
      body: formData,
    });

    // console.log("[DEBUG] Profile Image Upload Response:", response);

    // Defensive check: backend PHP code returns { success, message, data }
    // but we check for response.data specifically since that's what setUser needs.
    if (response && (response.success || response.data)) {
      if (response.data) {
        setUser(response.data);
      }

      setAlertInfo({
        visible: true,
        title: "Success",
        message: response.message || "Profile image updated successfully.",
        type: "success",
      });
    } else {
      setAlertInfo({
        visible: true,
        title: "Error",
        message: response?.message || "Failed to update profile image.",
        type: "error",
      });
    }
  } catch (error: any) {
    // console.error("[DEBUG] Profile Image Upload Catch Error:", error);

    const errorMessage = error instanceof ApiError 
      ? ApiError.getMessage(error) 
      : (error?.message || "Upload failed.");

    setAlertInfo({
      visible: true,
      title: "Error",
      message: errorMessage,
      type: "error",
    });
  } finally {
    setImageUploading(false);
  }
};


  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/profile/update', {
        method: 'PUT',
        body: {
          name,
          username:"username",
          email,
        },
      });

      if (response.success) {
        setUser(response.data);
        setAlertInfo({
            visible: true,
            title: 'Success',
            message: 'Profile updated successfully.',
            type: 'success',
        });
        // router.replace('/profile');
      } else {
        setAlertInfo({
            visible: true,
            title: 'Error',
            message: (response as any).message || 'Failed to update profile.',
            type: 'error',
        });
      }
    } catch (error: any) {
      // console.error("[DEBUG] Profile Update Catch Error:", error);
      
      const errorMessage = error instanceof ApiError 
        ? ApiError.getMessage(error) 
        : (error?.message || 'An error occurred while updating profile data.');

      setAlertInfo({
        visible: true,
        title: 'Update Error',
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isFetchingUser || !user) {
    return (
      <SafeAreaView className='flex-1 bg-gray-900 justify-center items-center' edges={['top']}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#E94B7B" />
        <Text className="text-gray-400 mt-4">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-gray-900' edges={['top']}>
      <StatusBar style="light" />
      <View className="flex-row items-center px-4 py-4 border-b border-gray-800">
        <TouchableOpacity
          onPress={() => router.replace('/profile')}
          className="w-11 h-11 rounded-full bg-gray-800 items-center justify-center"
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-xl font-bold text-white">
          Edit Profile
        </Text>
        <View className="w-11" />
      </View>
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E94B7B" />
      }
    >
        <CustomAlert
            visible={alertInfo.visible}
            title={alertInfo.title}
            message={alertInfo.message}
            type={alertInfo.type}
            onClose={() => setAlertInfo({ ...alertInfo, visible: false })}
        />
      <View className="p-6">
        <View className="items-center justify-center mb-6">
          <View className="relative items-center justify-center">
            <Image
              source={{ uri: profileImage || 'https://via.placeholder.com/150' }}
              className="w-32 h-32 rounded-full"
            />
            <TouchableOpacity
              onPress={handleChoosePhoto}
              className="absolute bottom-10 right-7 bg-[#E94B7B] p-2 rounded-full border-2 border-[#e94b7b]"
            >
              <Ionicons name="pencil" size={20} color="white" />
            </TouchableOpacity>
            {imageUploading && (
                <View className="absolute bottom-20 right-30 items-center justify-center">
                    <ActivityIndicator size="large" color="#E94B7B" />
                </View>
            )}
            <Text className="mt-4 text-lg font-semibold text-white">Change profile picture</Text>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-300 mb-1">Name</Text>
          <TextInput
            className="p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View className='hidden'>
          <TextInput
            value={username}
            onChangeText={setUsername}
            className="p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            placeholder="Enter your username"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-300 mb-1">Email</Text>
          <TextInput
            className="p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
          />
        </View>

        <TouchableOpacity
          onPress={handleUpdateProfile}
          className={`py-4 rounded-lg ${loading ? 'bg-[#E94B7B]' : 'bg-[#E94B7B]'}`}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-center text-white font-bold text-lg">Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfile;
