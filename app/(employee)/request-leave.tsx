import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useCreateLeave, useMyLeaveBalances } from '@/features/leaves/hooks';
import type { LeaveDuration } from '@/features/leaves/api';
// Defensive import for DateTimePicker to prevent top-level crash
let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (e) {
  console.warn('DateTimePicker native module not found');
}
import { formatDateDMY, parseDMY } from '@/lib/datetime';

const LEAVE_TYPES = [
  { key: 'CASUAL', label: 'Casual' },
  { key: 'SICK', label: 'Sick' },
  { key: 'VACATION', label: 'Annual / Vacation' },
  { key: 'OTHER', label: 'Other / Unpaid' },
];

const DURATIONS: Array<{ key: LeaveDuration; label: string; caption: string }> = [
  { key: 'FULL_DAY', label: 'Full day', caption: 'Counts as 1 day' },
  { key: 'FIRST_HALF', label: 'Morning', caption: 'First half · 0.5 day' },
  { key: 'SECOND_HALF', label: 'Afternoon', caption: 'Second half · 0.5 day' },
];

interface PickedAttachment {
  fileName: string;
  mimeType: string;
  data: string;
  size: number;
}

function guessMimeType(fileName: string, mimeType?: string) {
  if (mimeType && mimeType !== 'application/octet-stream') return mimeType;
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

/** Send the picked calendar day as UTC midnight so @db.Date never shifts. */
function toApiDate(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatCycleDate(value?: string) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  return formatDateDMY(new Date(year, month - 1, day));
}

function RequestLeaveScreen() {
  const router = useRouter();
  const createLeave = useCreateLeave();
  const { data: balances, isLoading: loadingBalances } = useMyLeaveBalances();

  const [type, setType] = useState('CASUAL');
  const [duration, setDuration] = useState<LeaveDuration>('FULL_DAY');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState<PickedAttachment | null>(null);
  const [pickingFile, setPickingFile] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const isHalfDay = duration !== 'FULL_DAY';

  const handlePickAttachment = async () => {
    try {
      setPickingFile(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        Alert.alert('File too large', 'Medical notes must be 5 MB or smaller.');
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
      setAttachment({
        fileName: asset.name,
        mimeType: guessMimeType(asset.name, asset.mimeType),
        data: base64,
        size: asset.size ?? Math.ceil((base64.length * 3) / 4),
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Attachment error', 'Could not read the selected file.');
    } finally {
      setPickingFile(false);
    }
  };

  const handleSubmit = async () => {
    if (reason.length < 5) return Alert.alert('Error', 'Please provide a reason (min 5 chars)');
    if (!isHalfDay && endDate < startDate) {
      return Alert.alert('Error', 'End date cannot be before start date');
    }
    if (isHalfDay && !isSameLocalDay(startDate, endDate)) {
      return Alert.alert('Error', 'A half-day leave must be on a single date.');
    }

    try {
      await createLeave.mutateAsync({
        type: type as 'SICK' | 'CASUAL' | 'VACATION' | 'OTHER',
        duration,
        startDate: toApiDate(startDate),
        endDate: toApiDate(isHalfDay ? startDate : endDate),
        reason,
        ...(attachment
          ? {
              attachment: {
                fileName: attachment.fileName,
                mimeType: attachment.mimeType,
                data: attachment.data,
              },
            }
          : {}),
      });
      Alert.alert('Success', 'Leave request submitted!');
      router.back();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to submit request';
      Alert.alert('Error', msg);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'Request Leave', headerShown: true, headerBackTitle: 'Cancel' }} />

      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* ── Leave Quota Balance Strip ── */}
        <View className="mb-6 p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">
              {balances?.cycleStart
                ? `${formatCycleDate(balances.cycleStart)} – ${formatCycleDate(balances.cycleEnd)}`
                : `${new Date().getFullYear()} Leave Allowances`}
            </Text>
            {loadingBalances && <ActivityIndicator size="small" color="#5B6EF5" />}
          </View>
          <Text className="text-[10px] text-[#94A3B8] mb-3">
            Your leave year starts on your joining anniversary. Unused days carry forward.
          </Text>

          <View className="flex-row gap-2">
            <View className="flex-1 bg-white p-2.5 rounded-xl border border-[#E2E8F0] items-center">
              <Text className="text-[11px] font-semibold text-[#64748B]">Casual</Text>
              <Text className="text-base font-extrabold text-[#1E293B]">
                {balances?.casual?.remaining ?? '—'}
              </Text>
              <Text className="text-[10px] text-[#94A3B8]">
                of {balances?.casual?.total ?? '—'} left
              </Text>
              {(balances?.casual?.carryForward ?? 0) > 0 && (
                <Text className="text-[9px] text-[#5B6EF5] font-semibold">
                  +{balances?.casual?.carryForward} carried
                </Text>
              )}
            </View>

            <View className="flex-1 bg-white p-2.5 rounded-xl border border-[#E2E8F0] items-center">
              <Text className="text-[11px] font-semibold text-[#64748B]">Sick</Text>
              <Text className="text-base font-extrabold text-[#1E293B]">
                {balances?.sick?.remaining ?? '—'}
              </Text>
              <Text className="text-[10px] text-[#94A3B8]">
                of {balances?.sick?.total ?? '—'} left
              </Text>
              {(balances?.sick?.carryForward ?? 0) > 0 && (
                <Text className="text-[9px] text-[#5B6EF5] font-semibold">
                  +{balances?.sick?.carryForward} carried
                </Text>
              )}
            </View>

            <View className="flex-1 bg-white p-2.5 rounded-xl border border-[#E2E8F0] items-center">
              <Text className="text-[11px] font-semibold text-[#64748B]">Annual</Text>
              <Text className="text-base font-extrabold text-[#1E293B]">
                {balances?.vacation?.remaining ?? '—'}
              </Text>
              <Text className="text-[10px] text-[#94A3B8]">
                of {balances?.vacation?.total ?? '—'} left
              </Text>
              {(balances?.vacation?.carryForward ?? 0) > 0 && (
                <Text className="text-[9px] text-[#5B6EF5] font-semibold">
                  +{balances?.vacation?.carryForward} carried
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Leave Type */}
        <View className="mb-6">
          <Text className="text-[13px] font-bold text-[#64748B] mb-2.5 uppercase tracking-wide">Leave Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {LEAVE_TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                className={`px-3 py-2.5 rounded-xl border ${type === t.key ? 'bg-[#1C2840] border-[#1C2840]' : 'bg-[#F3F4F8] border-[#E5E9F2]'}`}
                onPress={() => setType(t.key)}
              >
                <Text className={`text-xs font-semibold ${type === t.key ? 'text-white' : 'text-[#1C2840]'}`}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration */}
        <View className="mb-6">
          <Text className="text-[13px] font-bold text-[#64748B] mb-2.5 uppercase tracking-wide">Duration</Text>
          <View className="flex-row gap-2">
            {DURATIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                className={`flex-1 rounded-xl border px-2 py-3 ${duration === option.key ? 'border-[#5B6EF5] bg-[#EEF2FF]' : 'border-[#E5E9F2] bg-[#F3F4F8]'}`}
                onPress={() => {
                  setDuration(option.key);
                  if (option.key !== 'FULL_DAY') setEndDate(startDate);
                }}
              >
                <Text className={`text-center text-xs font-bold ${duration === option.key ? 'text-[#4F46E5]' : 'text-[#1C2840]'}`}>
                  {option.label}
                </Text>
                <Text className={`mt-1 text-center text-[9px] font-medium ${duration === option.key ? 'text-[#6366F1]' : 'text-[#94A3B8]'}`}>
                  {option.caption}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {isHalfDay && (
            <Text className="mt-2 text-[11px] font-medium text-[#64748B]">
              Half-day leave deducts 0.5 day and keeps the attendance record open for the other half.
            </Text>
          )}
        </View>

        {/* Start Date */}
        <View className="mb-6">
          <Text className="text-[13px] font-bold text-[#64748B] mb-2.5 uppercase tracking-wide">
            {isHalfDay ? 'Leave Date' : 'Start Date'}
          </Text>
          <TouchableOpacity
            className="p-4 bg-[#F3F4F8] rounded-xl flex-row items-center gap-3 border border-[#E5E9F2]"
            onPress={() => setShowStart(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#5B6EF5" />
            <Text className="text-base font-semibold text-[#1C2840]">{formatDateDMY(startDate, 'dd MMMM yyyy')}</Text>
          </TouchableOpacity>
          {showStart && DateTimePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              onChange={(e: any, date?: Date) => {
                setShowStart(false);
                if (date) {
                  setStartDate(date);
                  if (isHalfDay) setEndDate(date);
                }
              }}
            />
          )}
          {showStart && !DateTimePicker && (
            <TextInput
              className="p-3 bg-[#FEF2F2] rounded-xl mt-2 text-base font-bold text-[#5B6EF5] border border-[#FECACA]"
              placeholder="DD-MM-YYYY"
              onSubmitEditing={(e) => {
                const d = parseDMY(e.nativeEvent.text);
                if (d) {
                  setStartDate(d);
                  if (isHalfDay) setEndDate(d);
                }
                setShowStart(false);
              }}
              autoFocus
            />
          )}
        </View>

        {/* End Date */}
        {!isHalfDay && (
        <View className="mb-6">
          <Text className="text-[13px] font-bold text-[#64748B] mb-2.5 uppercase tracking-wide">End Date</Text>
          <TouchableOpacity
            className="p-4 bg-[#F3F4F8] rounded-xl flex-row items-center gap-3 border border-[#E5E9F2]"
            onPress={() => setShowEnd(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#5B6EF5" />
            <Text className="text-base font-semibold text-[#1C2840]">{formatDateDMY(endDate, 'dd MMMM yyyy')}</Text>
          </TouchableOpacity>
          {showEnd && DateTimePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              onChange={(e: any, date?: Date) => { setShowEnd(false); if (date) setEndDate(date); }}
            />
          )}
          {showEnd && !DateTimePicker && (
            <TextInput
              className="p-3 bg-[#FEF2F2] rounded-xl mt-2 text-base font-bold text-[#5B6EF5] border border-[#FECACA]"
              placeholder="DD-MM-YYYY"
              onSubmitEditing={(e) => {
                const d = parseDMY(e.nativeEvent.text);
                if (d) setEndDate(d);
                setShowEnd(false);
              }}
              autoFocus
            />
          )}
        </View>
        )}

        {/* Medical attachment */}
        <View className="mb-6">
          <Text className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-[#64748B]">
            Medical note <Text className="normal-case text-[#94A3B8]">(optional)</Text>
          </Text>
          {attachment ? (
            <View className="flex-row items-center gap-3 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] p-3.5">
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Ionicons
                  name={attachment.mimeType === 'application/pdf' ? 'document-text-outline' : 'image-outline'}
                  size={20}
                  color="#5B6EF5"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-[#1C2840]" numberOfLines={1}>
                  {attachment.fileName}
                </Text>
                <Text className="mt-0.5 text-[10px] font-medium text-[#64748B]">
                  {(attachment.size / 1024 / 1024).toFixed(2)} MB · attached
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAttachment(null)}
                className="h-8 w-8 items-center justify-center rounded-full bg-white"
              >
                <Ionicons name="close" size={17} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handlePickAttachment}
              disabled={pickingFile}
              className="flex-row items-center gap-3 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4"
            >
              {pickingFile ? (
                <ActivityIndicator size="small" color="#5B6EF5" />
              ) : (
                <Ionicons name="attach-outline" size={21} color="#5B6EF5" />
              )}
              <View className="flex-1">
                <Text className="text-sm font-bold text-[#1C2840]">Attach a medical note</Text>
                <Text className="mt-0.5 text-[10px] text-[#94A3B8]">
                  PDF, JPG, PNG, or WEBP · up to 5 MB
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Reason */}
        <View className="mb-6">
          <Text className="text-[13px] font-bold text-[#64748B] mb-2.5 uppercase tracking-wide">Reason for Leave</Text>
          <TextInput
            className="p-4 bg-[#F3F4F8] rounded-xl min-h-[120px] text-[15px] text-[#1C2840] border border-[#E5E9F2]"
            multiline
            placeholder="Please explain why you need leave..."
            placeholderTextColor="#64748B"
            value={reason}
            onChangeText={setReason}
            textAlignVertical="top"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          className={`bg-[#5B6EF5] py-[18px] rounded-2xl items-center mt-2.5 ${createLeave.isPending ? 'opacity-70' : ''}`}
          onPress={handleSubmit}
          disabled={createLeave.isPending}
        >
          {createLeave.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-extrabold">Submit Request</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

export default RequestLeaveScreen;