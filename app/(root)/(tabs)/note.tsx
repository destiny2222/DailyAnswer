import AuthGuardModal from '@/components/AuthGuardModal';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAuthenticated } from '../../../utils/auth';
import { getNotes, Note } from '../../../libs/note';

const NotesScreen = () => {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const checkAuth = async () => {
        const auth = await isAuthenticated();
        setAuthenticated(auth);
        if (auth) {
          loadNotes();
        } else {
          setLoading(false);
          setModalVisible(true);
        }
      };
      checkAuth();
    }, [])
  );

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await getNotes();
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const day = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    return `${time} ${day}`;
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity
      className="bg-gray-700 p-4 rounded-lg shadow-sm mb-4 border border-gray-700"
      onPress={() => router.push(`/note/${item.id}`)}
    >
      <Text className="text-lg font-bold text-gray-100 mb-1">{item.title}</Text>
      <Text className="text-gray-300 mb-2" numberOfLines={2}>
        {item.content}
      </Text>
      <Text className="text-xs text-gray-400">{formatDate(item.created_at)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-900">
       <AuthGuardModal visible={modalVisible} onClose={() => setModalVisible(false)} />
      <View className="px-4 pt-4 pb-3 bg-gray-900">
        <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
                <View className="bg-pink-100 rounded-full p-2 mr-3">
                    <Ionicons name="home-outline" size={24} color="#E94B7B" />
                </View>
                <Text className="text-2xl font-bold text-gray-200">Notes</Text>
            </TouchableOpacity>
        </View>
        <View className="flex-row items-center bg-gray-800 rounded-full px-4 py-3 shadow-sm border border-gray-700">
          <Ionicons name="search" size={20} color="#999" />
          <TextInput 
            className="flex-1 ml-3 text-base text-gray-200"
            placeholder="Search notes"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E94B7B" />
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <Ionicons name="document-text-outline" size={64} color="#666" />
              <Text className="text-gray-500 mt-4 text-lg">No notes yet</Text>
              <Text className="text-gray-400 mt-1">Tap the '+' button to create one.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        className="absolute bottom-24 right-6 bg-[#E94B7B] w-16 h-16 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push('/note/create')}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default NotesScreen;