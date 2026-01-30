import AuthGuardModal from '@/components/AuthGuardModal';
import SubscriptionModal from '@/components/SubscriptionModal';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Devotional, fetchDevotionals, fetchTodaysDevotional } from "../../../libs/devotional";
import { canAccessPremiumContent } from '../../../utils/auth';
import TopNav from '@/components/topNav';
import { LinearGradient } from 'expo-linear-gradient';

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
    <TouchableOpacity  
      onPress={() => onPress?.(item)} 
      className="max-w-[25rem] bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8"
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.image }} className="w-full h-48" resizeMode="cover" />
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
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [todaysDevotional, setTodaysDevotional] = useState<Devotional | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadDevotionals = async () => {
      try {
        setIsLoading(true);
        
        // Fetch today's devotional
        const todayData = await fetchTodaysDevotional();
        setTodaysDevotional(todayData);
        
        // Fetch all devotionals (today + previous)
        const allData = await fetchDevotionals();
        
        // Filter out today's devotional from the list to avoid duplication
        const previousDevotionals = todayData 
          ? allData.filter(d => d.id !== todayData.id)
          : allData;
        
        setDevotionals(previousDevotionals);
      } catch (e) {
        console.log("Failed to load devotionals:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadDevotionals();
  }, []);

  const handleDevotionalPress = async (devotion: DevotionItem) => {
    const accessStatus = await canAccessPremiumContent();
    
    if (!accessStatus.isAuthenticated) {
      setShowAuthModal(true);
    } else if (!accessStatus.hasSubscription) {
      setShowSubscriptionModal(true);
    } else {
      router.push(`/devotional/${devotion.id}`);
    }
  };

  return (
    <SafeAreaView className="bg-gray-900 h-screen">
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
          renderItem={({ item, index }) => (
            <DevotionCard 
              item={item}  
              index={index}
              onPress={(devotion) => {
                handleDevotionalPress(devotion);
              }}
            />
          )}
          ListHeaderComponent={
            <View className="mb-4">
              {/* Search */}
              <View className="flex-row items-center bg-gray-800 rounded-full px-4 py-2 mt-4 mb-6">
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                  placeholder="Search Devotionals"
                  placeholderTextColor="#9CA3AF"
                  className="ml-2 flex-1 text-white"
                />
              </View>

              {/* Today's Devotional - Featured */}
              <View className="mb-6">
                <Text className="text-white text-xl font-bold mb-4">
                  Today&apos;s Devotional
                </Text>
                
                {todaysDevotional ? (
                  <TouchableOpacity
                    onPress={() => handleDevotionalPress(todaysDevotional)}
                    className="rounded-2xl overflow-hidden mb-6 bg-gray-800"
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: todaysDevotional.image }}
                      className="w-full h-64"
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.9)']}
                      className="absolute bottom-0 left-0 right-0 p-5"
                    >
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="calendar" size={16} color="#E94B7B" />
                        <Text className="text-gray-300 text-xs ml-2 font-semibold">
                          {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                      <Text className="text-white text-2xl font-bold uppercase mb-2">
                        {todaysDevotional.title}
                      </Text>
                      <Text className="text-gray-300 text-sm leading-6">
                        {formatContent(todaysDevotional.content.slice(0, 120))}...
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View className="bg-gray-800 rounded-2xl p-8 items-center mb-6">
                    <Ionicons name="calendar-outline" size={56} color="#9CA3AF" />
                    <Text className="text-gray-400 text-base mt-4 text-center">
                      No devotional available for today
                    </Text>
                    <Text className="text-gray-500 text-sm mt-2 text-center">
                      Check back tomorrow for new content
                    </Text>
                  </View>
                )}
              </View>

              {/* Previous Devotionals Header */}
              <View className="mb-4">
                <Text className="text-white text-xl font-bold">
                  Previous Devotionals
                </Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Browse past daily devotionals
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="py-12 items-center">
              <Ionicons name="book-outline" size={56} color="#9CA3AF" />
              <Text className="text-gray-400 text-base mt-4">
                No previous devotionals available
              </Text>
            </View>
          }
        />
      )}
      <AuthGuardModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <SubscriptionModal visible={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} />
    </SafeAreaView>
  );
}