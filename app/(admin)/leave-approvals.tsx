import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAdminPendingLeaves, useReviewLeave } from '@/features/leaves/hooks';
import { format } from 'date-fns';
import { LeaveRequest } from '@/features/leaves/api';

const C = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  navy: '#1E293B',
  gray: '#64748B',
  accent: '#6366F1',
  success: '#10B981',
  danger: '#EF4444',
  border: '#E2E8F0',
};

export default function LeaveApprovalsScreen() {
  const { data: pending, isLoading, refetch, error } = useAdminPendingLeaves();
  const reviewLeave = useReviewLeave();

  const handleReview = (id: string, status: 'APPROVED' | 'REJECTED') => {
    Alert.alert(
      `${status === 'APPROVED' ? 'Approve' : 'Reject'} Leave?`,
      `Are you sure you want to mark this request as ${status.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: status === 'APPROVED' ? 'Approve' : 'Reject', 
          style: status === 'REJECTED' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await reviewLeave.mutateAsync({ id, data: { status } });
            } catch (e) {
              Alert.alert('Error', 'Failed to update leave request');
            }
          }
        },
      ]
    );
  };

  return (
    <View style={s.container}>
      <Stack.Screen options={{ title: 'Leave Approvals', headerShown: true }} />
      
      <ScrollView 
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <Text style={s.title}>Pending Requests</Text>

        {isLoading ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={s.errorCard}>
            <Ionicons name="alert-circle-outline" size={18} color={C.danger} />
            <Text style={s.errorText}>Could not load leave requests.</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : pending?.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color={C.border} />
            <Text style={s.emptyText}>No pending leave requests.</Text>
          </View>
        ) : (
          pending?.map((req: LeaveRequest) => (
            <View key={req.id} style={s.card}>
              <View style={s.cardHeader}>
                <View>
                  <Text style={s.empName}>{req.employee?.name}</Text>
                  <Text style={s.empInfo}>
                    {req.employee?.profile?.employeeCode} • {req.employee?.profile?.department}
                  </Text>
                </View>
                <View style={s.typeBadge}>
                  <Text style={s.typeText}>{req.type}</Text>
                </View>
              </View>

              <View style={s.dateBox}>
                <Ionicons name="calendar-outline" size={16} color={C.accent} />
                <Text style={s.dateText}>
                  {format(new Date(req.startDate), 'MMM dd')} - {format(new Date(req.endDate), 'MMM dd, yyyy')}
                </Text>
              </View>

              <Text style={s.reason} numberOfLines={3}>{req.reason}</Text>

              <View style={s.actions}>
                <TouchableOpacity 
                   style={[s.btn, s.rejectBtn, reviewLeave.isPending && s.disabledBtn]} 
                   onPress={() => handleReview(req.id, 'REJECTED')}
                   disabled={reviewLeave.isPending}
                >
                  <Text style={s.rejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                   style={[s.btn, s.approveBtn, reviewLeave.isPending && s.disabledBtn]} 
                   onPress={() => handleReview(req.id, 'APPROVED')}
                   disabled={reviewLeave.isPending}
                >
                  <Text style={s.approveText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20 },
  title: { fontSize: 20, fontWeight: '800', color: C.navy, marginBottom: 20 },
  card: { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  empName: { fontSize: 16, fontWeight: '700', color: C.navy },
  empInfo: { fontSize: 12, color: C.gray },
  typeBadge: { backgroundColor: C.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '800', color: C.gray },
  dateBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dateText: { fontSize: 13, fontWeight: '600', color: C.navy },
  reason: { fontSize: 13, color: C.gray, lineHeight: 18, marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  disabledBtn: { opacity: 0.6 },
  rejectBtn: { backgroundColor: '#FEF2F2' },
  approveBtn: { backgroundColor: C.success },
  rejectText: { color: C.danger, fontWeight: '700', fontSize: 14 },
  approveText: { color: C.white, fontWeight: '700', fontSize: 14 },
  errorCard: {
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
  empty: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
  emptyText: { marginTop: 12, fontSize: 16, color: C.gray, fontWeight: '600' }
});
