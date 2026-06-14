import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Keyboard,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import book from "@/assets/images/devotion.jpg";
import images from "@/constants/images";
import { fetchMemories, Memory } from "../../../libs/memories";
import { fetchDevotionals, Devotional, fetchTodaysDevotional } from "../../../libs/devotional";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { canAccessPremiumContent, useGlobalContext } from '../../../utils/auth';
import AuthGuardModal from "@/components/AuthGuardModal";
import SubscriptionModal from "@/components/SubscriptionModal";
import * as SecureStore from 'expo-secure-store';
import { logger } from "../../../utils/logger";
import { formatDateShort } from "../../../utils/date";

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
      <View style={{ backgroundColor: bg }} className="rounded-3xl p-6 relative overflow-hidden" >
        <View className="absolute bottom-0 right-0 w-32 h-32 opacity-20">
          <Ionicons name="flower" size={128} color="#F97316" />
        </View>

        <Text className="text-slate-200 text-2xl font-bold mb-3 capitalize tracking-tight leading-8">
          {item.verse_text}
        </Text>

        <Text className="text-slate-200 text-lg font-bold leading-6">
          {stripHtml(item.notes)}
        </Text>
      </View>
    </TouchableOpacity>
  );
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
            {formatContent(item.content.slice(0, 100))}...
          </Text>
          <Text className="text-slate-400 text-xs">
            {formatDateShort(item.date)}
          </Text>
        </View>
        <View style={{ overflow: 'visible' }}>
          <Image
            source={item.image ? { uri: item.image } : book}
            className="w-32 h-32 rounded-lg"
            resizeMode="contain"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user } = useGlobalContext();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [quotesOfTheDay, setQuotesOfTheDay] = useState < Memory[] > ([]);
  const [devotionals, setDevotionals] = useState < Devotional[] > ([]);
  const [loading, setLoading] = useState(true);
  const [devotionalsLoading, setDevotionalsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = Dimensions.get("window");
  const memoryListRef = useRef < FlatList > (null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [name, setName] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [todaysDevotional, setTodaysDevotional] = useState < Devotional | null > (null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDevotionals = useMemo(() => {
    if (!searchQuery.trim()) return devotionals;
    const query = searchQuery.toLowerCase().trim();
    return devotionals.filter(
      (d) => d.title?.toLowerCase().includes(query)
        || d.content?.toLowerCase().includes(query)
        || d.verses?.toLowerCase().includes(query)
        || d.key_verse?.toLowerCase().includes(query)
    );
  }, [devotionals, searchQuery]);
  const isSearching = searchQuery.trim().length > 0;

 const getTimeOfDay = (timeZone = 'Africa/Lagos') => {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone,
    }).format(new Date())
  );

  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
};

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const greeting = getTimeOfDay(userTimeZone);

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

  const loadMemories = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const memories = await fetchMemories();
      setQuotesOfTheDay(memories);
    } catch (e) {
      // logger.error("Failed to load memories:", e);
    } finally {
      if (!isRefreshing) setLoading(false);
    }
  };

  const loadDevotionals = async (isRefreshing = false, pageNumber = 1) => {
    try {
      if (isRefreshing) {
        setPage(1);
        setHasMore(true);
      } else if (pageNumber > 1) {
        setLoadingMore(true);
      } else {
        setDevotionalsLoading(true);
      }

      let todayToFilter = todaysDevotional;
      // Fetch today's devotional only on the first page load/refresh
      if (pageNumber === 1) {
        const todayData = await fetchTodaysDevotional();
        setTodaysDevotional(todayData);
        todayToFilter = todayData;
      }

      // Fetch devotionals for the specific page
      const response = await fetchDevotionals(pageNumber, 10);
      const allData = response.data;

      // Check if we've reached the end (Laravel pagination meta)
      if (response?.meta && response.meta.current_page >= response.meta.last_page) {
        setHasMore(false);
      }

      // Filter out today's devotional to avoid duplication
      const filteredNewData = todayToFilter
        ? allData.filter(d => d.id !== todayToFilter.id)
        : allData;

      setDevotionals(prev =>
        pageNumber === 1 ? filteredNewData : [...prev, ...filteredNewData]
      );

    } catch (e) {
    } finally {
      setDevotionalsLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !searchQuery.trim()) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadDevotionals(false, nextPage);
    }
  };

  useEffect(() => {
    loadMemories();
    loadDevotionals();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadMemories(true),
        loadDevotionals(true)
      ]);
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleDevotionalPress = async (devotion: DevotionItem) => {
    const accessStatus = await canAccessPremiumContent(devotion.date);

    if (!accessStatus.isAuthenticated) {
      // logger.info("User not authenticated, showing auth modal.");
      setShowAuthModal(true);
    } else if (!accessStatus.canAccess) {
      // logger.info("User not subscribed, showing subscription modal.");
      setShowSubscriptionModal(true);
    } else {
      // User is authenticated and has subscription or access to past content, navigate to devotional detail
      router.push(`/devotional/${devotion.id}`);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar style="light" />

      {devotionalsLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E94B7B" />
          <Text className="text-white/70 text-sm mt-4">
            Loading ...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDevotionals}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E94B7B"
              colors={["#E94B7B"]}
            />
          }
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
              <View className={`px-6 pt-14 ${isSearching ? "pb-2" : "pb-6"}`}>
                <View className="flex-row items-center justify-between mb-6">
                  <View>
                    <Text className="text-white/70 text-sm">
                      Good {greeting}!
                    </Text>
                    <Text className="text-white text-2xl font-bold mt-1">
                      {name.split(' ')[0] || 'Anonymous User'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    className="w-12 h-12 rounded-full bg-slate-800 items-center justify-center"
                    onPress={() => router.push('/profile')}
                  >
                    {user && profileImageUrl ? (
                      <Image source={{ uri: profileImageUrl }} className="w-12 h-12 rounded-full" />
                    ) : (
                      <Ionicons name="person-circle-outline" size={48} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Memory Verses Section */}
                {loading ? (
                  <View className="items-center justify-center py-12 mb-6">
                    <ActivityIndicator size="large" color="#E94B7B" />
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
                    keyboardShouldPersistTaps="handled"
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
                {quotesOfTheDay.length > 0 && (
                  <View className="flex-row items-center justify-center mb-6">
                    {quotesOfTheDay.map((_, index) => (
                      <View
                        key={String(index)}
                        className={`h-2 rounded-full mx-1 ${index === currentQuoteIndex
                          ? "w-6 bg-[#E94B7B]"
                          : "w-2 bg-slate-700"
                          }`}
                      />
                    ))}
                  </View>
                )}

                {/* Search Bar */}
                <View className={`bg-slate-800 rounded-2xl px-4 py-3 flex-row items-center ${isSearching ? "mb-2" : "mb-6"}`}>
                  <Ionicons name="search" size={20} color="#9CA3AF" />
                  <TextInput
                    placeholder="Search within devotion"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 ml-2 text-white text-[12px] tracking-tighter p-3"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                    autoCorrect={false}
                    autoCapitalize="none"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => { setSearchQuery(''); Keyboard.dismiss(); }}>
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {!isSearching && (
                <>
                  {/* TODAY'S DEVOTIONAL SECTION - Featured (OUTSIDE the header View) */}
                  <View className="px-6 mb-4">
                    <Text className="text-white text-xl font-bold mb-4">
                      Today&apos;s Devotional
                    </Text>

                    {todaysDevotional ? (
                      <TouchableOpacity
                        onPress={() => handleDevotionalPress(todaysDevotional)}
                        className="rounded-2xl mb-6"
                        activeOpacity={0.8}
                      >
                        <Image
                          source={todaysDevotional.image ? { uri: todaysDevotional.image } : book}
                          className="w-full h-56 rounded-2xl bg-white"
                          resizeMode="contain"
                        /> 
                        <LinearGradient
                          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                          className="absolute bottom-0 left-0 right-0 p-4 rounded-b-2xl"
                        >
                          <View className="flex-row items-center mb-2">
                            <Ionicons name="calendar" size={16} color="#FFF" />
                            <Text className="text-white/90 text-xs ml-2">
                              {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </Text>
                          </View>
                          <Text className="text-white text-2xl font-bold mb-2">
                            {todaysDevotional.title}
                          </Text>
                          <Text className="text-white/90 text-sm leading-6">
                            {formatContent(todaysDevotional.content.slice(0, 100))}...
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (
                      <View className="bg-slate-800 rounded-2xl p-6 items-center mb-6">
                        <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                        <Text className="text-white/70 text-sm mt-4">
                          No devotional available for today
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* PREVIOUS DEVOTIONALS Section Header */}
                  <View className="px-6 mb-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-white text-xl font-bold">
                        Previous Devotionals
                      </Text>
                      <TouchableOpacity onPress={() => router.push('/resources')}>
                        <View className="flex-row items-center">
                          <Text className="text-[#E94B7B] text-sm font-semibold mr-1">
                            See all
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color="#E94B7B" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </>
          }
          ListEmptyComponent={
            <View className="px-6 py-8 items-center">
              <Ionicons name="search-outline" size={40} color="#9CA3AF" />
              <Text className="text-white/70 text-sm mt-3">
                {searchQuery.trim()
                  ? `No devotionals found for "${searchQuery}"`
                  : 'No previous devotionals available'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="py-6">
                <ActivityIndicator color="#E94B7B" />
              </View>
            ) : (
              <View className="h-20" />
            )
          }
        />
      )}
      <AuthGuardModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <SubscriptionModal visible={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} />
    </SafeAreaView>
  );
}
