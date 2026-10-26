import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreateLeave, useMyLeaveBalances } from '@/features/leaves/hooks';
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
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const handleSubmit = async () => {
    if (reason.length < 5) return Alert.alert('Error', 'Please provide a reason (min 5 chars)');
    if (endDate < startDate) return Alert.alert('Error', 'End date cannot be before start date');

    try {
      await createLeave.mutateAsync({
        type,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason
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

        {/* Start Date */}
        <View className="mb-6">
          <Text className="text-[13px] font-bold text-[#64748B] mb-2.5 uppercase tracking-wide">Start Date</Text>
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
              onChange={(e: any, date?: Date) => { setShowStart(false); if (date) setStartDate(date); }}
            />
          )}
          {showStart && !DateTimePicker && (
            <TextInput
              className="p-3 bg-[#FEF2F2] rounded-xl mt-2 text-base font-bold text-[#5B6EF5] border border-[#FECACA]"
              placeholder="DD-MM-YYYY"
              onSubmitEditing={(e) => {
                const d = parseDMY(e.nativeEvent.text);
                if (d) setStartDate(d);
                setShowStart(false);
              }}
              autoFocus
            />
          )}
        </View>

        {/* End Date */}
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