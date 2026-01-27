import CustomAlert from '@/components/CustomAlert';
import { changePassword } from '@/libs/profileUpdate';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const changedPassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const validateForm = () => {
    if (!currentPassword.trim()) {
      setAlertInfo({
        visible: true,
        title: 'Validation Error',
        message: 'Please enter your current password.',
        type: 'error',
      });
      return false;
    }

    if (!newPassword.trim()) {
      setAlertInfo({
        visible: true,
        title: 'Validation Error',
        message: 'Please enter a new password.',
        type: 'error',
      });
      return false;
    }

    if (newPassword.length < 8) {
      setAlertInfo({
        visible: true,
        title: 'Validation Error',
        message: 'New password must be at least 8 characters long.',
        type: 'error',
      });
      return false;
    }

    if (newPassword !== confirmPassword) {
      setAlertInfo({
        visible: true,
        title: 'Validation Error',
        message: 'New password and confirmation do not match.',
        type: 'error',
      });
      return false;
    }

    if (currentPassword === newPassword) {
      setAlertInfo({
        visible: true,
        title: 'Validation Error',
        message: 'New password must be different from current password.',
        type: 'error',
      });
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      if (response.success) {
        setAlertInfo({
          visible: true,
          title: 'Success',
          message: response.message || 'Password changed successfully.',
          type: 'success',
        });
        
        // Clear form and reset visibility states
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        
        // Navigate back after a short delay
        setTimeout(() => {
          router.back();
        }, 2000);
      } else {
        setAlertInfo({
          visible: true,
          title: 'Error',
          message: response.message || 'Failed to change password.',
          type: 'error',
        });
        
        // Clear password fields on error for security
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      
      const errorMessage = error?.data?.error || error?.message || 'An error occurred while changing password.';
      
      setAlertInfo({
        visible: true,
        title: 'Error',
        message: errorMessage,
        type: 'error',
      });
      
      // Clear password fields on error for security
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-gray-900 px-6 py-4 border-b border-gray-700">
          <View className="flex-row items-center mb-2">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-2xl font-rubik-semibold text-white">
              Change Password
            </Text>
          </View>
          <Text className="text-gray-400 text-sm ml-10">
            Update your password to keep your account secure
          </Text>
        </View>

        {/* Security Icon */}
        <View className="items-center py-8">
          <View className="bg-pink-100 rounded-full p-6 mb-4">
            <Ionicons name="shield-checkmark" size={48} color="#E94B7B" />
          </View>
          <Text className="text-gray-200 font-rubik-medium text-center px-6">
            Choose a strong password with at least 8 characters
          </Text>
        </View>

        {/* Form */}
        <View className="px-6 pb-8">
          {/* Current Password */}
          <View className="mb-6">
            <Text className="text-gray-200 font-rubik-medium mb-2">
              Current Password
            </Text>
            <View className="flex-row items-center bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-gray-200 font-rubik-regular text-base"
                placeholder="Enter current password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                <Ionicons 
                  name={showCurrentPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View className="mb-6">
            <Text className="text-gray-200 font-rubik-medium mb-2">
              New Password
            </Text>
            <View className="flex-row items-center bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
              <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-gray-200 font-rubik-regular text-base"
                placeholder="Enter new password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons 
                  name={showNewPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>
            {newPassword.length > 0 && newPassword.length < 8 && (
              <Text className="text-red-500 text-xs mt-1 ml-1">
                Password must be at least 8 characters
              </Text>
            )}
          </View>

          {/* Confirm New Password */}
          <View className="mb-8">
            <Text className="text-gray-200 font-rubik-medium mb-2">
              Confirm New Password
            </Text>
            <View className="flex-row items-center bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
              <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-gray-200 font-rubik-regular text-base"
                placeholder="Confirm new password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons 
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text className="text-red-500 text-xs mt-1 ml-1">
                Passwords do not match
              </Text>
            )}
          </View>

          {/* Password Requirements */}
          <View className="bg-gray-700 border border-gray-700 rounded-xl p-4 mb-6">
            <Text className="text-blue-200 font-rubik-semibold mb-2">
              Password Requirements:
            </Text>
            <View className="flex-row items-center mb-1">
              <Ionicons 
                name={newPassword.length >= 8 ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={newPassword.length >= 8 ? "#10B981" : "#9CA3AF"} 
              />
              <Text className={`text-sm ml-2 ${newPassword.length >= 8 ? 'text-green-700' : 'text-gray-200'}`}>
                At least 8 characters
              </Text>
            </View>
            <View className="flex-row items-center mb-1">
              <Ionicons 
                name={newPassword !== confirmPassword || !confirmPassword ? "ellipse-outline" : "checkmark-circle"} 
                size={16} 
                color={newPassword === confirmPassword && confirmPassword ? "#10B981" : "#9CA3AF"} 
              />
              <Text className={`text-sm ml-2 ${newPassword === confirmPassword && confirmPassword ? 'text-green-700' : 'text-gray-200'}`}>
                Passwords match
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons 
                name={currentPassword && newPassword !== currentPassword ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={currentPassword && newPassword !== currentPassword ? "#10B981" : "#9CA3AF"} 
              />
              <Text className={`text-sm ml-2 ${currentPassword && newPassword !== currentPassword ? 'text-green-700' : 'text-gray-200'}`}>
                Different from current password
              </Text>
            </View>
          </View>

          {/* Update Button */}
          <TouchableOpacity
            onPress={handleChangePassword}
            disabled={loading}
            className={`bg-[#E94B7B] rounded-xl py-4 items-center justify-center ${
              loading ? 'opacity-70' : ''
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white font-rubik-semibold text-lg">
                Update Password
              </Text>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={loading}
            className="bg-gray-700 rounded-xl py-4 items-center justify-center mt-3"
          >
            <Text className="text-gray-200 font-rubik-semibold text-lg">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
        onClose={() => setAlertInfo({ ...alertInfo, visible: false })}
      />
    </SafeAreaView>
  );
};

export default changedPassword