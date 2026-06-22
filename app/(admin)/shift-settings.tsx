import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useShifts } from '@/hooks/useShifts';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { DMMono_500Medium } from '@expo-google-fonts/dm-mono';

const C = {
  navy: '#0D1B2A',
  bg: '#F4F5F7',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  text: '#0D1B2A',
  sub: '#64748B',
  muted: '#94A3B8',
  accent: '#6366F1',
  accentLight: '#EEF2FF',
  teal: '#0D9488',
  tealLight: '#CCFBF1',
  amber: '#D97706',
  amberLight: '#FEF3C7',
  rose: '#DB2777',
  roseLight: '#FDF2F8',
  indigo: '#6366F1',
  indigoLight: '#EEF2FF',
  white: '#FFFFFF',
};

type ShiftColor = {
  accent: string;
  gradEnd: string;
  iconBg: string;
  iconColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  timeColor: string;
};

function getShiftStyle(name: string): ShiftColor {
  const n = name.toLowerCase();
  if (n.includes('morning') || n.includes('day'))
    return { accent: '#F59E0B', gradEnd: '#FBBF24', iconBg: C.amberLight, iconColor: C.amber, icon: 'sunny-outline', timeColor: C.amber };
  if (n.includes('night'))
    return { accent: C.teal, gradEnd: '#14B8A6', iconBg: C.tealLight, iconColor: C.teal, icon: 'moon-outline', timeColor: C.teal };
  if (n.includes('evening') || n.includes('afternoon'))
    return { accent: C.accent, gradEnd: '#818CF8', iconBg: C.accentLight, iconColor: C.accent, icon: 'partly-sunny-outline', timeColor: C.accent };
  return { accent: C.accent, gradEnd: '#818CF8', iconBg: C.accentLight, iconColor: C.accent, icon: 'time-outline', timeColor: C.accent };
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h 00m` : `${h}h ${m}m`;
}

function formatCheckin(hour: number, minute: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:${String(minute).padStart(2, '0')} ${period}`;
}

