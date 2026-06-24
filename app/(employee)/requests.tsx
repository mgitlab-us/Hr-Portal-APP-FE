import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, ActivityIndicator,
  StatusBar, RefreshControl, TouchableOpacity,
  Modal, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { attendanceApi } from '@/features/attendance/api';
import { useMyLeaves } from '@/features/leaves/hooks';
import { format, parseISO } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; text: string; icon: string }> = {
  PENDING: { label: 'Pending', color: '#D97706', bg: 'bg-amber-50', text: 'text-amber-600', icon: 'time-outline' },
  APPROVED: { label: 'Approved', color: '#16A34A', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'checkmark-circle-outline' },
  REJECTED: { label: 'Rejected', color: '#E11D48', bg: 'bg-rose-50', text: 'text-rose-500', icon: 'close-circle-outline' },
};

export default function CombinedRequestsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'CORRECTION' | 'LEAVE'>('CORRECTION');
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loadingCorrections, setLoadingCorrections] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  const { data: leaves, isLoading: loadingLeaves, refetch: refetchLeaves } = useMyLeaves();

  const loadCorrections = useCallback(async () => {
    try {
      setLoadingCorrections(true);
      const data = await attendanceApi.getMyCorrections();
      setCorrections(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCorrections(false);
    }
  }, []);

  useEffect(() => { loadCorrections(); }, [loadCorrections]);

  const onRefresh = () => {
    if (tab === 'CORRECTION') loadCorrections();
    else refetchLeaves();
  };

  const renderCorrectionItem = ({ item }: { item: any }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
    const date = item.attendanceRecord?.date ? format(parseISO(item.attendanceRecord.date), 'EEE, MMM dd') : '—';

    return (
      <View className="bg-white rounded-2xl mb-3 p-4 border border-slate-200 shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="receipt-outline" size={14} color="#64748b" />
            <Text className="text-sm font-bold text-slate-800">{date}</Text>
          </View>
          <View className={`px-2 py-0.5 rounded-md ${cfg.bg}`}>
            <Text className={`text-[10px] font-bold uppercase ${cfg.text}`}>{cfg.label}</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-xs text-slate-400">Current:</Text>
            <Text className="text-sm font-medium text-slate-600">{item.originalCheckin ? format(parseISO(item.originalCheckin), 'hh:mm a') : '--'} → {item.originalCheckout ? format(parseISO(item.originalCheckout), 'hh:mm a') : '--'}</Text>
        </View>
        <View className="bg-indigo-50 p-2 rounded-lg border border-indigo-100">
            <View className="flex-row items-center gap-2">
                <Text className="text-xs text-indigo-400 font-bold">Requested:</Text>
                <Text className="text-sm font-bold text-indigo-700">{item.requestedCheckin ? format(parseISO(item.requestedCheckin), 'hh:mm a') : '--'} → {item.requestedCheckout ? format(parseISO(item.requestedCheckout), 'hh:mm a') : '--'}</Text>
            </View>
        </View>
      </View>
    );
  };

  const renderLeaveItem = ({ item }: { item: any }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
    const dateRange = `${format(new Date(item.startDate), 'MMM dd')} - ${format(new Date(item.endDate), 'MMM dd, yyyy')}`;

    return (
      <View className="bg-white rounded-2xl mb-3 p-4 border border-slate-200 shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="airplane-outline" size={14} color="#64748b" />
            <Text className="text-sm font-bold text-slate-800">{item.type}</Text>
          </View>
          <View className={`px-2 py-0.5 rounded-md ${cfg.bg}`}>
            <Text className={`text-[10px] font-bold uppercase ${cfg.text}`}>{cfg.label}</Text>
          </View>
        </View>
        <Text className="text-xs text-slate-400 mb-1">{dateRange}</Text>
        <Text className="text-sm text-slate-600" numberOfLines={2}>{item.reason}</Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#0D1B2A', '#1a2d42']}>
        <SafeAreaView edges={['top']}>
          <View className="px-5 pt-2 pb-6">
            <Text className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
               Attendance & Leaves
            </Text>
            <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-white">Requests</Text>
                <TouchableOpacity 
                    onPress={() => setShowNewModal(true)}
                    className="w-10 h-10 rounded-full bg-[#5B6EF5] items-center justify-center shadow-lg"
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Tabs */}
      <View className="flex-row bg-white p-1 mx-5 mt-[-20px] rounded-2xl shadow-sm border border-slate-100">
        <TouchableOpacity 
            onPress={() => setTab('CORRECTION')}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${tab === 'CORRECTION' ? 'bg-slate-100' : ''}`}
        >
            <Ionicons name="receipt-outline" size={16} color={tab === 'CORRECTION' ? '#1e293b' : '#94a3b8'} />
            <Text className={`ml-2 text-xs font-bold ${tab === 'CORRECTION' ? 'text-slate-800' : 'text-slate-400'}`}>Corrections</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            onPress={() => setTab('LEAVE')}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${tab === 'LEAVE' ? 'bg-slate-100' : ''}`}
        >
            <Ionicons name="airplane-outline" size={16} color={tab === 'LEAVE' ? '#1e293b' : '#94a3b8'} />
            <Text className={`ml-2 text-xs font-bold ${tab === 'LEAVE' ? 'text-slate-800' : 'text-slate-400'}`}>Leaves</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 px-5 pt-4">
        {(tab === 'CORRECTION' ? loadingCorrections : loadingLeaves) ? (
            <ActivityIndicator color="#5B6EF5" style={{ marginTop: 40 }} />
        ) : (
            <FlatList
                data={tab === 'CORRECTION' ? corrections : leaves}
                keyExtractor={(item) => item.id}
                renderItem={tab === 'CORRECTION' ? renderCorrectionItem : renderLeaveItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#5B6EF5" />}
                ListEmptyComponent={
                    <View className="items-center mt-20 opacity-40">
                        <Ionicons name={tab === 'CORRECTION' ? 'receipt-outline' : 'airplane-outline'} size={60} color="#94a3b8" />
                        <Text className="mt-3 text-slate-500 font-bold">No requests found</Text>
                    </View>
                }
            />
        )}
      </View>

      {/* New Request Modal */}
      <Modal
        visible={showNewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewModal(false)}
      >
        <Pressable 
            className="flex-1 bg-black/50 items-center justify-center px-8"
            onPress={() => setShowNewModal(false)}
        >
            <View className="bg-white w-full rounded-3xl p-6 overflow-hidden">
                <Text className="text-xl font-bold text-slate-800 mb-6">Create New Request</Text>
                
                <TouchableOpacity 
                    className="flex-row items-center p-4 bg-slate-50 rounded-2xl mb-3 border border-slate-100"
                    onPress={() => { setShowNewModal(false); router.push('/(employee)/request-leave'); }}
                >
                    <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-4">
                        <Ionicons name="airplane-outline" size={20} color="#10b981" />
                    </View>
                    <View>
                        <Text className="font-bold text-slate-800">Leave Request</Text>
                        <Text className="text-xs text-slate-400">Request vacation or sick leave</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    className="flex-row items-center p-4 bg-slate-50 rounded-2xl border border-slate-100"
                    onPress={() => { setShowNewModal(false); router.push('/(employee)/history'); }}
                >
                    <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-4">
                        <Ionicons name="receipt-outline" size={20} color="#3b82f6" />
                    </View>
                    <View>
                        <Text className="font-bold text-slate-800">Attendance Correction</Text>
                        <Text className="text-xs text-slate-400">Fix missing or incorrect logs</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => setShowNewModal(false)}
                    className="mt-6 py-4 items-center"
                >
                    <Text className="text-sm font-bold text-slate-400">Cancel</Text>
                </TouchableOpacity>
            </View>
        </Pressable>
      </Modal>
    </View>
  );
}
