import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView, Platform,
  ActivityIndicator, StatusBar, Alert, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { correctionApi } from '@/features/corrections/api';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isValid, set } from 'date-fns';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

function firstParam(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  const v = Array.isArray(value) ? value[0] : value;
  return v?.length ? v : undefined;
}

function parseTimeParam(value: string | undefined, dateStr: string | undefined): Date {
  const fallback = new Date();
  if (!value || !dateStr) return fallback;
  try {
    const d = parseISO(value);
    if (!isValid(d)) return fallback;
    
    const base = parseISO(dateStr);
    return set(base, {
      hours: d.getHours(),
      minutes: d.getMinutes(),
    });
  } catch {
    return fallback;
  }
}

export default function RequestCorrectionScreen() {
  const params = useLocalSearchParams<{
    recordId: string;
    date: string;
    checkinTime?: string;
    checkoutTime?: string;
  }>();

  const recordId = firstParam(params.recordId);
  const date = firstParam(params.date);
  const checkinTime = firstParam(params.checkinTime);
  const checkoutTime = firstParam(params.checkoutTime);

  const defaultIn = useMemo(() => parseTimeParam(checkinTime, date), [checkinTime, date]);
  const defaultOut = useMemo(() => parseTimeParam(checkoutTime, date), [checkoutTime, date]);

  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [inTime, setInTime] = useState(defaultIn);
  const [outTime, setOutTime] = useState(defaultOut);

  const [showPicker, setShowPicker] = useState<'in' | 'out' | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!reason.trim()) return Alert.alert('Error', 'Please provide a reason');
    if (!recordId || !date) return;

    setLoading(true);
    try {
      await correctionApi.request({
        recordId,
        requestedCheckin: inTime.toISOString(),
        requestedCheckout: outTime.toISOString(),
        reason,
      });

      Alert.alert('Submitted', 'Your correction request has been sent for review.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [recordId, date, inTime, outTime, reason]);

  const displayDate = useMemo(() => {
    if (!date) return '';
    try {
      const d = parseISO(date);
      return isValid(d) ? format(d, 'MMMM dd, yyyy') : date;
    } catch {
      return date;
    }
  }, [date]);

  if (!recordId || !date) {
    return (
      <SafeAreaView style={s.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={s.missingWrap}>
          <Ionicons name="alert-circle-outline" size={48} color="#E8405A" />
          <Text style={s.missingTitle}>Record not found</Text>
          <Text style={s.missingSub}>Please go back and try again.</Text>
          <TouchableOpacity style={s.missingBtn} onPress={() => router.back()}>
            <Text style={s.missingBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F1D3A" />
        </TouchableOpacity>
        <View style={s.headerText}>
          <Text style={s.title}>Fix Record</Text>
          <Text style={s.subtitle}>{displayDate}</Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={s.card}>
          <Text style={s.cardTitle}>Requested Times</Text>

          <View style={s.timeRow}>
            <View style={s.timeCol}>
              <Text style={s.fieldLabel}>CHECK-IN</Text>
              <TouchableOpacity style={s.timeInput} onPress={() => setShowPicker('in')}>
                <Text style={s.timeValue}>{format(inTime, 'hh:mm a')}</Text>
              </TouchableOpacity>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#CBD5E1" style={s.timeArrow} />
            <View style={s.timeCol}>
              <Text style={s.fieldLabel}>CHECK-OUT</Text>
              <TouchableOpacity style={s.timeInput} onPress={() => setShowPicker('out')}>
                <Text style={s.timeValue}>{format(outTime, 'hh:mm a')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showPicker && (
            <DateTimePicker
              value={showPicker === 'in' ? inTime : outTime}
              mode="time"
              is24Hour={false}
              onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                setShowPicker(null);
                if (selectedDate) {
                  if (showPicker === 'in') setInTime(selectedDate);
                  else setOutTime(selectedDate);
                }
              }}
            />
          )}

          <View style={s.hint}>
            <Ionicons name="information-circle-outline" size={18} color="#5B6EF5" />
            <Text style={s.hintText}>Select time using 12-hour format with AM/PM</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Justification</Text>
          <Text style={s.fieldLabel}>REASON FOR CORRECTION</Text>
          <TextInput
            style={s.reasonInput}
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Forgot to check out while leaving for an emergency meeting."
            placeholderTextColor="#96A0B5"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[s.submitBtn, loading && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={s.submitInner}>
              <Text style={s.submitText}>Submit for Review</Text>
              <Ionicons name="send" size={18} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F4F8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', color: '#0B0F17' },
  subtitle: { fontSize: 14, fontWeight: '500', color: '#96A0B5', marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0B0F17', marginBottom: 16 },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  timeCol: { flex: 1 },
  timeArrow: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  timeInput: {
    backgroundColor: '#F3F4F8',
    borderWidth: 1.5,
    borderColor: '#E5E9F2',
    borderRadius: 16,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B0F17',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: '#EEF0FE',
    padding: 12,
    borderRadius: 12,
  },
  hintText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#5B6EF5' },
  reasonInput: {
    backgroundColor: '#F3F4F8',
    borderWidth: 1.5,
    borderColor: '#E5E9F2',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#0B0F17',
    minHeight: 120,
  },
  submitBtn: {
    backgroundColor: '#5B6EF5',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  missingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  missingTitle: { fontSize: 16, fontWeight: '700', color: '#0B0F17', marginTop: 16, textAlign: 'center' },
  missingSub: { fontSize: 14, color: '#96A0B5', marginTop: 4, textAlign: 'center' },
  missingBtn: { marginTop: 24, backgroundColor: '#5B6EF5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  missingBtnText: { color: '#fff', fontWeight: '600' },
});
