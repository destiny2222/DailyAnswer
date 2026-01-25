import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useGlobalContext } from '../../../utils/auth';
import { api, apiRequest } from '../../../utils/api';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import CustomAlert from '../../../components/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const EditProfile = () => {
  const { user, setUser } = useGlobalContext();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const uriParts = uri.split(".");
  const ext = (uriParts[uriParts.length - 1] || "jpg").toLowerCase();
  const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;

  formData.append("profile_image", {
    uri,
    name: `profile.${ext}`,
    type: mime,
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

    if (response.success) {
      // backend returns ProfileResource in response.data
      setUser(response.data);

      setAlertInfo({
        visible: true,
        title: "Success",
        message: response.message,
        type: "success",
      });
    } else {
      setAlertInfo({
        visible: true,
        title: "Error",
        message: response.message || "Failed to update profile image.",
        type: "error",
      });
    }
  } catch (error: any) {
    console.error("Image upload error:", error?.data || error?.message);

    setAlertInfo({
      visible: true,
      title: "Error",
      message: error?.data?.error || error?.message || "Upload failed.",
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
          username,
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
        router.back();
      } else {
        setAlertInfo({
            visible: true,
            title: 'Error',
            message: (response as any).message || 'Failed to update profile.',
            type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Profile update error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || 'An error occurred while updating profile data.';
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

  return (
    <SafeAreaView className='flex-1 bg-gray-900' edges={['top']}>
    <ScrollView className="">
        <CustomAlert
            visible={alertInfo.visible}
            title={alertInfo.title}
            message={alertInfo.message}
            type={alertInfo.type}
            onClose={() => setAlertInfo({ ...alertInfo, visible: false })}
        />
      <View className="p-6">
        <View className="items-center mb-6">
          <View className="relative">
            <Image
              source={{ uri: profileImage || 'https://via.placeholder.com/150' }}
              className="w-32 h-32 rounded-full"
            />
            <TouchableOpacity
              onPress={handleChoosePhoto}
              className="absolute bottom-8 right-7 bg-[#E94B7B] p-2 rounded-full border-2 border-[#e94b7b]"
            >
              <Ionicons name="pencil" size={20} color="white" />
            </TouchableOpacity>
            {imageUploading && (
                <View className="absolute top-0 bottom-0 left-0 right-0 items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <ActivityIndicator size="large" color="#ffffff" />
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

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-300 mb-1">Username</Text>
          <TextInput
            className="p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
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
