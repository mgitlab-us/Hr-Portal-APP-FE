import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTeamLeaveCalendar } from '@/features/leaves/hooks';
import { CalendarLeave } from '@/features/leaves/api';
import { formatDateRangeDMY } from '@/lib/datetime';

const C = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  navy: '#1E293B',
  gray: '#64748B',
  accent: '#5B6EF5',
  border: '#E2E8F0',
};

const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  SICK: { bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B' },
  CASUAL: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#60A5FA' },
  VACATION: { bg: '#ECFDF5', text: '#047857', dot: '#34D399' },
  OTHER: { bg: '#F8FAFC', text: '#475569', dot: '#94A3B8' },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function leaveTypeStyle(type: string) {
  return TYPE_COLORS[type] || TYPE_COLORS.OTHER;
}

function durationLabel(duration: CalendarLeave['duration']) {
  if (duration === 'FIRST_HALF') return 'AM';
  if (duration === 'SECOND_HALF') return 'PM';
  return '';
}

export default function TeamCalendarScreen() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const from = dateKey(year, month, 1);
  const to = dateKey(year, month, daysInMonth);

  const { data, isLoading, refetch, isRefetching } = useTeamLeaveCalendar(from, to);
  const leaves = data?.leaves || [];

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const cells = useMemo(() => {
    const result: Array<{ day: number | null; key: string }> = [];
    for (let i = 0; i < firstWeekday; i += 1) {
      result.push({ day: null, key: `blank-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      result.push({ day, key: dateKey(year, month, day) });
    }
    while (result.length % 7 !== 0) {
      result.push({ day: null, key: `tail-${result.length}` });
    }
    return result;
  }, [firstWeekday, daysInMonth, year, month]);

  const leavesForDay = (day: number) => {
    const key = dateKey(year, month, day);
    return leaves.filter((leave) => {
      const start = leave.startDate.slice(0, 10);
      const end = leave.endDate.slice(0, 10);
      return start <= key && end >= key;
    });
  };

  const changeMonth = (offset: number) => {
    const next = new Date(year, month + offset, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  return (
    <View style={s.root}>
      <Stack.Screen options={{ title: 'Team Calendar', headerShown: true }} />
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={C.accent}
          />
        }
      >
        <View style={s.monthHeader}>
          <TouchableOpacity style={s.navButton} onPress={() => changeMonth(-1)}>
            <Ionicons name="chevron-back" size={18} color={C.gray} />
          </TouchableOpacity>
          <View style={s.monthTitleWrap}>
            <Text style={s.monthTitle}>{monthLabel}</Text>
            <Text style={s.monthCaption}>{leaves.length} approved leave entries</Text>
          </View>
          <TouchableOpacity style={s.navButton} onPress={() => changeMonth(1)}>
            <Ionicons name="chevron-forward" size={18} color={C.gray} />
          </TouchableOpacity>
        </View>

        <View style={s.legend}>
          {[
            ['Sick', TYPE_COLORS.SICK.dot],
            ['Casual', TYPE_COLORS.CASUAL.dot],
            ['Vacation', TYPE_COLORS.VACATION.dot],
            ['Other', TYPE_COLORS.OTHER.dot],
          ].map(([label, color]) => (
            <View key={label} style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: color }]} />
              <Text style={s.legendText}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={s.calendarCard}>
          <View style={s.weekRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={s.weekday}>
                {day}
              </Text>
            ))}
          </View>

          {isLoading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator color={C.accent} />
            </View>
          ) : (
            <View style={s.grid}>
              {cells.map((cell) => {
                const dayLeaves = cell.day ? leavesForDay(cell.day) : [];
                const isToday =
                  cell.day === today.getDate() &&
                  month === today.getMonth() &&
                  year === today.getFullYear();

                return (
                  <View key={cell.key} style={s.cell}>
                    {cell.day && (
                      <>
                        <View style={[s.dayNumberWrap, isToday && s.todayWrap]}>
                          <Text style={[s.dayNumber, isToday && s.todayText]}>{cell.day}</Text>
                        </View>
                        <View style={s.chips}>
                          {dayLeaves.slice(0, 2).map((leave) => {
                            const style = leaveTypeStyle(leave.type);
                            const half = durationLabel(leave.duration);
                            return (
                              <View
                                key={`${leave.id}-${cell.key}`}
                                style={[s.chip, { backgroundColor: style.bg }]}
                              >
                                <Text
                                  style={[s.chipText, { color: style.text }]}
                                  numberOfLines={1}
                                >
                                  {leave.employee.name.split(' ')[0]}
                                  {half ? ` · ${half}` : ''}
                                </Text>
                              </View>
                            );
                          })}
                          {dayLeaves.length > 2 && (
                            <Text style={s.moreText}>+{dayLeaves.length - 2}</Text>
                          )}
                        </View>
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {!isLoading && leaves.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="calendar-outline" size={52} color="#CBD5E1" />
            <Text style={s.emptyTitle}>No approved leave this month</Text>
            <Text style={s.emptyCaption}>
              Approved team leave will appear here as soon as HR signs off.
            </Text>
          </View>
        )}

        {leaves.length > 0 && (
          <View style={s.listSection}>
            <Text style={s.sectionTitle}>This month</Text>
            {leaves.map((leave) => {
              const style = leaveTypeStyle(leave.type);
              const half = durationLabel(leave.duration);
              return (
                <View key={leave.id} style={s.listCard}>
                  <View style={[s.listDot, { backgroundColor: style.dot }]} />
                  <View style={s.listText}>
                    <Text style={s.listName}>{leave.employee.name}</Text>
                    <Text style={s.listMeta}>
                      {leave.type}
                      {half ? ` · ${half} half` : ''} ·{' '}
                      {formatDateRangeDMY(leave.startDate, leave.endDate)}
                    </Text>
                    {leave.employee.department?.name && (
                      <Text style={s.listDept}>{leave.employee.department.name}</Text>
                    )}
                  </View>
                  {leave.duration !== 'FULL_DAY' && (
                    <View style={[s.halfBadge, { backgroundColor: style.bg }]}>
                      <Text style={[s.halfBadgeText, { color: style.text }]}>
                        {half}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 60 },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleWrap: { alignItems: 'center' },
  monthTitle: { fontSize: 17, fontWeight: '800', color: C.navy },
  monthCaption: { marginTop: 2, fontSize: 10, fontWeight: '600', color: C.gray },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '700', color: C.gray },
  calendarCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    overflow: 'hidden',
  },
  weekRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 8,
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#94A3B8',
  },
  loadingBox: { height: 260, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    minHeight: 82,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    padding: 4,
  },
  dayNumberWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  todayWrap: { backgroundColor: C.accent },
  dayNumber: { fontSize: 10, fontWeight: '700', color: C.gray },
  todayText: { color: C.white },
  chips: { gap: 2 },
  chip: { borderRadius: 4, paddingHorizontal: 3, paddingVertical: 2 },
  chipText: { fontSize: 7, fontWeight: '800' },
  moreText: { paddingLeft: 2, fontSize: 7, fontWeight: '700', color: '#94A3B8' },
  empty: { alignItems: 'center', marginTop: 36, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 10, fontSize: 15, fontWeight: '800', color: C.navy },
  emptyCaption: { marginTop: 4, fontSize: 11, lineHeight: 16, textAlign: 'center', color: C.gray },
  listSection: { marginTop: 24 },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: C.gray,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 8,
  },
  listDot: { width: 8, height: 8, borderRadius: 4 },
  listText: { flex: 1 },
  listName: { fontSize: 13, fontWeight: '800', color: C.navy },
  listMeta: { marginTop: 2, fontSize: 10, fontWeight: '600', color: C.gray },
  listDept: { marginTop: 1, fontSize: 9, color: '#94A3B8' },
  halfBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  halfBadgeText: { fontSize: 9, fontWeight: '800' },
});
