import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Share,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { detailDevotional } from '../../libs/devotional';

const DevotionalDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  useEffect(() => {
    loadDevotional();
  }, [id]);

  const loadDevotional = async () => {
    try {
      setLoading(true);
      const data = await detailDevotional(id as string);
      // console.log('Devotional loaded:', data);
      setDevotional(data);
    } catch (error) {
      // console.error('Error loading devotional:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    if (date instanceof Date) {
      return date.toLocaleDateString('en-US', options);
    }
    return new Date(date).toLocaleDateString('en-US', options);
  };

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

  const handleShare = async () => {
    if (!devotional) return;
    try {
      await Share.share({
        message: `${devotional.title}\n\n${formatContent(devotional.content)}\n\n${devotional.key_verse}`,
      });
    } catch (error) {
      // console.error('Error sharing:', error);
    }
  };

  const handlePlayPause = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      if (!devotional) return;
      
      const textToSpeak = `${devotional.title}. Key Verse: ${devotional.key_verse}. 
      ${formatContent(devotional.content)}. ${devotional.application_note}. Memory Verse: ${devotional.verse}. Prayer note: ${devotional.prayer_note}.`;
      
      setIsSpeaking(true);
      Speech.speak(textToSpeak, {
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#E94B7B" />
        <Text className="text-gray-500 mt-4">Loading devotional...</Text>
      </SafeAreaView>
    );
  }

  if (!devotional) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Ionicons name="alert-circle-outline" size={64} color="#999" />
        <Text className="text-gray-500 text-lg mt-4">Devotional not found</Text>
        <TouchableOpacity
          className="mt-4 bg-[#E94B7B] px-6 py-3 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={32} color="#333" />
        </TouchableOpacity>
        <View className="flex-row space-x-4 gap-1">
          <TouchableOpacity className='bg-gray-400 p-3 rounded-2xl' onPress={() => setShowFormatMenu(true)}>
            <Ionicons name="text" size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity className='bg-gray-400 p-3 rounded-2xl' onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity className='bg-gray-400 p-3 rounded-2xl' onPress={handlePlayPause}>
            <Ionicons 
              name={isSpeaking ? "pause-circle" : "play-circle"} 
              size={20} 
              color="#E94B7B" 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <Image
          source={{ uri: devotional.image }}
          className="w-full h-64"
          resizeMode="cover"
        />

        {/* Content */}
        <View className="bg-white rounded-t-3xl -mt-6 pt-6 px-6">
          {/* Date */}
          <Text className='text-lg font-rubik-medium font-medium'>{devotional.subheading}</Text>
          <View className="flex-row items-center mb-4">
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text className="text-gray-600 text-sm ml-2">
              {formatDate(devotional.date)}
            </Text>
          </View>

          {/* Title */}
          <Text className="text-3xl font-rubik-semibold py-5 text-gray-900 mb-4">
            {devotional.title}
          </Text>

          {/* Author */}
          {devotional.author && (
            <View className="flex-row items-center mb-6 pb-6 border-b border-gray-200">
              <View className="bg-pink-100 rounded-full p-2 mr-3">
                <Ionicons name="person" size={16} color="#E94B7B" />
              </View>
              <Text className="text-gray-700 font-rubik-semibold ">
                By {devotional.author}
              </Text>
            </View>
          )}

          {/* Key Verse */}
          {devotional.key_verse && (
            <View className="bg-pink-50 rounded-xl p-4 mb-6">
              <View className="flex-row items-center mb-2">
                <Ionicons name="bookmark" size={18} color="#E94B7B" />
                <Text className="text-sm font-bold text-[#E94B7B] ml-2">
                  Key Verse
                </Text>
              </View>
              <Text className="text-gray-800 text-base leading-7 italic font-rubik-semibold font-semibold">
                {devotional.key_verse}
              </Text>
            </View>
          )}

          {/* Main Content */}
          <View className="mb-8">
            <Text 
              style={{  
                fontSize, 
                fontWeight: isBold ? 'bold' : 'normal',
                lineHeight: fontSize * 1.4,
                color: '#1F2937', 
                textAlign: 'justify' 
              }}
              className="font-rubik-medium"
            >
              {formatContent(devotional.content)}
            </Text>
          </View>
          <View className="bg-blue-50 rounded-xl p-4 mb-6">
            <Text className="text-gray-700 text-base font-rubik-semibold font-semibold">
              {formatContent(devotional.application_note)}
            </Text>
          </View>
          {/* Related Verses */}
          {devotional.verses && (
            <View className="bg-blue-50 rounded-xl p-4 mb-6">
              <View className="flex-row items-center mb-2">
                <Ionicons name="book-outline" size={18} color="#3B82F6" />
                <Text className="text-sm font-bold text-blue-700 ml-2">
                  Scripture References
                </Text>
              </View>
              <Text className="text-gray-700 text-base font-rubik-semibold font-semibold">
                {formatContent(devotional.verses)}
              </Text>
            </View>
          )}
          <View className="bg-blue-50 rounded-xl p-4 mb-6">
            <Text className="text-gray-700 text-base font-rubik-semibold font-semibold">
              {formatContent(devotional.prayer_note)}
            </Text>
          </View>
          {/* Action Buttons */}
          <View className="flex-row space-x-3 mb-8 ">
            <TouchableOpacity  className="flex-1 flex-row items-center justify-center bg-[#E94B7B] py-4 rounded-full"
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social" size={20} color="#FFF" />
              <Text className="text-white font-semibold ml-2">Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-gray-200 py-4 rounded-full"
              onPress={() => {}}
              activeOpacity={0.8}
            >
              <Ionicons name="bookmark-outline" size={20} color="#333" />
              <Text className="text-gray-800 font-semibold ml-2">Save</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <View className="bg-gray-100 rounded-xl p-4 mb-6">
            <Text className="text-gray-600 text-xs text-center">
              Published on {formatDate(devotional.date)}
            </Text>
            {devotional.published_by && (
              <Text className="text-gray-500 text-xs text-center mt-1">
                Published by {devotional.published_by}
              </Text>
            )}
          </View>
          
        </View>
      </ScrollView>

      {/* Formatting Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFormatMenu}
        onRequestClose={() => setShowFormatMenu(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPressOut={() => setShowFormatMenu(false)}
        >
          <View className="absolute bottom-0 w-full bg-white rounded-t-2xl p-6 shadow-lg">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">
                Format Text
              </Text>
              <TouchableOpacity onPress={() => setShowFormatMenu(false)}>
                <Ionicons name="close-circle" size={32} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Bold Toggle */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-lg text-gray-700">Bold Text</Text>
              <Switch
                value={isBold}
                onValueChange={setIsBold}
                trackColor={{ false: '#E5E7EB', true: '#FBCFE8' }}
                thumbColor={isBold ? '#E94B7B' : '#f4f3f4'}
              />
            </View>

            {/* Font Size Control */}
            <View>
              <Text className="text-lg text-gray-700 mb-4">Font Size</Text>
              <View className="flex-row items-center justify-center space-x-6">
                <TouchableOpacity
                  onPress={() => setFontSize(Math.max(12, fontSize - 2))}
                  className="bg-gray-100 rounded-full w-12 h-12 items-center justify-center"
                >
                  <Ionicons name="remove" size={28} color="#4B5563" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-gray-800 w-16 text-center">
                  {fontSize}
                </Text>
                <TouchableOpacity
                  onPress={() => setFontSize(Math.min(32, fontSize + 2))}
                  className="bg-gray-100 rounded-full w-12 h-12 items-center justify-center"
                >
                  <Ionicons name="add" size={28} color="#4B5563" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default DevotionalDetail;