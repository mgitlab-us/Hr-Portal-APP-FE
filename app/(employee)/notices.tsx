import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, ActivityIndicator,
  StatusBar, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSocket } from '@/hooks/useSocket';
import { apiClient } from '@/lib/axios';
import { format, parseISO } from 'date-fns';

interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'ANNOUNCEMENT' | 'HOLIDAY' | 'EVENT' | 'URGENT';
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { bg: string; text: string; icon: string; color: string }> = {
  ANNOUNCEMENT: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'megaphone-outline', color: '#2563EB' },
  HOLIDAY: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'sunny-outline', color: '#059669' },
  EVENT: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'calendar-outline', color: '#7C3AED' },
  URGENT: { bg: 'bg-rose-50', text: 'text-rose-600', icon: 'alert-circle-outline', color: '#E11D48' },
};

export default function NoticeBoardScreen() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotices = useCallback(async () => {
    try {
      const res = await apiClient.get('/notices', { params: { limit: 100 } });
      const payload = res.data;
      setNotices(Array.isArray(payload) ? payload : payload?.data ?? []);
    } catch (e) {
      console.error('[Notices] Fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadNotices(); }, [loadNotices]);

  // Real-time updates
  useSocket('notice:new', (notice: Notice) => {
    setNotices((prev) => [notice, ...prev]);
  });

  const onRefresh = () => {
    setRefreshing(true);
    loadNotices();
  };

  const renderItem = ({ item }: { item: Notice }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.ANNOUNCEMENT;
    const date = format(parseISO(item.createdAt), 'MMM dd, yyyy · hh:mm a');

    return (
      <View
        className="bg-white rounded-2xl mb-4 overflow-hidden"
        style={{ borderWidth: 0.5, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}
      >
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg ${cfg.bg}`}>
              <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
              <Text className={`text-[11px] font-bold uppercase tracking-wider ${cfg.text}`}>
                {item.type}
              </Text>
            </View>
            <Text className="text-[11px] font-medium text-slate-400">{date}</Text>
          </View>

          <Text className="text-lg font-bold text-slate-800 mb-2">{item.title}</Text>
          <Text className="text-sm text-slate-500 leading-6">{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" />

      {/* Premium Header */}
      <LinearGradient colors={['#0D1B2A', '#1a2d42']}>
        <SafeAreaView edges={['top']}>
          <View className="px-5 pt-2 pb-8">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-[2px] mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Organization
                </Text>
                <Text className="text-2xl font-extrabold text-white tracking-tight">Notice Board</Text>
              </View>
              <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10">
                <Ionicons name="megaphone" size={20} color="#fff" />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#6366F1" size="large" />
          <Text className="text-xs text-slate-400 mt-4 font-medium uppercase tracking-widest">
            Fetching updates...
          </Text>
        </View>
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadNotices} tintColor="#6366F1" />
          }
          ListEmptyComponent={
            <View className="items-center mt-20 px-10">
              <View className="w-20 h-20 rounded-3xl bg-slate-100 items-center justify-center mb-6 border border-slate-200">
                <Ionicons name="notifications-off-outline" size={32} color="#94A3B8" />
              </View>
              <Text className="text-lg font-bold text-slate-700 mb-2">Steady here</Text>
              <Text className="text-sm text-slate-400 text-center leading-6">
                No new notices or announcements have been posted yet.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
