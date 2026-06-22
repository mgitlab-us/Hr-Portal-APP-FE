import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreateLeave } from '@/features/leaves/hooks';
// Defensive import for DateTimePicker to prevent top-level crash
let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (e) {
  console.warn('DateTimePicker native module not found');
}
import { format } from 'date-fns';

const LEAVE_TYPES = ['CASUAL', 'SICK', 'VACATION', 'OTHER'];

function RequestLeaveScreen() {
  const router = useRouter();
  const createLeave = useCreateLeave();

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
    } catch (e) {
      Alert.alert('Error', 'Failed to submit request');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'Request Leave', headerShown: true, headerBackTitle: 'Cancel' }} />

      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* Leave Type */}
        <View className="mb-6">
          <Text className="text-[13px] font-bold text-[#64748B] mb-2.5 uppercase tracking-wide">Leave Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {LEAVE_TYPES.map(t => (
              <TouchableOpacity
                key={t}
                className={`px-3 py-2 rounded-xl border ${type === t ? 'bg-[#1C2840] border-[#1C2840]' : 'bg-[#F3F4F8] border-[#E5E9F2]'}`}
                onPress={() => setType(t)}
              >
                <Text className={`text-xs font-semibold ${type === t ? 'text-white' : 'text-[#1C2840]'}`}>{t}</Text>
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
            <Text className="text-base font-semibold text-[#1C2840]">{format(startDate, 'PPP')}</Text>
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
              placeholder="YYYY-MM-DD"
              onSubmitEditing={(e) => {
                const d = new Date(e.nativeEvent.text);
                if (!isNaN(d.getTime())) setStartDate(d);
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
            <Text className="text-base font-semibold text-[#1C2840]">{format(endDate, 'PPP')}</Text>
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
              placeholder="YYYY-MM-DD"
              onSubmitEditing={(e) => {
                const d = new Date(e.nativeEvent.text);
                if (!isNaN(d.getTime())) setEndDate(d);
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