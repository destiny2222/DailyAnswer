import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { router } from "expo-router";

type TopHeaderProps = {
  title: string;
};


const TopNav = ({ title }: TopHeaderProps) => {
//   const router = useRouter()

  return (
    <View className="flex-row items-center px-4 py-5 border-b bg-gray-900 border-gray-800">
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text className="text-xl font-bold ml-4 text-gray-100">
        {title}
      </Text>
    </View>
  )
}

export default TopNav