import AuthGuardModal from '@/components/AuthGuardModal';
import CustomAlert from '@/components/CustomAlert';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAuthenticated } from '../../../utils/auth';
import {
  createPrayer,
  deletePrayer,
  getPrayers,
  Prayer,
  updatePrayer,
} from '../../../libs/prayer';

type TabType = 'list' | 'answered';

type AlertInfo = {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error';
};

const PrayerScreen = () => {
  const router = useRouter();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertInfo, setAlertInfo] = useState<AlertInfo>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  // Form state
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  const loadPrayers = async () => {
    try {
      setLoading(true);
      const data = await getPrayers();
      setPrayers(data || []);
    } catch (error) {
      console.error('Error loading prayers:', error);
      setPrayers([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const checkAuth = async () => {
        const auth = await isAuthenticated();
        setAuthenticated(auth);
        if (auth) {
          loadPrayers();
        } else {
          setLoading(false);
          setModalVisible(true);
        }
      };
      checkAuth();
    }, [])
  );

  const showAlert = (title: string, message: string, type: 'success' | 'error') => {
    setAlertInfo({ visible: true, title, message, type });
  };

  const handleCreatePrayer = async () => {
    if (!title.trim() || !note.trim()) {
      showAlert('Error', 'Please fill in both title and prayer content', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await createPrayer({ title: title.trim(), note: note.trim() });
      setTitle('');
      setNote('');
      setAddModalVisible(false);
      loadPrayers();
      showAlert('Success', 'Prayer added successfully', 'success');
    } catch (error) {
      showAlert('Error', 'Failed to create prayer', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePrayer = async () => {
    if (!selectedPrayer || !title.trim() || !note.trim()) {
      showAlert('Error', 'Please fill in both title and prayer content', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updatePrayer(selectedPrayer.id, { title: title.trim(), note: note.trim() });
      setTitle('');
      setNote('');
      setIsEditing(false);
      setDetailModalVisible(false);
      setSelectedPrayer(null);
      loadPrayers();
      showAlert('Success', 'Prayer updated successfully', 'success');
    } catch (error) {
      showAlert('Error', 'Failed to update prayer', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAsAnswered = async (prayer: Prayer) => {
    try {
      await updatePrayer(prayer.id, { is_answered: true, title: prayer.title, note: prayer.note });
      setDetailModalVisible(false);
      setSelectedPrayer(null);
      loadPrayers();
      showAlert('Success', 'Prayer marked as answered', 'success');
    } catch (error) {
      showAlert('Error', 'Failed to mark prayer as answered', 'error');
    }
  };

  const handleDeletePrayer = async (prayer: Prayer) => {
    Alert.alert('Delete Prayer', 'Are you sure you want to delete this prayer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePrayer(prayer.id);
            setDetailModalVisible(false);
            setSelectedPrayer(null);
            loadPrayers();
            showAlert('Success', 'Prayer deleted successfully', 'success');
          } catch (error) {
            showAlert('Error', 'Failed to delete prayer', 'error');
          }
        },
      },
    ]);
  };

  const openAddModal = () => {
    setTitle('');
    setNote('');
    setIsEditing(false);
    setAddModalVisible(true);
  };

  const openDetailModal = (prayer: Prayer) => {
    setSelectedPrayer(prayer);
    setTitle(prayer.title);
    setNote(prayer.note);
    setDetailModalVisible(true);
  };

  const startEditing = () => {
    setDetailModalVisible(false);
    setIsEditing(true);
    setAddModalVisible(true);
  };

  const filteredPrayers = prayers?.filter((prayer) =>
    activeTab === 'answered' ? prayer.is_answered : !prayer.is_answered
  ) || [];

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

  const renderPrayerItem = ({ item }: { item: Prayer }) => (
    <TouchableOpacity
      className="bg-slate-800 p-4 rounded-lg mb-4"
      onPress={() => openDetailModal(item)}
    >
      <Text className="text-lg font-bold text-white mb-2">{item.title}</Text>
      <Text className="text-gray-300 mb-2" numberOfLines={2}>
        {item.note}
      </Text>
      <Text className="text-xs text-gray-500">{formatDate(item.created_at)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['top']}>
      <AuthGuardModal visible={modalVisible} onClose={() => setModalVisible(false)} />
      <CustomAlert
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
        onClose={() => setAlertInfo({ ...alertInfo, visible: false })}
      />
      <View className="flex-row items-center px-4 py-10 border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-center flex-1 text-white">Prayer</Text>
        <View className="w-10" />
      </View>

      <View className="flex-row px-4 py-4">
        <TouchableOpacity
          onPress={() => setActiveTab('list')}
          className={`px-6 py-2 rounded-full mr-3 ${
            activeTab === 'list' ? 'bg-[#E94B7B]' : 'bg-slate-800'
          }`}
        >
          <Text
            className={`font-semibold ${
              activeTab === 'list' ? 'text-white' : 'text-gray-400'
            }`}
          >
            Prayer List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('answered')}
          className={`px-6 py-2 rounded-full ${
            activeTab === 'answered' ? 'bg-[#E94B7B]' : 'bg-slate-800'
          }`}
        >
          <Text
            className={`font-semibold ${
              activeTab === 'answered' ? 'text-white' : 'text-gray-400'
            }`}
          >
            Answered
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E94B7B" />
        </View>
      ) : (
        <FlatList
          data={filteredPrayers}
          renderItem={renderPrayerItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <Ionicons name="heart-outline" size={64} color="#4B5563" />
              <Text className="text-gray-500 mt-4 text-lg">
                No {activeTab === 'answered' ? 'answered prayers' : 'prayers'} yet
              </Text>
              <Text className="text-gray-600 mt-1">
                Tap the '+' button to create one.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        className="absolute bottom-24 right-6 bg-[#E94B7B] w-16 h-16 rounded-full items-center justify-center shadow-lg"
        onPress={openAddModal}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Add/Edit Prayer Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        onRequestClose={() => {
          if (isSaving) return;
          setAddModalVisible(false);
          setIsEditing(false);
          setSelectedPrayer(null);
        }}
      >
        <SafeAreaView className="flex-1 bg-gray-900" edges={['top']}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
            <TouchableOpacity
              onPress={() => {
                if (isSaving) return;
                setAddModalVisible(false);
                setIsEditing(false);
                setSelectedPrayer(null);
              }}
              className="p-2"
              disabled={isSaving}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white">
              {isEditing ? 'Edit Prayer' : 'Add Prayer'}
            </Text>
            <TouchableOpacity
              onPress={isEditing ? handleUpdatePrayer : handleCreatePrayer}
              disabled={isSaving}
              className="flex-row items-center"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#E94B7B" className="mr-2" />
              ) : null}
              <Text className="text-[#E94B7B] font-semibold text-lg">
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            <Text className="text-gray-200 mb-4">
              {new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </Text>

            <TextInput
              className="text-lg font-semibold mb-4 p-3 bg-gray-700 text-white rounded-lg"
              placeholder="Title"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
              editable={!isSaving}
            />

            <TextInput
              className="text-base p-3 bg-gray-700 text-white rounded-lg min-h-[200px]"
              placeholder="What would you like to pray about?"
              placeholderTextColor="#999"
              value={note}
              onChangeText={setNote}
              multiline
              textAlignVertical="top"
              editable={!isSaving}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Prayer Detail Modal */}
      <Modal
        visible={isDetailModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setDetailModalVisible(false);
          setSelectedPrayer(null);
        }}
      >
        <SafeAreaView className="flex-1 bg-gray-900" edges={['top']}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-800">
            <TouchableOpacity
              onPress={() => {
                setDetailModalVisible(false);
                setSelectedPrayer(null);
              }}
              className="p-2"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white">Prayer</Text>
            <TouchableOpacity onPress={() => {}}>
              {/* <Ionicons name="ellipsis-vertical" size={24} color="white" /> */}
            </TouchableOpacity>
          </View>

          {selectedPrayer && (
            <ScrollView className="flex-1 p-6">
              <Text className="text-sm text-gray-200 mb-6">
                {formatDate(selectedPrayer.created_at)}
              </Text>

              <Text className="text-2xl font-bold mb-3 text-white">{selectedPrayer.title}</Text>
              <Text className="text-sm text-gray-200 mb-6 italic">
                The Daily Answer Devotional, {new Date(selectedPrayer.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>

              <Text className="text-base leading-7 text-gray-200">{selectedPrayer.note}</Text>
            </ScrollView>
          )}

          {selectedPrayer && (
            <View className="px-6 pb-6 pt-4 border-t border-gray-800 bg-gray-800">
              {!selectedPrayer.is_answered && (
                <TouchableOpacity
                  className="bg-[#E94B7B] py-4 rounded-full mb-3"
                  onPress={() => handleMarkAsAnswered(selectedPrayer)}
                >
                  <Text className="text-white text-center font-semibold text-lg">
                    Mark as Answered
                  </Text>
                </TouchableOpacity>
              )}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-gray-200 py-4 rounded-full"
                  onPress={startEditing}
                >
                  <Text className="text-gray-800 text-center font-semibold">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-red-50 py-4 rounded-full"
                  onPress={() => handleDeletePrayer(selectedPrayer)}
                >
                  <Text className="text-red-500 text-center font-semibold">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default PrayerScreen;