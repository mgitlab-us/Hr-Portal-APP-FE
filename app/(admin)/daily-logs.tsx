import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator,
  StatusBar, Platform, Modal, TextInput, Alert, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useDailyLogs } from '@/hooks/useDailyLogs';

const C = {
  navy: '#0D1B2A',
  navyMid: '#1a2d42',
  bg: '#F4F5F7',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  text: '#0D1B2A',
  sub: '#64748B',
  muted: '#94A3B8',
  accent: '#6366F1',
  accentLight: '#EEF2FF',
  green: '#16A34A',
  greenLight: '#F0FDF4',
  red: '#EF4444',
  redLight: '#FEF2F2',
  redText: '#B91C1C',
  greenText: '#15803D',
  white: '#FFFFFF',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_PALETTES = [
  { bg: '#EEF2FF', color: '#4F46E5' },
  { bg: '#F0FDF4', color: '#15803D' },
  { bg: '#FFF7ED', color: '#C2410C' },
  { bg: '#FDF2F8', color: '#9D174D' },
  { bg: '#ECFDF5', color: '#065F46' },
];

function getAvatarPalette(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[idx];
}

export default function DailyLogsScreen() {
  const {
    date, setDate, showPicker, setShowPicker,
    loading, refreshing, logs, onRefresh, correctRecord,
  } = useDailyLogs();

  const [editingLog, setEditingLog] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const openCorrection = (item: any) => {
    setEditingLog(item);
    setCheckin(item.checkinAt || '');
    setCheckout(item.checkoutAt || '');
    setModalVisible(true);
  };

  const handleSaveCorrection = async () => {
    try {
      await correctRecord(editingLog.id, {
        checkinTime: checkin || undefined,
        checkoutTime: checkout || undefined,
      });
      setModalVisible(false);
      Alert.alert('Updated', 'Attendance record has been corrected.');
    } catch {
      Alert.alert('Error', 'Failed to update record.');
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const palette = getAvatarPalette(item.name);
    const isPresent = item.status?.toLowerCase() === 'present';

    return (
      <View style={s.card}>
        {/* Top row */}
        <View style={s.cardTop}>
          <View style={[s.avatar, { backgroundColor: palette.bg }]}>
            <Text style={[s.avatarText, { color: palette.color }]}>{getInitials(item.name)}</Text>
          </View>
          <View style={s.empInfo}>
            <Text style={s.empName}>{item.name}</Text>
            <Text style={s.empRole}>{item.designation}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: isPresent ? C.greenLight : C.redLight }]}>
            <View style={[s.statusDot, { backgroundColor: isPresent ? C.green : C.red }]} />
            <Text style={[s.statusText, { color: isPresent ? C.greenText : C.redText }]}>
              {item.status}
            </Text>
          </View>
          <TouchableOpacity style={s.editBtn} onPress={() => openCorrection(item)}>
            <Ionicons name="pencil-outline" size={15} color={C.sub} />
          </TouchableOpacity>
        </View>

        {/* Time footer */}
        <View style={s.cardFooter}>
          <View style={s.timeBlock}>
            <View style={[s.timeIconWrap, { backgroundColor: C.accentLight }]}>
              <Ionicons name="enter-outline" size={15} color={C.accent} />
            </View>
            <View style={s.timeTextCol}>
              <Text style={s.timeLabel}>Check in</Text>
              <Text style={s.timeVal}>{item.checkin || '--:--'}</Text>
            </View>
          </View>
          <View style={s.timeDivider} />
          <View style={s.timeBlock}>
            <View style={[s.timeIconWrap, { backgroundColor: C.greenLight }]}>
              <Ionicons name="exit-outline" size={15} color={C.green} />
            </View>
            <View style={s.timeTextCol}>
              <Text style={s.timeLabel}>Check out</Text>
              <Text style={s.timeVal}>{item.checkout || '--:--'}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={[C.navy, C.navyMid]} style={s.header}>
        <SafeAreaView edges={['top']}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={20} color="#FFF" />
            </TouchableOpacity>
            <View>
              <Text style={s.headerTitle}>Daily Logs</Text>
              <Text style={s.headerSub}>Monitoring team attendance</Text>
            </View>
          </View>

          <TouchableOpacity style={s.datePill} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={18} color={C.accent} />
            <Text style={s.datePillText}>{format(date, 'EEEE, dd MMMM yyyy')}</Text>
            <Ionicons name="chevron-down" size={16} color={C.muted} />
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {loading && !refreshing ? (
        <View style={s.center}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={s.loadingText}>Syncing records...</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item, idx) => item.id || idx.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListHeaderComponent={
            logs.length > 0 ? (
              <View style={s.listHeader}>
                <Text style={s.listHeaderLabel}>Today's Records</Text>
                <View style={s.listHeaderCount}>
                  <Text style={s.listHeaderCountText}>{logs.length} employees</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="document-text-outline" size={30} color={C.muted} />
              </View>
              <Text style={s.emptyTitle}>No records found</Text>
              <Text style={s.emptySub}>No attendance data for this date</Text>
            </View>
          }
        />
      )}

      {/* Correction Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Manual Correction</Text>
              <TouchableOpacity style={s.modalClose} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={18} color={C.sub} />
              </TouchableOpacity>
            </View>
            <Text style={s.modalSub}>Editing record for {editingLog?.name}</Text>

            <View style={s.inputGroup}>
              <Text style={s.label}>Check-in Time (ISO)</Text>
              <TextInput
                style={s.input}
                value={checkin}
                onChangeText={setCheckin}
                placeholder="e.g. 2024-03-20T09:00:00Z"
                placeholderTextColor={C.muted}
              />
            </View>
            <View style={s.inputGroup}>
              <Text style={s.label}>Check-out Time (ISO)</Text>
              <TextInput
                style={s.input}
                value={checkout}
                onChangeText={setCheckout}
                placeholder="e.g. 2024-03-20T18:00:00Z"
                placeholderTextColor={C.muted}
              />
            </View>

            <TouchableOpacity style={s.saveBtn} onPress={handleSaveCorrection}>
              <Text style={s.saveBtnText}>Save Correction</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: { paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2, fontWeight: '500' },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderRadius: 16, padding: 13, marginTop: 16 },
  datePillText: { flex: 1, fontSize: 14, fontWeight: '700', color: C.navy },

  // List
  list: { padding: 14, paddingBottom: 80 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingHorizontal: 2 },
  listHeaderLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase' },
  listHeaderCount: { backgroundColor: C.accentLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  listHeaderCountText: { fontSize: 11, fontWeight: '700', color: C.accent },

  // Card
  card: { backgroundColor: C.card, borderRadius: 20, marginBottom: 12, borderWidth: 0.5, borderColor: C.border, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  avatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 14, fontWeight: '700' },
  empInfo: { flex: 1 },
  empName: { fontSize: 15, fontWeight: '700', color: C.text },
  empRole: { fontSize: 11, color: C.muted, marginTop: 2, fontWeight: '500' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  editBtn: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#F8FAFC', borderWidth: 0.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },

  // Card footer
  cardFooter: { borderTopWidth: 0.5, borderTopColor: C.borderLight, flexDirection: 'row' },
  timeBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  timeDivider: { width: 0.5, backgroundColor: C.borderLight, marginVertical: 10 },
  timeIconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  timeTextCol: { flexDirection: 'column' },
  timeLabel: { fontSize: 10, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  timeVal: { fontSize: 14, fontWeight: '700', color: C.text, fontVariant: ['tabular-nums'], marginTop: 2 },

  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: C.sub, fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { width: 68, height: 68, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 5 },
  emptySub: { fontSize: 13, color: C.sub },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalSub: { fontSize: 13, color: C.sub, marginBottom: 24, fontWeight: '500' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', color: C.sub, marginBottom: 7 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.text, borderWidth: 0.5, borderColor: C.border },
  saveBtn: { backgroundColor: C.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
});