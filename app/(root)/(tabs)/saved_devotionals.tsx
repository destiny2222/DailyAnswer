import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import TopNav from '@/components/topNav';
import { detailDevotional, Devotional } from '../../../libs/devotional';
import { DevotionCard } from './resources';

export default function SavedDevotionalsScreen() {
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSavedDevotionals();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSavedDevotionals();
    }, [])
  );

  const loadSavedDevotionals = async () => {
    try {
      setIsLoading(true);
      const saved = await SecureStore.getItemAsync('saved_devotional_ids');
      if (!saved) {
        setDevotionals([]);
        return;
      }
      
      const parsedIds = JSON.parse(saved);
      if (!Array.isArray(parsedIds) || parsedIds.length === 0) {
        setDevotionals([]);
        return;
      }

      // Fetch all details concurrently
      const promises = parsedIds.map(id => detailDevotional(String(id)).catch(() => null));
      const results = await Promise.all(promises);
      const validDevotionals = results.filter(d => d !== null) as Devotional[];
      
      setDevotionals(validDevotionals);
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevotionalPress = (devotion: any) => {
    router.push(`/devotional/${devotion.id}`);
  };

  return (
    <SafeAreaView className="bg-gray-900 h-screen pt-5">
      <StatusBar style="light" />
      <TopNav title="Saved Devotionals" />
      
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#E94B7B" />
          <Text className="text-gray-500 mt-4">Loading saved devotionals...</Text>
        </View>
      ) : (
        <FlatList
          className="flex-1"
          data={devotionals}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16, paddingTop: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E94B7B"
              colors={["#E94B7B"]}
            />
          }
          renderItem={({ item, index }) => (
            <DevotionCard
              item={item as any}
              index={index}
              onPress={handleDevotionalPress}
            />
          )}
          ListEmptyComponent={
            <View className="py-12 items-center">
              <Ionicons name="bookmark-outline" size={56} color="#9CA3AF" />
              <Text className="text-gray-400 text-base mt-4 text-center">
                No saved devotionals yet.
              </Text>
              <Text className="text-gray-500 text-sm mt-2 text-center px-8">
                Tap the save icon on any devotional to save it here for quick access!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
