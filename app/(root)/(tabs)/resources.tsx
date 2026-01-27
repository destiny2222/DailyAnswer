import AuthGuardModal from '@/components/AuthGuardModal';
import SubscriptionModal from '@/components/SubscriptionModal';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Devotional, fetchDevotionals } from "../../../libs/devotional";
import { canAccessPremiumContent } from '../../../utils/auth';
import TopNav from '@/components/topNav';



type DevotionItem = {
  id: number | string;
  title: string;
  verses: string;
  key_verse: string;
  content: string;
  date: Date;
  author: string;
  status: string;
  image: string;
};

interface DevotionCardProps {
  item: DevotionItem;
  index: number;
  onPress?: (item: DevotionItem) => void;
}

const stripHtml = (html: string) =>
    html
      ?.replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();

  const formatContent = (html: string) => {
    if (!html) return '';
    
    // Replace closing paragraph tags with double newlines to preserve paragraph breaks
    let formatted = html
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
    
    return formatted;
  };

export function DevotionCard({ item, index, onPress }: DevotionCardProps) {
  const formatDate = (date: Date | string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    };
    if (date instanceof Date) {
      return date.toLocaleDateString("en-US", options);
    }
    return new Date(date).toLocaleDateString("en-US", options);
  };

  return (
    <TouchableOpacity  onPress={() => onPress?.(item)} className="max-w-[25rem] bg-gray-800 rounded-2xl  shadow-xl overflow-hidden mb-8"
      activeOpacity={0.8}
    >
      <Image  source={{ uri: item.image }} className="w-full h-48" resizeMode="cover" />
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-gray-500 text-xs">
            {formatDate(item.date)}
          </Text>
          <Ionicons name="checkmark-done-circle-outline" size={18} color="#4CAF50" />
        </View>
        <Text className="text-gray-100 text-lg font-bold uppercase mb-2">
          {item.title}
        </Text>
        <Text className="text-gray-300 text-sm leading-6">
          {formatContent(item.content.slice(0, 150))}...
        </Text>
      </View>
    </TouchableOpacity>
  );
}


export default function ResourcesScreen() {
  const [devotionals, setDevotionals] = useState < Devotional[] > ([]);
  const [isLoading, setIsLoading] = useState < boolean > (false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadDevotionals = async () => {
      try {
        setIsLoading(true);
        const data = await fetchDevotionals();
        setDevotionals(data);
      } catch (e) {
        // console.log("Failed to load devotionals:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadDevotionals();
  }, []);

  const handleDevotionalPress = async (devotion: DevotionItem) => {
    const accessStatus = await canAccessPremiumContent();
    
    if (!accessStatus.isAuthenticated) {
      // console.log("User not authenticated, showing auth modal.");
      setShowAuthModal(true);
    } else if (!accessStatus.hasSubscription) {
      // console.log("User not subscribed, showing subscription modal.");
      setShowSubscriptionModal(true);
    } else {
      // User is authenticated and has subscription, navigate to devotional detail
      router.push(`/devotional/${devotion.id}`);
    }
  };


  


  return (
    <SafeAreaView className="bg-gray-900   h-screen">
      <TopNav title="Devotional" />
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#E94B7B" />
          <Text className="text-gray-500">Loading Devotionals...</Text>
        </View>
      ) : (
      <FlatList
        data={devotionals}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
        renderItem={({ item,index }) => (
          <DevotionCard 
            item={item}  
            index={index}
            onPress={(devotion) => {
              handleDevotionalPress(devotion);
              // router.push(`/devotional/${devotion.id}`);
            }}
          />
        )}
        ListHeaderComponent={
          <View className="mb-4 ">
            
            {/* search */}
            <View className="flex-row items-center bg-gray-800 rounded-full px-4 py-2 mt-4">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Search Devotionals"
                placeholderTextColor="#9CA3AF"
                className="ml-2 flex-1 text-gray-700"
              />
            </View>
          </View>
        }
      />
      )}
     <AuthGuardModal  visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
     <SubscriptionModal visible={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} />
    </SafeAreaView>
  );
}
