import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { leavesApi, LeaveRequest } from '@/features/leaves/api';
import { correctionApi } from '@/features/corrections/api';
import { formatDateDMY, formatDateRangeDMY, formatTime12h } from '@/lib/datetime';

const C = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  navy: '#1E293B',
  gray: '#64748B',
  accent: '#5B6EF5',
  success: '#10B981',
  danger: '#EF4444',
  border: '#E2E8F0',
};

export default function ManagerApprovalsScreen() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [leaveData, correctionData] = await Promise.all([
        leavesApi.getManagerPending().catch(() => []),
        correctionApi.getManagerPending().catch(() => []),
      ]);
      setLeaves(Array.isArray(leaveData) ? leaveData : []);
      setCorrections(Array.isArray(correctionData) ? correctionData : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const confirmLeave = (request: LeaveRequest, status: 'APPROVED' | 'REJECTED') => {
    Alert.alert(
      status === 'APPROVED' ? 'Approve leave?' : 'Reject leave?',
      status === 'APPROVED'
        ? 'This will send the request to HR for final approval.'
        : 'This will reject the request and end the approval flow.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: status === 'APPROVED' ? 'Approve' : 'Reject',
          style: status === 'REJECTED' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setReviewingId(request.id);
              await leavesApi.review(request.id, { status });
              await loadData();
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message || 'Failed to review leave request');
            } finally {
              setReviewingId(null);
            }
          },
        },
      ]
    );
  };

  const confirmCorrection = (request: any, status: 'APPROVED' | 'REJECTED') => {
    Alert.alert(
      status === 'APPROVED' ? 'Approve correction?' : 'Reject correction?',
      status === 'APPROVED'
        ? 'This will send the correction to HR for final approval.'
        : 'This will reject the correction and end the approval flow.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: status === 'APPROVED' ? 'Approve' : 'Reject',
          style: status === 'REJECTED' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setReviewingId(request.id);
              await correctionApi.review(request.id, { status });
              await loadData();
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message || 'Failed to review correction');
            } finally {
              setReviewingId(null);
            }
          },
        },
      ]
    );
  };

  const total = leaves.length + corrections.length;

  return (
    <View style={s.root}>
      <Stack.Screen options={{ title: 'My Approvals', headerShown: true }} />
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={C.accent}
          />
        }
      >
        <View style={s.hero}>
          <View style={s.heroIcon}>
            <Ionicons name="checkmark-done" size={22} color={C.accent} />
          </View>
          <View style={s.heroText}>
            <Text style={s.heroTitle}>Stage 1 approvals</Text>
            <Text style={s.heroCaption}>
              Approve your direct reports first. HR gives the final approval.
            </Text>
          </View>
          {total > 0 && (
            <View style={s.countBadge}>
              <Text style={s.countText}>{total}</Text>
            </View>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: 50 }} />
        ) : total === 0 ? (
          <View style={s.empty}>
            <Ionicons name="checkmark-done-circle-outline" size={62} color="#CBD5E1" />
            <Text style={s.emptyTitle}>All caught up</Text>
            <Text style={s.emptyCaption}>No team requests are waiting for your approval.</Text>
          </View>
        ) : (
          <>
            {leaves.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Leave requests</Text>
                {leaves.map((request) => (
                  <View key={request.id} style={s.card}>
                    <View style={s.cardHeader}>
                      <View style={s.avatar}>
                        <Text style={s.avatarText}>
                          {(request.employee?.name || '?').charAt(0)}
                        </Text>
                      </View>
                      <View style={s.personInfo}>
                        <Text style={s.name}>{request.employee?.name || 'Employee'}</Text>
                        <Text style={s.meta}>
                          {request.employee?.profile?.employeeCode || '—'} ·{' '}
                          {request.employee?.profile?.department || 'Staff'}
                        </Text>
                      </View>
                      <View style={s.stageBadge}>
                        <Text style={s.stageText}>Manager</Text>
                      </View>
                    </View>

                    <View style={s.infoRow}>
                      <Ionicons name="airplane-outline" size={14} color={C.accent} />
                      <Text style={s.infoText}>
                        {request.type} · {formatDateRangeDMY(request.startDate, request.endDate)}
                      </Text>
                    </View>
                    {request.duration !== 'FULL_DAY' && (
                      <Text style={s.halfDay}>
                        {request.duration === 'FIRST_HALF'
                          ? 'Morning only · 0.5 day'
                          : 'Afternoon only · 0.5 day'}
                      </Text>
                    )}
                    <Text style={s.reason} numberOfLines={3}>
                      {request.reason}
                    </Text>

                    <View style={s.actions}>
                      <TouchableOpacity
                        style={[s.button, s.rejectButton, reviewingId === request.id && s.disabled]}
                        disabled={reviewingId === request.id}
                        onPress={() => confirmLeave(request, 'REJECTED')}
                      >
                        <Text style={s.rejectText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.button, s.approveButton, reviewingId === request.id && s.disabled]}
                        disabled={reviewingId === request.id}
                        onPress={() => confirmLeave(request, 'APPROVED')}
                      >
                        {reviewingId === request.id ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={s.approveText}>Approve & send to HR</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {corrections.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Attendance corrections</Text>
                {corrections.map((request) => (
                  <View key={request.id} style={s.card}>
                    <View style={s.cardHeader}>
                      <View style={s.avatar}>
                        <Text style={s.avatarText}>
                          {(request.employee?.name || '?').charAt(0)}
                        </Text>
                      </View>
                      <View style={s.personInfo}>
                        <Text style={s.name}>{request.employee?.name || 'Employee'}</Text>
                        <Text style={s.meta}>
                          {formatDateDMY(request.attendanceRecord?.date, 'dd MMM yyyy')}
                        </Text>
                      </View>
                      <View style={s.stageBadge}>
                        <Text style={s.stageText}>Manager</Text>
                      </View>
                    </View>

                    <View style={s.correctionRow}>
                      <View style={s.timeColumn}>
                        <Text style={s.timeLabel}>CURRENT</Text>
                        <Text style={s.timeValue}>
                          {request.originalCheckin
                            ? formatTime12h(request.originalCheckin)
                            : '--:--'}
                        </Text>
                        <Text style={s.timeValue}>
                          {request.originalCheckout
                            ? formatTime12h(request.originalCheckout)
                            : '--:--'}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={17} color="#CBD5E1" />
                      <View style={s.timeColumn}>
                        <Text style={[s.timeLabel, { color: C.accent }]}>REQUESTED</Text>
                        <Text style={s.timeValue}>
                          {request.requestedCheckin
                            ? formatTime12h(request.requestedCheckin)
                            : 'NC'}
                        </Text>
                        <Text style={s.timeValue}>
                          {request.requestedCheckout
                            ? formatTime12h(request.requestedCheckout)
                            : 'NC'}
                        </Text>
                      </View>
                    </View>

                    <Text style={s.reason} numberOfLines={3}>
                      {request.reason}
                    </Text>

                    <View style={s.actions}>
                      <TouchableOpacity
                        style={[s.button, s.rejectButton, reviewingId === request.id && s.disabled]}
                        disabled={reviewingId === request.id}
                        onPress={() => confirmCorrection(request, 'REJECTED')}
                      >
                        <Text style={s.rejectText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.button, s.approveButton, reviewingId === request.id && s.disabled]}
                        disabled={reviewingId === request.id}
                        onPress={() => confirmCorrection(request, 'APPROVED')}
                      >
                        {reviewingId === request.id ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={s.approveText}>Approve & send to HR</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 60 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 14, fontWeight: '800', color: C.navy },
  heroCaption: { marginTop: 2, fontSize: 11, lineHeight: 15, color: C.gray },
  countBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: { fontSize: 11, fontWeight: '800', color: C.white },
  sectionTitle: {
    marginBottom: 10,
    marginTop: 4,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: C.gray,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: C.accent },
  personInfo: { flex: 1, marginLeft: 10 },
  name: { fontSize: 14, fontWeight: '800', color: C.navy },
  meta: { marginTop: 2, fontSize: 10, fontWeight: '600', color: C.gray },
  stageBadge: {
    borderRadius: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  stageText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#B45309',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoText: { fontSize: 12, fontWeight: '700', color: C.navy },
  halfDay: { marginBottom: 4, fontSize: 10, fontWeight: '700', color: '#4F46E5' },
  reason: { marginTop: 4, marginBottom: 14, fontSize: 12, lineHeight: 17, color: C.gray },
  correctionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 6,
  },
  timeColumn: { alignItems: 'center' },
  timeLabel: { marginBottom: 5, fontSize: 9, fontWeight: '800', letterSpacing: 0.5, color: '#94A3B8' },
  timeValue: { fontSize: 14, fontWeight: '800', color: C.navy },
  actions: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, minHeight: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.55 },
  rejectButton: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  approveButton: { backgroundColor: C.accent },
  rejectText: { fontSize: 12, fontWeight: '800', color: C.danger },
  approveText: { fontSize: 12, fontWeight: '800', color: C.white },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: '800', color: C.navy },
  emptyCaption: { marginTop: 4, fontSize: 12, color: C.gray, textAlign: 'center' },
});
