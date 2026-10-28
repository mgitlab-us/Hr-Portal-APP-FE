import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { correctionApi } from '@/features/corrections/api';
import { Ionicons } from '@expo/vector-icons';
import { formatDateDMY, formatTime12h } from '@/lib/datetime';

const C = {
  navy: '#0F1D3A',
  accent: '#5BA3F5',
  teal: '#1DB8A0',
  white: '#FFFFFF',
  subtle: '#8A9BB5',
  bg: '#F8FAFC',
  danger: '#FF6B6B',
  border: '#E2E8F0',
};

export default function AdminCorrectionsScreen() {
  const [managerRequests, setManagerRequests] = useState<any[]>([]);
  const [hrRequests, setHrRequests] = useState<any[]>([]);
  const [queue, setQueue] = useState<'MANAGER' | 'HR'>('MANAGER');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [managerData, hrData] = await Promise.all([
        correctionApi.getManagerPending().catch(() => []),
        correctionApi.getPending().catch(() => []),
      ]);
      setManagerRequests(Array.isArray(managerData) ? managerData : []);
      setHrRequests(Array.isArray(hrData) ? hrData : []);
    } catch (e) {
      console.error(e);
      setError('Could not load correction requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const requests = queue === 'MANAGER' ? managerRequests : hrRequests;

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    Alert.alert(
      `${status === 'APPROVED' ? 'Approve' : 'Reject'} Request?`,
      status === 'APPROVED' && queue === 'MANAGER'
        ? 'This will send the correction to HR for final approval.'
        : 'Do you want to confirm this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setReviewing(true);
              await correctionApi.review(id, { status });
              await loadData();
            } catch (e) {
              Alert.alert('Error', 'Failed to update correction request');
            } finally {
              setReviewing(false);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.userInfo}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{item.employee.name[0]}</Text>
          </View>
          <View>
            <Text style={s.userName}>{item.employee.name}</Text>
            <Text style={s.userDept}>{item.employee.profile?.department || 'Member'}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={s.dateText}>{formatDateDMY(item.attendanceRecord.date, 'dd MMM yyyy')}</Text>
          {item.approvalStage === 'MANAGER' && (
            <View style={s.stageBadge}>
              <Text style={s.stageText}>Stage 1 · Manager</Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.compareRow}>
        <View style={s.compareBox}>
          <Text style={s.compareLabel}>ORIGINAL</Text>
          <Text style={s.compareValue}>{formatTime12h(item.originalCheckin)}</Text>
          <Text style={s.compareValue}>
            {item.originalCheckout ? formatTime12h(item.originalCheckout) : '--:--'}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color="#E2E8F0" />
        <View style={s.compareBox}>
          <Text style={[s.compareLabel, { color: C.accent }]}>REQUESTED</Text>
          <Text style={s.compareValue}>{item.requestedCheckin ? formatTime12h(item.requestedCheckin) : 'NC'}</Text>
          <Text style={s.compareValue}>{item.requestedCheckout ? formatTime12h(item.requestedCheckout) : 'NC'}</Text>
        </View>
      </View>

      <View style={s.reasonBox}>
        <Text style={s.reasonLabel}>REASON</Text>
        <Text style={s.reasonText}>{item.reason}</Text>
      </View>

      <View style={s.actions}>
        <TouchableOpacity
          style={[s.actionBtn, s.rejectBtn, reviewing && s.disabledBtn]}
          onPress={() => handleReview(item.id, 'REJECTED')}
          disabled={reviewing}
        >
          <Ionicons name="close" size={20} color={C.danger} />
          <Text style={s.rejectText}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, s.approveBtn, reviewing && s.disabledBtn]}
          onPress={() => handleReview(item.id, 'APPROVED')}
          disabled={reviewing}
        >
          <Ionicons name="checkmark" size={20} color={C.white} />
          <Text style={s.approveText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <Text style={s.headerTitle}>Approvals</Text>
        <Text style={s.headerSub}>
          {managerRequests.length + hrRequests.length} pending correction requests
        </Text>
      </View>

      <View style={s.queueRow}>
        <TouchableOpacity
          style={[s.queueButton, queue === 'MANAGER' && s.queueButtonActive]}
          onPress={() => setQueue('MANAGER')}
        >
          <Text style={[s.queueText, queue === 'MANAGER' && s.queueTextActive]}>
            My team · {managerRequests.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.queueButton, queue === 'HR' && s.queueButtonActive]}
          onPress={() => setQueue('HR')}
        >
          <Text style={[s.queueText, queue === 'HR' && s.queueTextActive]}>
            HR final · {hrRequests.length}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : error ? (
        <View style={s.errorCard}>
          <Ionicons name="alert-circle-outline" size={18} color={C.danger} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={loadData}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={C.accent} />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={60} color="#CBD5E1" />
              <Text style={s.emptyText}>No pending correction requests.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { padding: 24, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: C.navy },
  headerSub: { fontSize: 14, color: C.subtle, marginTop: 4, fontWeight: '500' },
  queueRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 14 },
  queueButton: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.white, paddingVertical: 10, alignItems: 'center' },
  queueButtonActive: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  queueText: { fontSize: 11, fontWeight: '700', color: C.subtle },
  queueTextActive: { color: C.accent },
  stageBadge: { borderRadius: 6, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 6, paddingVertical: 3 },
  stageText: { fontSize: 8, fontWeight: '800', color: '#B45309' },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  card: { backgroundColor: C.white, borderRadius: 24, padding: 20, marginBottom: 20, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  userInfo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: C.accent },
  userName: { fontSize: 16, fontWeight: '700', color: C.navy },
  userDept: { fontSize: 12, color: C.subtle, fontWeight: '500' },
  dateText: { fontSize: 13, fontWeight: '600', color: C.subtle, backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  compareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, marginBottom: 20 },
  compareBox: { alignItems: 'center' },
  compareLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginBottom: 6, letterSpacing: 0.5 },
  compareValue: { fontSize: 16, fontWeight: '800', color: C.navy },
  reasonBox: { marginBottom: 24 },
  reasonLabel: { fontSize: 10, fontWeight: '700', color: C.subtle, marginBottom: 6, letterSpacing: 0.5 },
  reasonText: { fontSize: 14, color: '#475569', lineHeight: 20, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, gap: 8 },
  disabledBtn: { opacity: 0.6 },
  rejectBtn: { backgroundColor: '#FFF1F1', borderWidth: 1, borderColor: '#FFE4E4' },
  rejectText: { color: C.danger, fontWeight: '700' },
  approveBtn: { backgroundColor: C.accent },
  approveText: { color: C.white, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorCard: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: { flex: 1, color: '#991B1B', fontSize: 12, fontWeight: '600' },
  retryBtn: { backgroundColor: C.white, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  retryText: { color: C.navy, fontSize: 12, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: C.subtle }
});
