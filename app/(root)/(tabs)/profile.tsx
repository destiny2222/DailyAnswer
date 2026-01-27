import icons from '@/constants/icons';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAuthenticated, useGlobalContext } from '../../../utils/auth';

interface SettingsItemProps {
  icon: ImageSourcePropType;
  title: string;
  onPress?: () => void;
  textStyle?: string;
  showArrow?: boolean;
}

const SettingsItem = ({
  icon,
  title,
  onPress,
  textStyle,
  showArrow = true,
}: SettingsItemProps) => (
  <TouchableOpacity
    className="flex flex-row items-center justify-between bg-slate-800 py-5 px-4 mb-4 rounded-lg"
    onPress={onPress}
  >
    <View className="flex flex-row items-center gap-3">
      <Image source={icon} className="size-7" style={{ tintColor: '#E94B7B' }} />
      <Text
        className={`text-xl font-poppins-medium text-white ${textStyle}`}
      >
        {title}
      </Text>
    </View>
    {showArrow && <Image source={icons.rightArrow} className="size-5" style={{ tintColor: '#E94B7B' }} />}
  </TouchableOpacity>
);

const Profile = () => {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const { user, setUser } = useGlobalContext();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  //  console.log("User data in EditProfile:", user.profile_image_url);
    useEffect(() => {
      if (user) {
        setProfileImage(user.profile_image_url);
      }
    }, [user]);
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const auth = await isAuthenticated();
    setAuthenticated(auth);
  };

  const handleCreateAccount = () => {
    router.push('/(auth)/signup');
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  const handleLogout = async () => {
    SecureStore.deleteItemAsync("access_token");
    setUser(null);
    router.replace("/(auth)/login");
  };


  

  if (!authenticated) {
    return (
      <SafeAreaView className="flex-1 bg-[#101223]">
        <View className="flex-1 justify-center items-center px-6">
          <View className="items-center">
            <Text className="text-white text-3xl font-bold text-center mb-4">
              Access the Full Experience
            </Text>
            <Text className="text-gray-300 text-base text-center mb-8 leading-6">
              Create a free account, access thousands of devotionals, and read offline. No ads or paywalls—ever!
            </Text>

            <TouchableOpacity className="w-full bg-[#E94B7B] py-4 px-9 rounded-full mb-4 shadow-lg"
              onPress={handleCreateAccount}  activeOpacity={0.8}  >
              <Text className="text-white text-lg font-semibold text-center">
                Create Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="w-full bg-gray-600 py-4 px-9 rounded-full"
              onPress={handleSignIn}  activeOpacity={0.8} >
              <Text className="text-white text-lg font-semibold text-center">
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#101223]">
      <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-32 px-2"
        >
      <View className="px-4">
        <View className="flex-row p-4 items-center justify-between">
          <View>
            <Text className="text-2xl font-bold font-rubik-semibold mb-2 text-white">{user?.name || 'Guest User'}</Text>
            <Text className='text-gray-400 text-lg font-rubik-medium'>{user?.email}</Text>
          </View>
          <View className=''>
            <Image source={{ uri: profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=E94B7B&color=fff&size=200` }} style={{ width: 100, height: 100, borderRadius: 50 }} />
          </View>
        </View>
        <View className="flex-row justify-around gap-3">
          <TouchableOpacity className=" bg-slate-800 py-5 px-4 mb-4 rounded-lg items-center w-32" onPress={() => router.push('/about')}>
            <Ionicons name="information-circle-outline" size={24} color="#E94B7B" />
            <Text className="text-lg mt-2 text-white"> About Us </Text>
          </TouchableOpacity>
          <TouchableOpacity className=" bg-slate-800 py-5 px-4 mb-4 rounded-lg items-center w-32" onPress={() => router.push('/prayer')}>
            <Ionicons name="heart-outline" size={24} color="#E94B7B" />
            <Text className="text-lg mt-2 text-white"> Prayer </Text>
          </TouchableOpacity>
          {/* mb-6 bg-slate-300 shadow-sm rounded-lg p-4 items-center w-32 */}
          <TouchableOpacity className=" bg-slate-800 py-5 px-4 mb-4 rounded-lg items-center w-32" onPress={() => router.push('/note')}>
            <Ionicons name="document-text-outline" size={24} color="#E94B7B" />
            <Text className="text-lg mt-2 text-white"> Note </Text>
          </TouchableOpacity>
        </View>
         
        <View className="flex flex-col mt-10">
          <SettingsItem icon={icons.person}  title="Profile" onPress={() => router.push('/edit_profile')}/>
          <SettingsItem icon={icons.bell}  title='Subscription' onPress={() => router.push('/subscription')}/>
          <SettingsItem icon={icons.dumbell} title='Manage Support' onPress={() => router.push('/ManageSupport')}/>
          <SettingsItem icon={icons.language}  title="Memory Verse" onPress={() => router.push('/memory')} />
          <SettingsItem icon={icons.file}  title="Notes" onPress={() => router.push('/note')} />
          <SettingsItem icon={icons.shield}  title="Prayers" onPress={() => router.push('/prayer')}/>
          {/* <SettingsItem icon={icons.info}  title="About Us"  onPress={() => router.push('/about')} /> */}
          <SettingsItem icon={icons.support}  title="Security"  onPress={() => router.push('/security')}/>
          <SettingsItem icon={icons.security}  title="Change Password"  onPress={() => router.push('/changedPassword')} />
        </View>
        <View className="flex flex-col mt-5 pt-5 border-primary-200">
          <SettingsItem icon={icons.logout} title="Logout"
            onPress={handleLogout} textStyle="text-red-500"  showArrow={false}
          />
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;