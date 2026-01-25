import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import imgThree from "../../../assets/images/onboarding/img-three.jpeg";
import { fetchMemories, Memory } from "../../../libs/memories";
import { fetchDevotionals, Devotional } from "../../../libs/devotional";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { canAccessPremiumContent, useGlobalContext } from '../../../utils/auth';
import AuthGuardModal from "@/components/AuthGuardModal";
import SubscriptionModal from "@/components/SubscriptionModal";

type MemoryItem = {
  id: number | string;
  verse_text: string;
  notes: string;
  date?: string;
};

interface MemoryCardProps {
  item: MemoryItem;
  index: number;
  cardWidth: number;
  onPress?: (item: MemoryItem) => void;
}

export function MemoryCard({
  item,
  index,
  cardWidth,
  onPress,
}: MemoryCardProps) {
  const bg = index % 2 === 0 ? "#374151" : "#1F2937";

  const stripHtml = (html: string) =>
    html
      ?.replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

  return (
    <TouchableOpacity
      style={{ width: cardWidth }}
      className="mr-4"
      activeOpacity={0.85}
      onPress={() => onPress?.(item)}
    >
      <View  style={{ backgroundColor: bg }}  className="rounded-3xl p-6 relative overflow-hidden" >
        <View className="absolute bottom-0 right-0 w-32 h-32 opacity-20">
          <Ionicons name="flower" size={128} color="#F97316" />
        </View>

        <Text className="text-slate-200 text-xs font-semibold mb-3">
          {item.verse_text}
        </Text>

        <Text className="text-slate-200 text-lg font-bold leading-6">
          {stripHtml(item.notes)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

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

export function DevotionCard({ item, index, onPress }: DevotionCardProps) {
  const formatDate = (date: Date | string) => {
    if (date instanceof Date) {
      return date.toDateString();
    }
    return new Date(date).toDateString();
  };

  return (
    <TouchableOpacity
      onPress={() => onPress?.(item)}
      className="mr-4 w-full"
      activeOpacity={0.8}
    >
      <View className="flex-row bg-slate-800 shadow rounded-lg justify-between p-3 mb-4">
        <View className="flex-1 pr-2">
          <Text className="text-white text-lg font-semibold  font-rubik-semibold mb-4">
            {item.title}
          </Text>
          <Text className="text-white font-semibold text-sm mb-1">
            {item.content.slice(0, 100)}...
          </Text>
          <Text className="text-slate-400 text-xs">
            {formatDate(item.date)}
          </Text>
        </View>
        <View className="rounded-lg overflow-hidden">
          <Image
            source={{ uri: item.image }}
            className="w-32 h-32 rounded-lg"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user } = useGlobalContext();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [quotesOfTheDay, setQuotesOfTheDay] = useState<Memory[]>([]);
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [loading, setLoading] = useState(true);
  const [devotionalsLoading, setDevotionalsLoading] = useState(true);
  const { width } = Dimensions.get("window");
  const memoryListRef = useRef<FlatList>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [name, setName] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  useEffect(() => {
    setName(user?.name || 'Anonymous User');
    setProfileImageUrl(user?.profile_image_url || '');
  }, [user]);

  // Auto-slide memory cards
  useEffect(() => {
    if (quotesOfTheDay.length === 0) return;

    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % quotesOfTheDay.length;

        memoryListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });

        return nextIndex;
      });
    }, 5000); // Auto-slide every 5 seconds

    return () => clearInterval(interval);
  }, [quotesOfTheDay.length]);

  useEffect(() => {
    const loadMemories = async () => {
      try {
        setLoading(true);
        const memories = await fetchMemories();
        setQuotesOfTheDay(memories);
      } catch (e) {
        console.log("Failed to load memories:", e);
      } finally {
        setLoading(false);
      }
    };

    const loadDevotionals = async () => {
      try {
        setDevotionalsLoading(true);
        const data = await fetchDevotionals();
        setDevotionals(data);
      } catch (e) {
        console.log("Failed to load devotionals:", e);
      } finally {
        setDevotionalsLoading(false);
      }
    };

    loadMemories();
    loadDevotionals();
  }, []);

    const handleDevotionalPress = async (devotion: DevotionItem) => {
      const accessStatus = await canAccessPremiumContent();
      
      if (!accessStatus.isAuthenticated) {
        console.log("User not authenticated, showing auth modal.");
        setShowAuthModal(true);
      } else if (!accessStatus.hasSubscription) {
        console.log("User not subscribed, showing subscription modal.");
        setShowSubscriptionModal(true);
      } else {
        // User is authenticated and has subscription, navigate to devotional detail
        router.push(`/devotional/${devotion.id}`);
      }
    };
  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar style="light" />

      {devotionalsLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FB923C" />
          <Text className="text-white/70 text-sm mt-4">
            Loading devotionals...
          </Text>
        </View>
      ) : (
        <FlatList
          data={devotionals}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <View className="px-6">
              <DevotionCard
                item={item}
                index={index}
                onPress={(devotion) => {
                  handleDevotionalPress(devotion);
                }}
              />
            </View>
          )}
          ListHeaderComponent={
            <>
              {/* Header */}
              <View className="px-6 pt-14 pb-6">
                <View className="flex-row items-center justify-between mb-6">
                  <View>
                    <Text className="text-white/70 text-sm">
                      Good {getTimeOfDay()}!
                    </Text>
                    <Text className="text-white text-2xl font-bold mt-1">
                      {name || 'Anonymous User'}
                    </Text>
                  </View>
                  <TouchableOpacity className="w-12 h-12 rounded-full bg-slate-800 items-center justify-center" onPress={() => router.push('/profile')}>
                    {user && profileImageUrl ? (
                       <Image source={{ uri: profileImageUrl }} className="w-12 h-12 rounded-full" />
                    ) : (
                      <Ionicons name="person-circle-outline" size={48} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* memory verse */}
                {loading ? (
                  <View className="items-center justify-center py-12 mb-6">
                    <ActivityIndicator size="large" color="#FB923C" />
                    <Text className="text-white/70 text-sm mt-4">
                      Loading memories...
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    ref={memoryListRef}
                    horizontal
                    data={quotesOfTheDay}
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="mb-6"
                    pagingEnabled
                    onScrollToIndexFailed={(info) => {
                      const wait = new Promise((resolve) =>
                        setTimeout(resolve, 500),
                      );
                      wait.then(() => {
                        memoryListRef.current?.scrollToIndex({
                          index: info.index,
                          animated: true,
                        });
                      });
                    }}
                    onMomentumScrollEnd={(event) => {
                      const index = Math.round(
                        event.nativeEvent.contentOffset.x / (width - 48),
                      );
                      setCurrentQuoteIndex(index);
                    }}
                    renderItem={({ item, index }) => (
                      <MemoryCard
                        item={item}
                        index={index}
                        cardWidth={width - 48}
                        onPress={(memory) => {
                          router.push(`memories/${memory.id}`);
                        }}
                      />
                    )}
                  />
                )}

                {/* Quote Indicators */}
                <View className="flex-row items-center justify-center mb-6">
                  {quotesOfTheDay.map((_, index) => (
                    <View
                      key={String(index)}
                      className={`h-2 rounded-full mx-1 ${
                        index === currentQuoteIndex
                          ? "w-6 bg-[#E94B7B]"
                          : "w-2 bg-slate-700"
                      }`}
                    />
                  ))}
                </View>

                {/* Search Bar */}
                <View className="bg-slate-800 rounded-2xl px-4 py-3 flex-row items-center mb-6">
                  <Ionicons name="search" size={20} color="#9CA3AF" />
                  <TextInput
                    placeholder="search for a spiritual topic"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 ml-3 text-white text-base"
                  />
                </View>
              </View>

              {/* Section Title */}
              <View className="px-6 mb-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white text-xl font-bold">
                    Today&apos;s Devotional
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/resources')}>
                    <Text className="text-[#E94B7B] text-sm font-semibold">
                      See all
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          }
          ListEmptyComponent={
            <View className="px-6 py-8 items-center">
              <Text className="text-white/70 text-sm">
                No devotionals available
              </Text>
            </View>
          }
          ListFooterComponent={
            <>
              {/* Message from CEO */}
              {/* <View className="px-6 mb-8">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-xl font-bold">
                    Message from CEO
                  </Text>
                  <TouchableOpacity>
                    <Text className="text-[#E94B7B] text-sm font-semibold">
                      See all
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  className="bg-slate-800 rounded-2xl overflow-hidden"
                  activeOpacity={0.8}
                >
                  <ImageBackground
                    source={imgThree}
                    className="w-full h-40"
                    resizeMode="cover"
                  >
                    <View className="absolute bottom-0 right-0 left-0 rounded-full p-2">
                      <LinearGradient
                        colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
                        className="px-3 py-1 rounded-full self-start"
                      >
                        <Text className="text-white text-base font-bold">
                          Weekly Inspiration & Guidance
                        </Text>
                        <Text className="text-white/80 text-xs mt-1">
                          A message of hope and direction
                        </Text>
                      </LinearGradient>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              </View> */}

              {/* Bottom Spacing for Tab Bar */}
              <View className="h-20" />
            </>
          }
        />
      )}
      <AuthGuardModal  visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <SubscriptionModal visible={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} />
    </SafeAreaView>
  );
}