export default function ShiftSettingsScreen() {
  const { shifts, loading, refreshing, onRefresh, createShift, updateShift, deleteShift } = useShifts();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);

  const [name, setName] = useState('');
  const [checkinHour, setCheckinHour] = useState('09');
  const [checkinMin, setCheckinMin] = useState('00');
  const [workHours, setWorkHours] = useState('8');
  const [workMinutes, setWorkMinutes] = useState('0');
  const [breakHours, setBreakHours] = useState('1');
  const [breakMinutes, setBreakMinutes] = useState('0');
  const [graceMin, setGraceMin] = useState('15');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  const openModal = (shift?: any) => {
    if (shift) {
      setEditingShift(shift);
      setName(shift.name);
      setCheckinHour(String(shift.expectedCheckinHour % 12 || 12).padStart(2, '0'));
      setCheckinMin(String(shift.expectedCheckinMinute).padStart(2, '0'));
      setPeriod(shift.expectedCheckinHour >= 12 ? 'PM' : 'AM');
      setWorkHours(String(Math.floor(shift.workMinutesPerDay / 60)));
      setWorkMinutes(String(shift.workMinutesPerDay % 60));
      setBreakHours(String(Math.floor(shift.breakMinutesAllocated / 60)));
      setBreakMinutes(String(shift.breakMinutesAllocated % 60));
      setGraceMin(String(shift.gracePeriodMinutes));
    } else {
      setEditingShift(null);
      setName('');
      setCheckinHour('09');
      setCheckinMin('00');
      setPeriod('AM');
      setWorkHours('8');
      setWorkMinutes('0');
      setBreakHours('1');
      setBreakMinutes('0');
      setGraceMin('15');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Please enter a profile name');
    const h = parseInt(checkinHour);
    const finalH = period === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
    const data = {
      name,
      expectedCheckinHour: finalH,
      expectedCheckinMinute: parseInt(checkinMin),
      workMinutesPerDay: parseInt(workHours) * 60 + parseInt(workMinutes),
      breakMinutesAllocated: parseInt(breakHours) * 60 + parseInt(breakMinutes),
      gracePeriodMinutes: parseInt(graceMin),
    };
    try {
      if (editingShift) await updateShift(editingShift.id, data);
      else await createShift(data);
      setModalVisible(false);
    } catch { }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete Shift',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteShift(id) },
      ]
    );
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={[C.navy, '#1a2d42']} style={s.header}>
        <SafeAreaView edges={['top']}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="chevron-back" size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.headerLabel}>WORKPLACE</Text>
              <Text style={s.headerTitle}>Shift Rules</Text>
            </View>
            <TouchableOpacity onPress={() => openModal()} style={s.addBtn}>
              <Ionicons name="add" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {loading && !refreshing ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />
        ) : shifts.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="calendar-outline" size={32} color={C.muted} />
            </View>
            <Text style={s.emptyTitle}>No shift profiles yet</Text>
            <Text style={s.emptySubtitle}>Create your first shift to get started</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => openModal()}>
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={s.emptyBtnText}>Create Shift</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={s.sectionLabel}>{shifts.length} Active Profile{shifts.length !== 1 ? 's' : ''}</Text>
            {shifts.map((shift) => {
              const style = getShiftStyle(shift.name);
              return (
                <View key={shift.id} style={s.card}>
                  {/* Colored accent bar */}


                  <View style={s.cardBody}>
                    {/* Card header */}
                    <View style={s.cardTop}>
                      <View style={s.shiftNameRow}>
                        <View style={[s.shiftIcon, { backgroundColor: style.iconBg }]}>
                          <Ionicons name={style.icon} size={22} color={style.iconColor} />
                        </View>
                        <View>
                          <Text style={s.shiftName}>{shift.name}</Text>
                          <View style={s.shiftMetaRow}>
                            <View style={s.timeTag}>
                              <Ionicons name="time-outline" size={11} color={style.timeColor} />
                              <Text style={[s.timeTagText, { color: style.timeColor }]}>
                                {formatCheckin(shift.expectedCheckinHour, shift.expectedCheckinMinute)}
                              </Text>
                            </View>
                            {shift.isDefault && (
                              <View style={s.defaultBadge}>
                                <Text style={s.defaultBadgeText}>Default</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                      <View style={s.cardActions}>
                        <TouchableOpacity onPress={() => openModal(shift)} style={s.actionBtn}>
                          <Ionicons name="pencil-outline" size={16} color={C.sub} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => confirmDelete(shift.id)} style={[s.actionBtn, s.actionBtnDanger]}>
                          <Ionicons name="trash-outline" size={16} color={C.rose} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={s.divider} />

                    {/* Stats grid */}
                    <View style={s.statsGrid}>
                      <View style={s.statPill}>
                        <View style={[s.statIconWrap, { backgroundColor: C.accentLight }]}>
                          <Ionicons name="hourglass-outline" size={15} color={C.accent} />
                        </View>
                        <View>
                          <Text style={s.statLabel}>DURATION</Text>
                          <Text style={s.statValue}>{formatDuration(shift.workMinutesPerDay)}</Text>
                        </View>
                      </View>
                      <View style={s.statPill}>
                        <View style={[s.statIconWrap, { backgroundColor: C.amberLight }]}>
                          <Ionicons name="cafe-outline" size={15} color={C.amber} />
                        </View>
                        <View>
                          <Text style={s.statLabel}>BREAK</Text>
                          <Text style={s.statValue}>{shift.breakMinutesAllocated} min</Text>
                        </View>
                      </View>
                      <View style={[s.statPill, s.statPillFull]}>
                        <View style={[s.statIconWrap, { backgroundColor: C.roseLight }]}>
                          <Ionicons name="shield-checkmark-outline" size={15} color={C.rose} />
                        </View>
                        <View>
                          <Text style={s.statLabel}>GRACE PERIOD</Text>
                          <Text style={s.statValue}>{shift.gracePeriodMinutes} min</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingShift ? 'Edit Profile' : 'New Shift Profile'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={s.modalClose}>
                <Ionicons name="close" size={20} color={C.sub} />
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
              <View style={s.inputGroup}>
                <Text style={s.label}>Profile Name</Text>
                <TextInput
                  style={s.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Morning Shift"
                  placeholderTextColor={C.muted}
                />
              </View>

              <Text style={s.sectionDividerLabel}>Check-in Time</Text>
              <View style={s.row}>
                <View style={[s.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={s.label}>Hour (01–12)</Text>
                  <TextInput style={s.input} value={checkinHour} onChangeText={setCheckinHour} keyboardType="numeric" maxLength={2} />
                </View>
                <View style={[s.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={s.label}>Minute (00–59)</Text>
                  <TextInput style={s.input} value={checkinMin} onChangeText={setCheckinMin} keyboardType="numeric" maxLength={2} />
                </View>
                <View style={[s.inputGroup, { flex: 0.8 }]}>
                  <Text style={s.label}>Period</Text>
                  <View style={s.periodContainer}>
                    <TouchableOpacity 
                      style={[s.periodBtn, period === 'AM' && s.periodBtnActive]} 
                      onPress={() => setPeriod('AM')}
                    >
                      <Text style={[s.periodText, period === 'AM' && s.periodTextActive]}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[s.periodBtn, period === 'PM' && s.periodBtnActive]} 
                      onPress={() => setPeriod('PM')}
                    >
                      <Text style={[s.periodText, period === 'PM' && s.periodTextActive]}>PM</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={s.sectionDividerLabel}>Work Duration</Text>
              <View style={s.row}>
                <View style={[s.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={s.label}>Hours</Text>
                  <TextInput style={s.input} value={workHours} onChangeText={setWorkHours} keyboardType="numeric" maxLength={2} />
                </View>
                <View style={[s.inputGroup, { flex: 1 }]}>
                  <Text style={s.label}>Minutes</Text>
                  <TextInput style={s.input} value={workMinutes} onChangeText={setWorkMinutes} keyboardType="numeric" maxLength={2} />
                </View>
              </View>

              <Text style={s.sectionDividerLabel}>Break & Grace</Text>
              <View style={s.row}>
                <View style={[s.inputGroup, { flex: 0.8, marginRight: 10 }]}>
                  <Text style={s.label}>Break (min)</Text>
                  <TextInput style={s.input} value={breakMinutes} onChangeText={setBreakMinutes} keyboardType="numeric" />
                </View>
                <View style={[s.inputGroup, { flex: 1 }]}>
                  <Text style={s.label}>Grace (min)</Text>
                  <TextInput style={s.input} value={graceMin} onChangeText={setGraceMin} keyboardType="numeric" />
                </View>
              </View>
              <View style={{ height: 16 }} />
            </ScrollView>

            <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
              <Text style={s.saveBtnText}>{editingShift ? 'Update Profile' : 'Create Profile'}</Text>
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
  header: { paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: 'rgba(255,255,255,0.4)' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginTop: 2 },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: C.accent },

  // List
  list: { padding: 16, paddingBottom: 110 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: C.muted, marginBottom: 12, paddingLeft: 4, textTransform: 'uppercase' },

  // Shift Card
  card: { backgroundColor: C.card, borderRadius: 20, marginBottom: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: C.border },
  cardAccent: { height: 4, width: '100%' },
  cardBody: { padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  shiftNameRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  shiftIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  shiftName: { fontSize: 16, fontWeight: '700', color: C.text },
  shiftMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  timeTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timeTagText: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  defaultBadge: { backgroundColor: C.accentLight, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  defaultBadgeText: { fontSize: 9, fontWeight: '800', color: C.accent, letterSpacing: 0.5, textTransform: 'uppercase' },
  cardActions: { flexDirection: 'row', gap: 6, flexShrink: 0 },
  actionBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderWidth: 0.5, borderColor: C.border },
  actionBtnDanger: {},

  // Divider
  divider: { height: 0.5, backgroundColor: C.borderLight, marginBottom: 14 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statPill: { flex: 1, minWidth: '45%', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 0.5, borderColor: C.borderLight },
  statPillFull: { flexBasis: '100%', flex: 0 },
  statIconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6, color: C.muted, textTransform: 'uppercase' },
  statValue: { fontSize: 14, fontWeight: '700', color: C.text, fontVariant: ['tabular-nums'], marginTop: 1 },

  // Empty
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: C.sub, marginBottom: 24 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.accent, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalBody: { marginBottom: 16 },

  sectionDividerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase', marginBottom: 12, marginTop: 4 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: C.sub, marginBottom: 7 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.text, borderWidth: 0.5, borderColor: C.border },
  row: { flexDirection: 'row' },
  hint: { fontSize: 11, color: C.muted, marginTop: 5, marginLeft: 2 },

  saveBtn: { backgroundColor: C.accent, borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
});