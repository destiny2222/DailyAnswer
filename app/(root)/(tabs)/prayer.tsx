import AuthGuardModal from '@/components/AuthGuardModal';
import CustomAlert from '@/components/CustomAlert';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
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
import { StatusBar } from 'expo-status-bar';
import { ApiError } from '../../../utils/api';

type TabType = 'list' | 'answered';

type AlertInfo = {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error';
};

const formatPrayerDate = (dateString: string) => {
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

const PrayerListItem = memo(function PrayerListItem({
  item,
  onPress,
}: {
  item: Prayer;
  onPress: (prayer: Prayer) => void;
}) {
  return (
    <TouchableOpacity
      className="mb-4 overflow-hidden rounded-2xl border border-white/5 bg-slate-800"
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      <View className="p-4">
        <View className="mb-3 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="mb-2 text-lg font-bold text-white" numberOfLines={2}>
              {item.title}
            </Text>
            <Text className="text-sm leading-6 text-slate-300" numberOfLines={3}>
              {item.note}
            </Text>
          </View>
          <View className={`rounded-full p-2 ${item.is_answered ? 'bg-emerald-500/15' : 'bg-[#E94B7B]/15'}`}>
            <Ionicons
              name={item.is_answered ? 'checkmark-circle' : 'heart-outline'}
              size={20}
              color={item.is_answered ? '#34D399' : '#E94B7B'}
            />
          </View>
        </View>

        <View className="flex-row items-center justify-between border-t border-white/5 pt-3">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={14} color="#94A3B8" />
            <Text className="ml-1 text-xs text-slate-400">{formatPrayerDate(item.created_at)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </View>
      </View>
    </TouchableOpacity>
  );
});

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
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPrayers();
    setRefreshing(false);
  }, []);

  const loadPrayers = async () => {
    try {
      setLoading(true);
      const data = await getPrayers();
      setPrayers(data || []);
    } catch {
      setPrayers([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const checkAuth = async () => {
        const auth = await isAuthenticated();
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
      await loadPrayers();
      showAlert('Success', 'Prayer added successfully', 'success');
    } catch (error) {
      showAlert('Error', ApiError.getMessage(error), 'error');
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
      const updatedPrayer = await updatePrayer(selectedPrayer.id, { title: title.trim(), note: note.trim() });
      const nextPrayer = updatedPrayer || {
        ...selectedPrayer,
        title: title.trim(),
        note: note.trim(),
        updated_at: new Date().toISOString(),
      };

      setPrayers((currentPrayers) =>
        currentPrayers.map((prayer) =>
          prayer.id === selectedPrayer.id ? nextPrayer : prayer
        )
      );
      setTitle('');
      setNote('');
      setIsEditing(false);
      setAddModalVisible(false);
      setDetailModalVisible(false);
      setSelectedPrayer(null);
      showAlert('Success', 'Prayer updated successfully', 'success');
    } catch (error) {
      showAlert('Error', ApiError.getMessage(error), 'error');
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
    } catch {
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
          } catch {
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

  const openDetailModal = useCallback((prayer: Prayer) => {
    setSelectedPrayer(prayer);
    setTitle(prayer.title);
    setNote(prayer.note);
    setDetailModalVisible(true);
  }, []);

  const startEditing = () => {
    setDetailModalVisible(false);
    setIsEditing(true);
    setAddModalVisible(true);
  };

  const filteredPrayers = useMemo(
    () =>
      prayers?.filter((prayer) =>
        activeTab === 'answered' ? prayer.is_answered : !prayer.is_answered
      ) || [],
    [activeTab, prayers],
  );
  const activePrayerCount = useMemo(
    () => prayers.filter((prayer) => !prayer.is_answered).length,
    [prayers],
  );
  const answeredPrayerCount = useMemo(
    () => prayers.filter((prayer) => prayer.is_answered).length,
    [prayers],
  );

  const renderPrayerItem = useCallback(
    ({ item }: { item: Prayer }) => (
      <PrayerListItem item={item} onPress={openDetailModal} />
    ),
    [openDetailModal],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <AuthGuardModal visible={modalVisible} onClose={() => setModalVisible(false)} />
      <CustomAlert
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
        onClose={() => setAlertInfo({ ...alertInfo, visible: false })}
      />
      
      <View className="px-5 pb-5 pt-6">
        <View className="mb-6 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.replace('/profile')}
            className="h-11 w-11 items-center justify-center rounded-full bg-slate-800"
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openAddModal}
            className="h-11 w-11 items-center justify-center rounded-full bg-[#E94B7B]"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Text className="text-3xl font-bold text-white">Prayer Journal</Text>
        <Text className="mt-2 text-base leading-6 text-slate-400">
          Keep your requests close and celebrate every answer.
        </Text>

        <View className="mt-5 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-slate-800 p-4">
            <Text className="text-2xl font-bold text-white">{activePrayerCount}</Text>
            <Text className="mt-1 text-xs font-semibold uppercase text-slate-400">
              Active
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-slate-800 p-4">
            <Text className="text-2xl font-bold text-white">{answeredPrayerCount}</Text>
            <Text className="mt-1 text-xs font-semibold uppercase text-slate-400">
              Answered
            </Text>
          </View>
        </View>
      </View>

      <View className="mx-5 mb-4 flex-row rounded-full bg-slate-800 p-1">
        <TouchableOpacity
          onPress={() => setActiveTab('list')}
          className={`flex-1 rounded-full py-3 ${
            activeTab === 'list' ? 'bg-[#E94B7B]' : 'bg-transparent'
          }`}
          activeOpacity={0.85}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === 'list' ? 'text-white' : 'text-slate-400'
            }`}
          >
            Prayer List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('answered')}
          className={`flex-1 rounded-full py-3 ${
            activeTab === 'answered' ? 'bg-[#E94B7B]' : 'bg-transparent'
          }`}
          activeOpacity={0.85}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === 'answered' ? 'text-white' : 'text-slate-400'
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
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E94B7B"
              colors={["#E94B7B"]}
            />
          }
          ListEmptyComponent={
            <View className="mt-16 items-center rounded-3xl border border-dashed border-slate-700 bg-slate-800/50 px-6 py-10">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#E94B7B]/15">
                <Ionicons
                  name={activeTab === 'answered' ? 'checkmark-done-outline' : 'heart-outline'}
                  size={34}
                  color="#E94B7B"
                />
              </View>
              <Text className="text-center text-lg font-bold text-white">
                No {activeTab === 'answered' ? 'answered prayers' : 'prayers'} yet
              </Text>
              <Text className="mt-2 text-center text-sm leading-6 text-slate-400">
                {activeTab === 'answered'
                  ? 'Answered prayers will appear here when you mark them complete.'
                  : 'Start a prayer note and come back to it whenever you need.'}
              </Text>
              {activeTab === 'list' && (
                <TouchableOpacity
                  onPress={openAddModal}
                  className="mt-6 rounded-full bg-[#E94B7B] px-6 py-3"
                  activeOpacity={0.85}
                >
                  <Text className="font-semibold text-white">Add Prayer</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* <TouchableOpacity
        className="absolute bottom-40 right-6 h-16 w-16 items-center justify-center rounded-full bg-[#E94B7B] shadow-lg"
        onPress={openAddModal}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity> */}

      {/* Add/Edit Prayer Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => {
          if (isSaving) return;
          setAddModalVisible(false);
          setIsEditing(false);
          setSelectedPrayer(null);
        }}
      >
        <View className="flex-1 justify-end bg-black/60">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <SafeAreaView
              className="rounded-t-[32px] border border-slate-800 bg-slate-900"
              edges={['bottom']}
              style={styles.sheet}
            >
              <View className="items-center pt-3">
                <View className="h-1.5 w-12 rounded-full bg-slate-700" />
              </View>

              <View className="flex-row items-center justify-between border-b border-slate-800 px-5 py-4">
                <TouchableOpacity
                  onPress={() => {
                    if (isSaving) return;
                    setAddModalVisible(false);
                    setIsEditing(false);
                    setSelectedPrayer(null);
                  }}
                  className="h-11 w-11 items-center justify-center rounded-full bg-slate-800"
                  disabled={isSaving}
                  activeOpacity={0.85}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <Text className="flex-1 px-3 text-center text-xl font-bold text-white">
                  {isEditing ? 'Edit Prayer' : 'Add Prayer'}
                </Text>
                <TouchableOpacity
                  onPress={isEditing ? handleUpdatePrayer : handleCreatePrayer}
                  disabled={isSaving}
                  activeOpacity={0.85}
                  className={`h-11 min-w-[112px] flex-row items-center justify-center rounded-full px-4 ${
                    isSaving ? 'bg-slate-800' : 'bg-[#E94B7B]'
                  }`}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
                  ) : (
                    <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                  )}
                  <Text className="font-semibold text-white">
                    {isSaving ? 'Saving...' : ' Save'}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                className="px-5 py-6"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.sheetScrollContent}
              >
                <Text className="mb-5 text-sm font-semibold uppercase text-slate-400">
                  {new Date().toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>

                <TextInput
                  className="mb-4 h-[60px] rounded-2xl bg-slate-800 px-4 py-4 text-lg font-semibold text-white"
                  placeholder="Title"
                  placeholderTextColor="#64748B"
                  value={title}
                  onChangeText={setTitle}
                  editable={!isSaving}
                />

                <TextInput
                  className="min-h-[260px] rounded-2xl bg-slate-800 px-4 py-4 text-base leading-6 text-white"
                  placeholder="What would you like to pray about?"
                  placeholderTextColor="#64748B"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  textAlignVertical="top"
                  editable={!isSaving}
                />
              </ScrollView>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Prayer Detail Modal */}
      <Modal
        visible={isDetailModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => {
          setDetailModalVisible(false);
          setSelectedPrayer(null);
        }}
      >
        <View className="flex-1 justify-end bg-black/60">
          <SafeAreaView
            className="rounded-t-[32px] border border-slate-800 bg-slate-900"
            edges={['bottom']}
            style={styles.sheet}
          >
            <View className="items-center pt-3">
              <View className="h-1.5 w-12 rounded-full bg-slate-700" />
            </View>

            <View className="flex-row items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-4">
              <TouchableOpacity
                onPress={() => {
                  setDetailModalVisible(false);
                  setSelectedPrayer(null);
                }}
                className="h-11 w-11 items-center justify-center rounded-full bg-slate-800"
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text className="flex-1 px-3 text-center text-xl font-bold text-white">Prayer</Text>
              <View className="h-11 w-11" />
            </View>

            {selectedPrayer && (
              <ScrollView className="px-6 py-6" showsVerticalScrollIndicator={false}>
                <View className={`mb-5 self-start rounded-full px-3 py-2 ${
                  selectedPrayer.is_answered ? 'bg-emerald-500/15' : 'bg-[#E94B7B]/15'
                }`}>
                  <Text className={`text-xs font-bold uppercase ${
                    selectedPrayer.is_answered ? 'text-emerald-300' : 'text-[#E94B7B]'
                  }`}>
                    {selectedPrayer.is_answered ? 'Answered' : 'In Prayer'}
                  </Text>
                </View>

                <Text className="mb-3 text-3xl font-bold leading-10 text-white">{selectedPrayer.title}</Text>
                <Text className="mb-8 text-sm text-slate-400">
                  {formatPrayerDate(selectedPrayer.created_at)}
                </Text>

                <View className="rounded-3xl bg-slate-800 p-5">
                  <Text className="text-base leading-8 text-slate-200">{selectedPrayer.note}</Text>
                </View>
              </ScrollView>
            )}

            {selectedPrayer && (
              <View className="border-t border-slate-800 bg-slate-900 px-6 pb-6 pt-4">
                {!selectedPrayer.is_answered && (
                  <TouchableOpacity
                    className="mb-3 rounded-full bg-[#E94B7B] py-4"
                    onPress={() => handleMarkAsAnswered(selectedPrayer)}
                    activeOpacity={0.85}
                  >
                    <Text className="text-white text-center font-semibold text-lg">
                      Mark as Answered
                    </Text>
                  </TouchableOpacity>
                )}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 rounded-full bg-slate-800 py-4"
                    onPress={startEditing}
                    activeOpacity={0.85}
                  >
                    <Text className="text-center font-semibold text-white">Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 rounded-full bg-red-500/15 py-4"
                    onPress={() => handleDeletePrayer(selectedPrayer)}
                    activeOpacity={0.85}
                  >
                    <Text className="text-center font-semibold text-red-300">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  sheet: {
    maxHeight: '92%',
    width: '100%',
  },
  sheetScrollContent: {
    paddingBottom: 32,
  },
});

export default PrayerScreen;
