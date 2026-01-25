import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchMemories, Memory } from '@/libs/memories'
import { createPrayer } from '@/libs/prayer'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import CustomAlert from '@/components/CustomAlert'

const MemoryVerse = () => {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'success' as 'success' | 'error' })

  const loadMemories = async () => {
    try {
      setLoading(true)
      const data = await fetchMemories()
      setMemories(data)
    } catch (error) {
      console.error('Error loading memories:', error)
    } finally {
      setLoading(false)
    }
  }
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

  const onRefresh = async () => {
    setRefreshing(true)
    await loadMemories()
    setRefreshing(false)
  }

  useEffect(() => {
    loadMemories()
  }, [])

  const handleMemoryPress = (id: number) => {
    router.push(`/memories/${id}`)
  }

  const handleMenuPress = (item: Memory, event: any) => {
    event.stopPropagation()
    setSelectedMemory(item)
    setMenuVisible(true)
  }

  const handleCopy = async () => {
    if (selectedMemory) {
      const textToCopy = `${formatVerseText(selectedMemory.verse_text)}\n\n${stripHtml(selectedMemory.notes || '')}`
      await Clipboard.setStringAsync(textToCopy)
      setAlertConfig({
        title: 'Copied to Clipboard',
        message: 'The verse has been copied.',
        type: 'success'
      })
      setAlertVisible(true)
      setMenuVisible(false)
    }
  }

  const handlePray = async () => {
    if (selectedMemory) {
      try {
        await createPrayer({
          memory_verse_id: selectedMemory.id,
          title: formatVerseText(selectedMemory.verse_text),
          note: stripHtml(selectedMemory.notes || ''),
        })
        setAlertConfig({
          title: 'Prayer Added',
          message: 'This verse has been added to your prayers.',
          type: 'success'
        })
        setAlertVisible(true)
        setMenuVisible(false)
      } catch (error) {
        console.error('Error creating prayer:', error)
        setAlertConfig({
          title: 'Failed to Add Prayer',
          message: 'Please try again.',
          type: 'error'
        })
        setAlertVisible(true)
      }
    }
  }

  const renderMemoryCard = ({ item }: { item: Memory }) => (
    <TouchableOpacity
      onPress={() => handleMemoryPress(item.id)}
      className="bg-slate-800 rounded-xl p-4 mb-3 mx-4 border border-slate-700"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-slate-400 text-xs mb-1">
            {new Date(item.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
          <Text className="text-white font-semibold text-base" numberOfLines={2}>
            {formatVerseText(item.verse_text)}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={(e) => handleMenuPress(item, e)}
          className="p-1"
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>
      {item.notes && (
        <Text className="text-slate-400 text-sm mt-2" numberOfLines={2}>
          {stripHtml(item.notes)}
        </Text>
      )}
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#E94B7B" />
          <Text className="text-slate-400 mt-4">Loading memory verses...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-4 border-b border-slate-800">
          <Text className="text-white text-2xl font-bold">Memory Verses</Text>
          <Text className="text-slate-400 text-sm mt-1">
            {memories.length} {memories.length === 1 ? 'verse' : 'verses'} saved
          </Text>
        </View>

        {/* Memory List */}
        {memories.length === 0 ? (
          <View className="flex-1 justify-center items-center px-6">
            <Ionicons name="book-outline" size={64} color="#475569" />
            <Text className="text-slate-400 text-lg mt-4 text-center">
              No memory verses yet
            </Text>
            <Text className="text-slate-500 text-sm mt-2 text-center">
              Start memorizing verses to see them here
            </Text>
          </View>
        ) : (
          <FlatList
            data={memories}
            renderItem={renderMemoryCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingVertical: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#E94B7B"
                colors={['#E94B7B']}
              />
            }
          />
        )}
      </View>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setMenuVisible(false)}
        >
          <Pressable className="bg-slate-800 rounded-t-3xl p-6" onPress={(e) => e.stopPropagation()}>
            <View className="w-12 h-1 bg-slate-600 rounded-full self-center mb-6" />
            
            <TouchableOpacity 
              onPress={handleCopy}
              className="flex-row items-center py-4 px-2"
            >
              <View className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center mr-4">
                <Ionicons name="copy-outline" size={20} color="#CBD5E1" />
              </View>
              <Text className="text-white text-lg">Copy Verse</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handlePray}
              className="flex-row items-center py-4 px-2"
            >
              <View className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center mr-4">
                <Ionicons name="heart-outline" size={20} color="#CBD5E1" />
              </View>
              <Text className="text-white text-lg">Pray</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setMenuVisible(false)}
              className="mt-4 py-4 bg-slate-700 rounded-xl"
            >
              <Text className="text-white text-center text-lg font-semibold">Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <CustomAlert 
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  )
}

export default MemoryVerse