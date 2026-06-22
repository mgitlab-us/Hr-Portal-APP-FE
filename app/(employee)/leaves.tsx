import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMyLeaves } from '@/features/leaves/hooks';
import { format } from 'date-fns';
import { LeaveRequest } from '@/features/leaves/api';

export default function LeavesScreen() {
  const router = useRouter();
  const { data: leaves, isLoading, refetch } = useMyLeaves();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return { badge: 'bg-emerald-100', text: 'text-emerald-600' };
      case 'REJECTED': return { badge: 'bg-rose-100', text: 'text-rose-500' };
      default:         return { badge: 'bg-amber-100', text: 'text-amber-600' };
    }
  };

  return (
    <View className="flex-1 bg-[#F3F4F8]">
      <Stack.Screen options={{ title: 'My Leaves', headerShown: true }} />

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-5">
          <Text className="text-xl font-extrabold text-[#1C2840]">Leave History</Text>
          <TouchableOpacity
            className="bg-[#5B6EF5] px-4 py-2.5 rounded-xl flex-row items-center gap-1.5"
            onPress={() => router.push('/(employee)/request-leave')}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text className="text-white font-bold text-sm">New Request</Text>
          </TouchableOpacity>
        </View>

        {/* Loading */}
        {isLoading ? (
          <ActivityIndicator color="#5B6EF5" style={{ marginTop: 40 }} />
        ) : leaves?.length === 0 ? (
          /* Empty */
          <View className="items-center mt-16 opacity-50">
            <Ionicons name="airplane-outline" size={64} color="#E5E9F2" />
            <Text className="mt-3 text-base text-[#96A0B5] font-semibold">No leave requests yet</Text>
          </View>
        ) : (
          /* Cards */
          leaves?.map((leave: LeaveRequest) => {
            const { badge, text } = getStatusColor(leave.status);
            return (
              <View
                key={leave.id}
                className="bg-white rounded-2xl p-4 mb-4 border border-[#E5E9F2]"
              >
                {/* Card header */}
                <View className="flex-row justify-between items-start mb-3">
                  <View>
                    <Text className="text-base font-bold text-[#1C2840] mb-0.5">{leave.type}</Text>
                    <Text className="text-[13px] text-[#96A0B5]">
                      {format(new Date(leave.startDate), 'MMM dd')} -{' '}
                      {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                  <View className={`px-2.5 py-1 rounded-lg ${badge}`}>
                    <Text className={`text-[11px] font-extrabold ${text}`}>{leave.status}</Text>
                  </View>
                </View>

                {/* Reason */}
                <Text className="text-sm text-[#1C2840] leading-5" numberOfLines={2}>
                  {leave.reason}
                </Text>

                {/* Admin note */}
                {leave.reviewNote && (
                  <View className="mt-3 p-3 bg-[#F3F4F8] rounded-lg">
                    <Text className="text-[11px] font-extrabold text-[#96A0B5] mb-0.5 uppercase">
                      Admin Note:
                    </Text>
                    <Text className="text-[13px] text-[#1C2840] italic">{leave.reviewNote}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}