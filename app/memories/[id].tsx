import { detailMemory, Memory } from "@/libs/memories";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Speech from "expo-speech";
import { StatusBar } from "expo-status-bar";

const MemoryDetails = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    loadMemory();
  }, [id]);

  const loadMemory = async () => {
    try {
      setLoading(true);
      const data = await detailMemory(id as string);
      setMemory(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  async function onShare(memory: { verse_text: string; notes?: string }) {
    const message = `${memory.verse_text}\n\n${(memory.notes ?? "").replace(/<[^>]*>/g, "").trim()}`;
    await Share.share({ message });
  }

  const handlePlayPause = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      if (!memory?.verse_text) return;

      const verseText = memory.verse_text;
      const notesText = memory.notes ? stripHtml(memory.notes) : '';
      const textToSpeak = notesText
        ? `${verseText}. ${notesText}`
        : verseText;

      setIsSpeaking(true);
      Speech.speak(textToSpeak, {
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const stripHtml = (html: string) =>
    html
      ?.replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

  const extractVerseReference = (text?: string) => {
    if (!text) return "";
    const match = text.match(/([A-Za-z]+\s+\d+:\d+(?:-\d+)?)/);
    return match ? match[1] : "";
  };

  const formatVerseText = (text?: string) => {
    if (!text) return "";
    return text.replace(/^\d+-\d+\s*/, "").trim();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#E94B7B" />
      </SafeAreaView>
    );
  }

  if (!memory) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <StatusBar style="light" />
        <Text className="text-slate-400">Memory not found</Text>
      </SafeAreaView>
    );
  }

  const verseReference = extractVerseReference(memory?.verse_text);

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar style="light" />
      <View className="flex-row items-center px-4 py-3 border-b border-slate-800 bg-slate-900">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-4 text-white">
          Memory Verse
        </Text>
      </View>

      <ScrollView className="flex-1 bg-slate-900">
        <View className="px-6 py-8">
          {memory.notes && (
            <View className="mb-8 p-4 bg-slate-800 rounded-xl border border-slate-700">
              <Text className="text-base text-slate-200 leading-relaxed">
                {stripHtml(memory.notes)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            className="bg-[#E94B7B] rounded-full py-4 items-center"
            onPress={() => router.push("/(root)/(tabs)")}
          >
            <Text className="text-white font-semibold text-lg">
              Go to Devotional
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="bg-slate-900 border-t border-slate-800 px-4 pt-4 pb-6">
        <Text className="text-2xl font-bold text-center text-white mb-2">
          {verseReference}
        </Text>
        <Text className="text-base text-center text-slate-300 leading-relaxed mb-6">
          {formatVerseText(memory?.verse_text)}
        </Text>

        <View className="flex-row justify-around items-center">
          <TouchableOpacity
            className="items-center"
            onPress={() => alert("Save pressed")}
          >
            <Ionicons name="bookmark-outline" size={24} color="#94A3B8" />
            <Text className="text-xs text-slate-400 mt-1">Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="items-center"
            onPress={() => alert("Note pressed")}
          >
            <Ionicons name="create-outline" size={24} color="#94A3B8" />
            <Text className="text-xs text-slate-400 mt-1">Note</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="items-center"
            onPress={() => alert("Copy pressed")}
          >
            <Ionicons name="copy-outline" size={24} color="#94A3B8" />
            <Text className="text-xs text-slate-400 mt-1">Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center" onPress={() => onShare(memory)}>
            <Ionicons name="share-outline" size={24} color="#94A3B8" />
            <Text className="text-xs text-slate-400 mt-1">Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-[#E94B7B] rounded-full w-16 h-16 items-center justify-center"
            onPress={handlePlayPause}
          >
            <Ionicons
              name={isSpeaking ? "pause" : "play"}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MemoryDetails;
