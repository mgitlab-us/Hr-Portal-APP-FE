import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTodayAttendance } from '../hooks';
import { CheckInButton } from './CheckInButton';
import { BreakButton } from './BreakButton';
import { addMinutes } from 'date-fns';
import { formatTime12h } from '@/lib/datetime';
import { Skeleton } from '@/components/ui/Skeleton';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;

export function AdminSelfAttendance() {
  const { data: record, isLoading, refetch } = useTodayAttendance();

  const processedData = useMemo(() => {
    if (!record) return null;

    const activeBreak = record.breakSessions?.find((b: any) => !b.endTime);
    const previouslyConsumedSeconds = (record.breakSessions || [])
      .filter((b: any) => b.endTime)
      .reduce((sum: number, b: any) => {
        const diff = Math.floor(
          (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 1000
        );
        return sum + Math.max(0, diff);
      }, 0);

    const expectedCheckinStr = record.config?.expectedCheckin || '09:00';
    const workMinutes = record.config?.expectedWorkMinutes || 480;
    const [h, m] = expectedCheckinStr.split(':').map(Number);
    
    const baseDate = new Date();
    baseDate.setHours(h, m, 0, 0);
    const checkin12h = formatTime12h(baseDate);
    
    const shiftEnd = addMinutes(baseDate, workMinutes + 60); 
    const checkoutTimeStr = formatTime12h(shiftEnd);

    const workingHoursDisplay = record.dailySummary?.totalWorkMinutes
      ? `${Math.floor(record.dailySummary.totalWorkMinutes / 60)}h ${record.dailySummary.totalWorkMinutes % 60}m`
      : null;

    return {
      activeBreak,
      previouslyConsumedSeconds,
      checkin12h,
      checkoutTimeStr,
      workingHoursDisplay
    };
  }, [record]);

  if (isLoading) {
    return (
      <View style={s.card}>
        <Skeleton width="100%" height={120} borderRadius={16} />
      </View>
    );
  }

  if (!record) return null;

  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.iconCircle}>
            <Ionicons name="time" size={16} color="#5B6EF5" />
          </View>
          <View>
            <Text style={s.title}>My Attendance</Text>
            <Text style={s.sub}>Personal Check-in/out</Text>
          </View>
        </View>
        <View style={s.shiftBadge}>
          <Text style={s.shiftText}>{processedData?.checkin12h} — {processedData?.checkoutTimeStr}</Text>
        </View>
      </View>

      <View style={s.content}>
        <CheckInButton
          status={record.status || 'IDLE'}
          checkinTime={record.checkinTime ? formatTime12h(record.checkinTime) : null}
          checkoutTime={record.checkoutTime ? formatTime12h(record.checkoutTime) : null}
          workingHours={processedData?.workingHoursDisplay}
          onRefresh={refetch}
        />

        {record.status === 'PENDING' && (
          <View style={s.breakWrap}>
            <View style={s.dividerRow}>
              <View style={s.line} />
              <Text style={s.dividerText}>BREAKS</Text>
              <View style={s.line} />
            </View>
            <BreakButton
              activeBreak={processedData?.activeBreak}
              attendanceStatus={record.status}
              previouslyConsumedSeconds={processedData?.previouslyConsumedSeconds}
              onRefresh={refetch}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E6EAF2',
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(91, 110, 245, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D1B2A',
  },
  sub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  shiftBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shiftText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  content: {
    alignItems: 'center',
  },
  breakWrap: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  }
});
