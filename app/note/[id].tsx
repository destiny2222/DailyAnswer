import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNote, getNote } from '../../libs/note';

const NoteDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isCreating = id === 'create';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(!isCreating);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isCreating) {
      loadNote();
    }
  }, [id]);

  const loadNote = async () => {
    try {
      setLoading(true);
      const note = await getNote(Number(id));
      const noteData = note.data || note;
      setTitle(noteData.title);
      setContent(noteData.content);
    } catch (error) {
      console.error('Error loading note:', error);
      Alert.alert('Error', 'Could not load the note.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing Information', 'Please enter a title and content for your note.');
      return;
    }

    try {
      setSaving(true);
      if (isCreating) {
        await createNote({ title, content });
      }
      router.back();
    } catch (error) {
      const errorMessage = error?.message || 'Could not save the note.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#E94B7B" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">
          {isCreating ? 'New Note' : 'Note'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !isCreating}
          className={`${
            isCreating ? 'bg-[#E94B7B]' : 'bg-gray-300'
          } rounded-full px-5 py-2`}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View className="p-4">
        <Text className="text-sm text-gray-500 mb-4">
          {new Date().toLocaleDateString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
          })}
        </Text>
        <TextInput
          className="text-2xl font-bold text-gray-800 mb-4"
          placeholder="Title"
          placeholderTextColor="#ccc"
          value={title}
          onChangeText={setTitle}
          editable={isCreating}
        />
        <TextInput
          className="text-lg text-gray-700 leading-6"
          placeholder="What would you like to write?"
          placeholderTextColor="#ccc"
          value={content}
          onChangeText={setContent}
          multiline
          editable={isCreating}
        />
      </View>
    </SafeAreaView>
  );
};

export default NoteDetailScreen;
