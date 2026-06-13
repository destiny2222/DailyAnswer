import book from '@/assets/images/devotion.jpg';
import { formatDateLong } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { detailDevotional } from '../../libs/devotional';

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

const preprocessForSpeech = (text: string) => {
  if (!text) return '';
  return text
    // Replace colons in scripture references (e.g., 34:19 or 34 : 19) with a space and "verse"
    // We add spaces around it to ensure the TTS engine treats it as a word, not a time
    .replace(/(\d+)\s*:\s*(\d+)/g, '$1 verse $2')
    // Ensure small pauses after commas and periods
    .replace(/,/g, ', ')
    .replace(/\./g, '. ')
    // Clean up multiple spaces
    .replace(/\s\s+/g, ' ')
    .trim();
};

const DevotionalDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [devotional, setDevotional] = useState < Devotional | null > (null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  // Audio state management
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const chunksRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    loadDevotional();
    setupAudio();

    return () => {
      // Cleanup speech when component unmounts
      Speech.stop();
      isSpeakingRef.current = false;
    };
  }, [id]);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {

    }
  };

  const loadDevotional = async () => {
    try {
      setLoading(true);
      const data = await detailDevotional(id as string);
      setDevotional(data);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };




  const handleShare = async () => {
    if (!devotional) return;
    try {
      await Share.share({
        message: `${devotional.title}\n\n${formatContent(devotional.content)}\n\n${devotional.key_verse}`,
      });
    } catch (error) {

    }
  };

  const getFullTextChunks = () => {
    if (!devotional) return [];

    const rawParts = [
      devotional.title,
      devotional.subheading,
      devotional.key_verse ? `Key Verse: ${devotional.key_verse}` : null,
      formatContent(devotional.content),
      devotional.application_note ? `Application: ${formatContent(devotional.application_note)}` : null,
      devotional.verses ? `Scripture References: ${formatContent(devotional.verses)}` : null,
      devotional.prayer_note ? `Prayer: ${formatContent(devotional.prayer_note)}` : null,
    ].filter(Boolean) as string[];

    const chunks: string[] = [];
    rawParts.forEach(part => {
      const processed = preprocessForSpeech(part);
      // Split by paragraph first, then by sentence if still too long
      const paragraphs = processed.split(/\n\n+/);
      
      paragraphs.forEach(p => {
        const trimmedP = p.trim();
        if (trimmedP) {
          if (trimmedP.length > 500) {
            const sentences = trimmedP.split(/(?<=[.!?])\s+/);
            sentences.forEach(s => {
              const trimmedS = s.trim();
              if (trimmedS) chunks.push(trimmedS);
            });
          } else {
            chunks.push(trimmedP);
          }
        }
      });
    });

    return chunks;
  };

  const speakChunk = (index: number) => {
    if (index >= chunksRef.current.length) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      return;
    }

    setCurrentChunkIndex(index);
    
    Speech.speak(chunksRef.current[index], {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
      onStart: () => {
        setIsSpeaking(true);
        isSpeakingRef.current = true;
      },
      onDone: () => {
        if (isSpeakingRef.current && !isPausedRef.current) {
          speakChunk(index + 1);
        }
      },
      onError: (err) => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      }
    });
  };

  const handlePlayPause = async () => {
    if (!devotional) return;

    if (isSpeaking && !isPaused) {
      if (Platform.OS === 'android') {
        Speech.stop();
      } else {
        Speech.pause();
      }
      setIsPaused(true);
      isPausedRef.current = true;
    } else if (isSpeaking && isPaused) {
      if (Platform.OS === 'android') {
        speakChunk(currentChunkIndex);
      } else {
        Speech.resume();
      }
      setIsPaused(false);
      isPausedRef.current = false;
    } else {
      // Start fresh
      Speech.stop();
      const newChunks = getFullTextChunks();
      chunksRef.current = newChunks;
      isSpeakingRef.current = true;
      isPausedRef.current = false;
      setIsPaused(false);
      speakChunk(0);
    }
  };

  const handleStop = () => {
    Speech.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    isSpeakingRef.current = false;
    isPausedRef.current = false;
    setCurrentChunkIndex(0);
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
      <StatusBar style="dark" />
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => {
          Speech.stop();
          router.back();
        }}>
          <Ionicons name="arrow-back" size={32} color="#333" />
        </TouchableOpacity>
        <View className="flex-row space-x-4 gap-1">
          {/* Play/Pause Button - NOW VISIBLE */}
          <TouchableOpacity
            className='bg-[#E94B7B] p-3 rounded-2xl'
            onPress={handlePlayPause}
          >
            <Ionicons
              name={isSpeaking && !isPaused ? "pause" : "play"}
              size={20}
              color="#FFF"
            />
          </TouchableOpacity>

          {/* Stop Button - Shows when playing */}
          {isSpeaking && (
            <TouchableOpacity
              className='bg-gray-600 p-3 rounded-2xl'
              onPress={handleStop}
            >
              <Ionicons name="stop" size={20} color="#FFF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className='bg-gray-400 p-3 rounded-2xl'
            onPress={() => setShowFormatMenu(true)}
          >
            <Ionicons name="text" size={20} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity
            className='bg-gray-400 p-3 rounded-2xl'
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <Image
          source={devotional.image ? { uri: devotional.image } : book}
          className="w-full h-64 bg-white"
          resizeMode="contain"
        />

        {/* Content */}
        <View className="bg-white rounded-t-3xl pt-6 px-6">
          {/* Date */}
          {devotional.subheading && (
            <Text className='text-lg font-rubik-medium font-medium mb-2'>
            {devotional.subheading ? String(devotional.subheading) : ''}
            </Text>
          )}
          <View className="flex-row items-center mb-4">
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text className="text-gray-600 text-sm ml-2">
              {formatDateLong(devotional.date)}
            </Text>
          </View>

          {/* Title */}
          <Text className="text-3xl font-rubik-semibold py-5 text-gray-900 mb-4">
            {devotional.title ? String(devotional.title) : ''}
          </Text>

          {/* Author */}
          {devotional.author && (
            <View className="flex-row items-center mb-6 pb-6 border-b border-gray-200">
              <View className="bg-pink-100 rounded-full p-2 mr-3">
                <Ionicons name="person" size={16} color="#E94B7B" />
              </View>
              <Text className="text-gray-700 font-rubik-semibold">
              By {String(devotional.author)}
              </Text>
            </View>
          )}

          {/* Audio Player Card - Alternative prominent position */}
          <TouchableOpacity
            onPress={handlePlayPause}
            className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 mb-6 border border-pink-200"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="bg-[#E94B7B] rounded-full p-3 mr-3">
                  <Ionicons
                    name={isSpeaking && !isPaused ? "pause" : "play"}
                    size={24}
                    color="#FFF"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-bold text-base">
                    {isSpeaking && !isPaused ? 'Listening Mode' : isPaused ? 'Paused' : 'Listen to Devotional'}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {isSpeaking && !isPaused ? 'Tap to pause' : isPaused ? 'Tap to resume' : 'Tap to start audio'}
                  </Text>
                </View>
              </View>
              {isSpeaking && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleStop();
                  }}
                  className="bg-gray-200 rounded-full p-2"
                >
                  <Ionicons name="stop" size={20} color="#333" />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>

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
                {String(devotional.key_verse)}
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
              {String(formatContent(devotional.content))}
            </Text>
          </View>

          {devotional.application_note && (
            <View className="bg-blue-50 rounded-xl p-4 mb-6">
              <View className="flex-row items-center mb-2">
                <Ionicons name="bulb-outline" size={18} color="#3B82F6" />
                <Text className="text-sm font-bold text-blue-700 ml-2">
                  Application
                </Text>
              </View>
              <Text className="text-gray-700 text-base font-rubik-semibold font-semibold">
                {String(formatContent(devotional.application_note))}
              </Text>
            </View>
          )}

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
                {String(formatContent(devotional.verses))}
              </Text>
            </View>
          )}

          {devotional.prayer_note && (
            <View className="bg-purple-50 rounded-xl p-4 mb-6">
              <View className="flex-row items-center mb-2">
                <Ionicons name="hand-right-outline" size={18} color="#9333EA" />
                <Text className="text-sm font-bold text-purple-700 ml-2">
                  Prayer
                </Text>
              </View>
              <Text className="text-gray-700 text-base font-rubik-semibold font-semibold">
                {String(formatContent(devotional.prayer_note))}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row space-x-3 mb-8">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-[#E94B7B] py-4 rounded-full"
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social" size={20} color="#FFF" />
              <Text className="text-white font-semibold ml-2">Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-gray-200 py-4 rounded-full"
              onPress={() => { }}
              activeOpacity={0.8}
            >
              <Ionicons name="bookmark-outline" size={20} color="#333" />
              <Text className="text-gray-800 font-semibold ml-2">Save</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <View className="bg-gray-100 rounded-xl p-4 mb-6">
            <Text className="text-gray-600 text-xs text-center">
              Published on {formatDateLong(devotional.date)}
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
