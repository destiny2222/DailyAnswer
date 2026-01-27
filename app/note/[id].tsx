import CustomAlert from '@/components/CustomAlert';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNote, deleteNote, getNote, updateNote } from '../../libs/note';

const NoteDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isCreating = id === 'create';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(!isCreating);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });

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
      setAlertConfig({
        title: "Load Error",
        message: "Could not load the note.",
        type: "error",
      });
      setAlertVisible(true);
      //
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setAlertConfig({
        title: "Missing Information",
        message: "Please enter a title and content for your note.",
        type: "error",
      });
      setAlertVisible(true);
      return;
    }

    try {
      setSaving(true);
      if (isCreating) {
        await createNote({ title, content });
        router.back();
      } else if (editing) {
        await updateNote(Number(id), { title, content });
        setEditing(false);
        setAlertConfig({
          title: "Updated",
          message: "Note updated successfully.",
          type: "success",
        });
        setAlertVisible(true);
      }
    } catch (error) {
      const errorMessage = error?.message || 'Could not save the note.';
      setAlertConfig({
        title: "Save Error",
        message: errorMessage,
        type: "error",
      });
      setAlertVisible(true);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteNote(Number(id));
      router.back();
    } catch (error) {
      setAlertConfig({
        title: "Delete Error",
        message: error?.message || "Could not delete the note.",
        type: "error",
      });
      setAlertVisible(true);
    } finally {
      setDeleting(false);
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
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-900">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#ccc" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-200">
          {isCreating ? 'New Note' : 'Note'}
        </Text>
        {isCreating || editing ? (
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-[#E94B7B] rounded-full px-5 py-2"
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold">Save</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              onPress={handleEdit}
              className="bg-blue-600 rounded-full px-4 py-2 mr-2"
            >
              <Text className="text-white font-bold">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              disabled={deleting}
              className="bg-red-600 rounded-full px-4 py-2"
            >
              {deleting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold">Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View className="p-4">
        <Text className="text-sm text-gray-200 mb-4">
          {new Date().toLocaleDateString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
          })}
        </Text>
        <TextInput
          className="text-2xl font-bold text-white mb-4 bg-gray-800 p-4 rounded"
          placeholder="Title"
          placeholderTextColor="#ccc"
          value={title}
          onChangeText={setTitle}
          editable={isCreating || editing}
        />
        <TextInput
          className="text-lg text-white leading-6 bg-gray-800 p-4 rounded"
          placeholder="What would you like to write?"
          placeholderTextColor="#ccc"
          value={content}
          onChangeText={setContent}
          multiline
          editable={isCreating || editing}
          numberOfLines={8}
          style={{ minHeight: 120, textAlignVertical: 'top', maxHeight: 300 }}
          scrollEnabled
        />
      </View>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

export default NoteDetailScreen;
