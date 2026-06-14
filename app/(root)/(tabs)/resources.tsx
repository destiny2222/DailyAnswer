import book from "@/assets/images/devotion.jpg";
import images from "@/constants/images";
import AuthGuardModal from '@/components/AuthGuardModal';
import SubscriptionModal from '@/components/SubscriptionModal';
import TopNav from '@/components/topNav';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Keyboard, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Devotional, fetchDevotionals, fetchTodaysDevotional } from "../../../libs/devotional";
import { canAccessPremiumContent } from '../../../utils/auth';
import { formatDateShort } from "../../../utils/date";

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


  return (
    <TouchableOpacity
      onPress={() => onPress?.(item)}
      className="max-w-[25rem] bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8"
      activeOpacity={0.8}
    >
      <Image
        source={item.image ? { uri: item.image } : book}
        className="w-full h-48 bg-white"
        resizeMode="contain"
      />
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-gray-500 text-xs">
            {formatDateShort(item.date)}
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
  const [todaysDevotional, setTodaysDevotional] = useState < Devotional | null > (null);
  const [isLoading, setIsLoading] = useState < boolean > (false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const router = useRouter();

  const loadDevotionals = async (pageNumber = 1, shouldAppend = false) => {
    try {
      if (shouldAppend) {
        setIsFetchingMore(true);
      } else {
        setIsLoading(true);
        setHasMore(true); // Reset this on a fresh load
      }

      let todayToFilter = todaysDevotional;
      if (pageNumber === 1) {
        const todayData = await fetchTodaysDevotional();
        setTodaysDevotional(todayData);
        todayToFilter = todayData;
      }

      const { data: allData, meta } = await fetchDevotionals(pageNumber, 10);

      if (meta?.total) setTotal(meta.total);

      // Filter out today's devotional to avoid showing it in both sections
      const filteredNewData = todayToFilter
        ? allData.filter(d => d.id !== todayToFilter.id)
        : allData;

      setDevotionals(prev => {
        return pageNumber === 1 ? filteredNewData : [...prev, ...filteredNewData];
      });

      // Check if we are at the last page
      const hasNextPage = meta ? meta.current_page < meta.last_page : false;
      setHasMore(hasNextPage);
      setPage(pageNumber);

    } catch (e) {
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setRefreshing(false);
    }
  };


  const handleRefresh = () => {
    setRefreshing(true);
    loadDevotionals(1, false);
  };

  useEffect(() => {
    loadDevotionals(1, false);
  }, []);

  const filteredDevotionals = useMemo(() => {
    if (!searchQuery.trim()) return devotionals;
    const query = searchQuery.toLowerCase().trim();

    return devotionals.filter((d) =>
      d.title?.toLowerCase().includes(query)
    );
  }, [devotionals, searchQuery]);
  const isSearching = searchQuery.trim().length > 0;

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore && !searchQuery.trim()) {
      loadDevotionals(page + 1, true);
    }
  };

  const handleDevotionalPress = async (devotion: DevotionItem) => {
    const accessStatus = await canAccessPremiumContent(devotion.date);

    if (!accessStatus.isAuthenticated) {
      setShowAuthModal(true);
    } else if (!accessStatus.canAccess) {
      setShowSubscriptionModal(true);
    } else {
      router.push(`/devotional/${devotion.id}`);
    }
  };

  return (
    <SafeAreaView className="bg-gray-900 h-screen pt-5">
      <StatusBar style="light" />
      <TopNav title="Devotional" />
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#E94B7B" />
          <Text className="text-gray-500">Loading Devotionals...</Text>
        </View>
      ) : (
        <FlatList
          className="flex-1"
          data={filteredDevotionals}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#E94B7B"
            />
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          renderItem={({ item, index }) => (
            <DevotionCard
              item={item}
              index={index}
              onPress={handleDevotionalPress}
            />
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingMore ? (
              <View className="py-6">
                <ActivityIndicator size="small" color="#E94B7B" />
              </View>
            ) : (
              <View className="h-20" />
            )
          }
          ListHeaderComponent={
            <View className={isSearching ? "mb-1" : "mb-4"}>
              {/* Search */}
              <View className={`flex-row items-center bg-gray-800 rounded-full px-4 py-2 mt-4 ${isSearching ? "mb-3" : "mb-6"}`}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                  placeholder="Search Devotionals"
                  placeholderTextColor="#9CA3AF"
                  className="ml-2 flex-1 text-white"
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

              {!isSearching && (
                <>
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-white text-xl font-bold">
                      Today&apos;s Devotional
                    </Text>
                    {total > 0 && (
                      <Text className="text-gray-400 text-sm">
                        {total} Total
                      </Text>
                    )}
                  </View>

                  {todaysDevotional ? (
                    <TouchableOpacity
                      onPress={() => handleDevotionalPress(todaysDevotional)}
                      className="rounded-2xl mb-6"
                      activeOpacity={0.8}
                    >
                      <Image
                        source={todaysDevotional.image ? { uri: todaysDevotional.image } : book}
                        className="w-full h-64 rounded-2xl bg-white"
                        resizeMode="contain"
                      /> 
                      <LinearGradient
                        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.9)']}
                        className="absolute bottom-0 left-0 right-0 p-5 rounded-b-2xl"
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

                  {/* Previous Devotionals Header */}
                  <View className="mb-4">
                    <Text className="text-white text-xl font-bold">
                      Previous Devotionals
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">
                      Browse previous daily devotionals
                    </Text>
                  </View>
                </>
              )}
            </View>
          }
          ListEmptyComponent={
            <View className="py-12 items-center">
              <Ionicons name="book-outline" size={56} color="#9CA3AF" />
              <Text className="text-gray-400 text-base mt-4 text-center">
                {isSearching
                  ? `No devotionals found for "${searchQuery}"`
                  : 'No previous devotionals available'}
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
