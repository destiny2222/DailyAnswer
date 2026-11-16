import devo1 from '@/assets/images/devo/1.jpg';
import devo2 from '@/assets/images/devo/2.jpg';
import devo3 from '@/assets/images/devo/3.jpg';
import devo4 from '@/assets/images/devo/4.jpg';
import devo5 from '@/assets/images/devo/5.jpg';
import devo6 from '@/assets/images/devo/6.jpg';
import devo7 from '@/assets/images/devo/7.jpg';

import CustomAlert from "@/components/CustomAlert";
import SubscriptionModal from "@/components/SubscriptionModal";
import { ApiError } from '@/utils/api';
import { formatDateLong, safeParseDate } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { detailDevotional, Devotional } from '../../libs/devotional';

const getFallbackImage = (dateInput?: string | Date) => {
  const date = safeParseDate(dateInput);
  const day = date.getDay();
  const fallbackImages = [devo1, devo2, devo3, devo4, devo5, devo6, devo7];
  return fallbackImages[day] || fallbackImages[0];
};

const SAVED_DEVOTIONAL_IDS_KEY = 'saved_devotional_ids';

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
  const rawId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'success' as 'success' | 'error' });

  // Audio state management
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const chunksRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    if (rawId) {
      loadDevotional();
      setupAudio();
    }

    return () => {
      // Cleanup speech when component unmounts
      Speech.stop();
      isSpeakingRef.current = false;
    };
  }, [rawId]);

  const setupAudio = async () => {
    try {
      await setAudioModeAsync({
        // Allow TTS to play even when the iOS ring/silent switch is off
        playsInSilentMode: true,
        // Keep audio active when app goes to background (e.g. screen off while listening)
        shouldPlayInBackground: true,
        // Mix with other audio (music apps) instead of ducking/pausing them
        interruptionMode: 'mixWithOthers',
        // Don't route through earpiece — use speaker
        shouldRouteThroughEarpiece: false,
        allowsRecording: false,
      });
    } catch {
      // Audio session setup is best-effort; expo-speech has its own fallback
    }
  };

  const loadDevotional = async () => {
    if (!rawId) return;
    try {
      setLoading(true);
      setError(null);
      setRequiresPayment(false);
      const data = await detailDevotional(rawId);
      setDevotional(data);
      if (data?.id) {
        await checkSavedStatus(String(data.id));
      }
    } catch (err: any) {
      const isPaywall =
        err?.status === 402 ||
        err?.status === 403 ||
        err?.data?.requires_payment === true ||
        String(err?.message || "").toLowerCase().includes("payment required");

      if (isPaywall) {
        setRequiresPayment(true);
        setShowSubscriptionModal(true);
      } else {
        // console.error("Error loading devotional details:", err);
      }
      const msg = ApiError.getMessage(err);
      setError(msg || "Unable to load devotional.");
    } finally {
      setLoading(false);
    }
  };

  const getSavedDevotionalIds = async () => {
    const saved = await SecureStore.getItemAsync(SAVED_DEVOTIONAL_IDS_KEY);
    if (!saved) return [];

    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (error) {
      return [];
    }
  };

  const checkSavedStatus = async (devotionalId: string) => {
    const savedIds = await getSavedDevotionalIds();
    setIsSaved(savedIds.includes(devotionalId));
  };

  const handleSave = async () => {
    if (!devotional || isSaving) return;

    try {
      setIsSaving(true);
      const devotionalId = String(devotional.id);
      const savedIds = await getSavedDevotionalIds();
      const isCurrentlySaved = savedIds.includes(devotionalId);
      const nextSavedIds = isCurrentlySaved
        ? savedIds.filter((savedId) => savedId !== devotionalId)
        : [...savedIds, devotionalId];

      await SecureStore.setItemAsync(
        SAVED_DEVOTIONAL_IDS_KEY,
        JSON.stringify(nextSavedIds),
      );
      
      const newValue = nextSavedIds.includes(devotionalId);
      setIsSaved(newValue);

      setAlertConfig({
        title: newValue ? "Saved" : "Removed",
        message: newValue ? "Devotional has been saved to your profile." : "Devotional removed from saved items.",
        type: newValue ? "success" : "error"
      });
      setAlertVisible(true);
    } catch (error) {
      setAlertConfig({ title: "Error", message: "Unable to update this devotional right now.", type: "error" });
      setAlertVisible(true);
    } finally {
      setIsSaving(false);
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
      // All chunks done
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentChunkIndex(0);
      isSpeakingRef.current = false;
      isPausedRef.current = false;
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
        // Only advance if we're still meant to be speaking and not paused
        if (isSpeakingRef.current && !isPausedRef.current) {
          speakChunk(index + 1);
        }
      },
      onStopped: () => {
        // Called when Speech.stop() is used (Android & iOS)
        // Don't auto-advance — let the user control it
      },
      onError: () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      },
    });
  };

  const handlePlayPause = async () => {
    if (!devotional) return;

    if (isSpeaking && !isPaused) {
      // Pause
      if (Platform.OS === 'android') {
        Speech.stop();
      } else {
        Speech.pause();
      }
      setIsPaused(true);
      isPausedRef.current = true;
    } else if (isSpeaking && isPaused) {
      // Resume
      setIsPaused(false);
      isPausedRef.current = false;
      if (Platform.OS === 'android') {
        speakChunk(currentChunkIndex);
      } else {
        Speech.resume();
      }
    } else {
      // Start fresh — re-activate audio session first
      await setupAudio();
      Speech.stop();
      await new Promise(r => setTimeout(r, 150)); // let audio session settle

      const newChunks = getFullTextChunks();
      if (newChunks.length === 0) return;

      chunksRef.current = newChunks;
      isSpeakingRef.current = true;
      isPausedRef.current = false;
      setIsPaused(false);
      setCurrentChunkIndex(0);
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
    if (requiresPayment) {
      return (
        <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center px-6">
          <StatusBar style="light" />
          <View className="w-20 h-20 bg-pink-500/10 rounded-full items-center justify-center mb-6 border border-[#E94B7B]/30">
            <Ionicons name="lock-closed" size={40} color="#E94B7B" />
          </View>
          <Text className="text-white text-2xl font-bold text-center mb-2">
            Subscription Required
          </Text>
          <Text className="text-slate-400 text-base text-center leading-6 mb-8 px-2">
            This devotional is reserved for premium members. Subscribe now to unlock unlimited access to daily devotionals, audio recordings, and archives.
          </Text>

          <View className="w-full space-y-3 gap-3">
            <TouchableOpacity
              className="w-full bg-[#E94B7B] py-4 rounded-2xl items-center justify-center shadow-lg"
              onPress={() => setShowSubscriptionModal(true)}
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-base">
                Subscribe to Unlock
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full py-4 rounded-2xl items-center justify-center bg-slate-800"
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text className="text-slate-300 font-semibold text-base">
                Go Back
              </Text>
            </TouchableOpacity>
          </View>

          <SubscriptionModal
            visible={showSubscriptionModal}
            onClose={() => {
              setShowSubscriptionModal(false);
              loadDevotional();
            }}
          />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#999" />
        <Text className="text-gray-800 text-lg font-bold mt-4 text-center">
          Devotional not found
        </Text>
        {error ? (
          <Text className="text-gray-500 text-sm mt-2 text-center px-4">
            {error}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-3 mt-6">
          <TouchableOpacity
            className="bg-gray-100 px-6 py-3 rounded-full"
            onPress={() => router.back()}
          >
            <Text className="text-gray-700 font-semibold">Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-[#E94B7B] px-6 py-3 rounded-full"
            onPress={loadDevotional}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
        <SubscriptionModal
          visible={showSubscriptionModal}
          onClose={() => {
            setShowSubscriptionModal(false);
            loadDevotional();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      {/* Header */}
      <View className="flex-row items-center  justify-between px-4 py-3 bg-white border-b border-gray-200">
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

      <ScrollView className="flex-1 pt-6" showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <Image
          source={getFallbackImage(devotional.date)}
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

          {/* Scripture References */}
          {devotional.key_verse && (
            <View className="bg-pink-50 rounded-xl p-4 mb-6">
              <View className="flex-row items-center mb-2">
                <Ionicons name="bookmark" size={18} color="#E94B7B" />
                <Text className="text-sm font-bold text-[#E94B7B] ml-2">
                  Scripture Reference
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

          {/* Memory Verses */}
          {devotional.verses && (
            <View className="bg-blue-50 rounded-xl p-4 mb-6">
              <View className="flex-row items-center mb-2">
                <Ionicons name="book-outline" size={18} color="#3B82F6" />
                <Text className="text-sm font-bold text-blue-700 ml-2">
                  Memory Verse
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
              className={`flex-1 flex-row items-center justify-center py-4 rounded-full ${isSaved ? 'bg-[#E94B7B]' : 'bg-gray-200'}`}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isSaved ? '#FFF' : '#333'}
              />
              <Text className={`font-semibold ml-2 ${isSaved ? 'text-white' : 'text-gray-800'}`}>
                {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
              </Text>
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

      <CustomAlert 
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />

      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false);
          loadDevotional();
        }}
      />
    </SafeAreaView>
  );
};

export default DevotionalDetail;
