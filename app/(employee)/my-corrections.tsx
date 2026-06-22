import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, ActivityIndicator,
  StatusBar, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { attendanceApi } from '@/features/attendance/api';
import { format, parseISO } from 'date-fns';

const STATUS_CONFIG: Record<string, {
  label: string; color: string; iconColor: string;
  bgClass: string; textClass: string; icon: string;
}> = {
  PENDING: {
    label: 'Pending', color: '#D97706', iconColor: '#D97706',
    bgClass: 'bg-amber-50', textClass: 'text-amber-600',
    icon: 'time-outline',
  },
  APPROVED: {
    label: 'Approved', color: '#16A34A', iconColor: '#16A34A',
    bgClass: 'bg-green-50', textClass: 'text-green-600',
    icon: 'checkmark-circle-outline',
  },
  REJECTED: {
    label: 'Rejected', color: '#E11D48', iconColor: '#E11D48',
    bgClass: 'bg-red-50', textClass: 'text-red-500',
    icon: 'close-circle-outline',
  },
};

const fmtTime = (t?: string) => t ? format(parseISO(t), 'hh:mm a') : '--:--';

function TimeBlock({
  label, checkin, checkout, accent = false,
}: {
  label: string; checkin?: string; checkout?: string; accent?: boolean;
}) {
  return (
    <View className={`flex-1 rounded-xl px-3 py-2.5 ${accent ? 'bg-indigo-50' : 'bg-slate-50'}`}
      style={{ borderWidth: 0.5, borderColor: accent ? '#C7D2FE' : '#E2E8F0' }}
    >
      <Text className="text-[10px] font-bold uppercase tracking-widest mb-2"
        style={{ color: accent ? '#6366F1' : '#94A3B8' }}
      >
        {label}
      </Text>
      <View className="flex-row items-center gap-2">
        <View>
          <Text className="text-[9px] font-semibold uppercase mb-0.5"
            style={{ color: accent ? '#A5B4FC' : '#94A3B8' }}
          >In</Text>
          <Text className="text-sm font-bold tabular-nums"
            style={{ color: accent ? '#4338CA' : '#0D1B2A' }}
          >
            {fmtTime(checkin)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={12} color={accent ? '#C7D2FE' : '#E2E8F0'} />
        <View>
          <Text className="text-[9px] font-semibold uppercase mb-0.5"
            style={{ color: accent ? '#A5B4FC' : '#94A3B8' }}
          >Out</Text>
          <Text className="text-sm font-bold tabular-nums"
            style={{ color: accent ? '#4338CA' : '#0D1B2A' }}
          >
            {fmtTime(checkout)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function MyCorrectionsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await attendanceApi.getMyCorrections();
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const renderItem = ({ item }: { item: any }) => {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
    const date = item.attendanceRecord?.date
      ? format(parseISO(item.attendanceRecord.date), 'EEEE, MMM dd')
      : '—';

    return (
      <View
        className="bg-white rounded-2xl mb-3 overflow-hidden"
        style={{ borderWidth: 0.5, borderColor: '#E2E8F0' }}
      >
        {/* Card top */}
        <View className="px-4 pt-4 pb-3">
          {/* Date + status badge */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
              <Text className="text-sm font-semibold text-slate-800">{date}</Text>
            </View>
            <View
              className={`flex-row items-center gap-1 px-2.5 py-1 rounded-lg ${cfg.bgClass}`}
            >
              <Ionicons name={cfg.icon as any} size={12} color={cfg.iconColor} />
              <Text className={`text-[11px] font-bold ${cfg.textClass}`}>{cfg.label}</Text>
            </View>
          </View>

          {/* Time comparison */}
          <View className="flex-row items-center gap-2">
            <TimeBlock
              label="Current log"
              checkin={item.originalCheckin}
              checkout={item.originalCheckout}
            />
            <Ionicons name="arrow-forward" size={14} color="#CBD5E1" />
            <TimeBlock
              label="Requested"
              checkin={item.requestedCheckin}
              checkout={item.requestedCheckout}
              accent
            />
          </View>
        </View>

        {/* Reason footer */}
        {item.reason ? (
          <View
            className="flex-row items-start gap-2 px-4 py-3"
            style={{ borderTopWidth: 0.5, borderTopColor: '#F1F5F9', backgroundColor: '#FAFAFA' }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={12} color="#94A3B8" style={{ marginTop: 1 }} />
            <Text className="text-xs text-slate-400 flex-1 leading-5" numberOfLines={2}>
              <Text className="font-semibold text-slate-500">Reason: </Text>
              {item.reason}
            </Text>
          </View>
        ) : null}

        {/* Review note */}
        {item.reviewNote ? (
          <View
            className="px-4 py-2.5"
            style={{
              borderTopWidth: 0.5,
              borderTopColor: '#F1F5F9',
              borderLeftWidth: 3,
              borderLeftColor: cfg.color,
              backgroundColor: item.status === 'APPROVED' ? '#F0FDF4' : item.status === 'REJECTED' ? '#FFF1F2' : '#FFFBEB',
            }}
          >
            <Text className="text-xs italic leading-5" style={{ color: cfg.color }}>
              "{item.reviewNote}"
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-100">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#0D1B2A', '#1a2d42']}>
        <SafeAreaView edges={['top']}>
          <View className="px-5 pt-2 pb-6">
            <Text className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              My Corrections
            </Text>
            <Text className="text-xl font-bold text-white">Requests</Text>
            <Text className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Track your correction submissions
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* CTA banner */}
      <View className="px-4 mt-4 mb-2">
        <TouchableOpacity
          onPress={() => router.push('/(employee)/history')}
          activeOpacity={0.8}
          className="flex-row items-center justify-between bg-white rounded-xl px-4 py-3"
          style={{ borderWidth: 0.5, borderColor: '#E2E8F0' }}
        >
          <View className="flex-row items-center gap-2.5">
            <View className="w-8 h-8 rounded-lg bg-indigo-50 items-center justify-center">
              <Ionicons name="create-outline" size={16} color="#6366F1" />
            </View>
            <Text className="text-sm font-semibold text-slate-700">Need to correct attendance?</Text>
          </View>
          <Text className="text-sm font-bold text-indigo-500">History →</Text>
        </TouchableOpacity>
      </View>

      {/* Section label */}
      <View className="px-5 pt-3 pb-2">
        <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {requests.length > 0 ? `${requests.length} request${requests.length !== 1 ? 's' : ''}` : 'All requests'}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#6366F1" size="large" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
          }
          ListEmptyComponent={
            <View className="items-center mt-20 px-10">
              <View className="w-16 h-16 rounded-2xl bg-slate-100 items-center justify-center mb-4">
                <Ionicons name="receipt-outline" size={28} color="#94A3B8" />
              </View>
              <Text className="text-base font-bold text-slate-400 mb-2">No requests yet</Text>
              <Text className="text-sm text-slate-400 text-center leading-5">
                Tap a record in History to submit a correction
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}