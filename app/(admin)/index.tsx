import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { Skeleton } from '@/components/ui/Skeleton';

const { width: SCREEN_W } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 80;
const H_PAD = 16;
const GAP = 10;
const BOX_W = (SCREEN_W - H_PAD * 2 - GAP * 2) / 3; // 3-column grid

const C = {
  navy: '#0D1B2A',
  navyMid: '#172435',
  bg: '#F2F4F8',
  card: '#FFFFFF',
  border: '#E6EAF2',
  text: '#0D1B2A',
  sub: '#64748B',
  muted: '#94A3B8',
  accent: '#5B6EF5',
  teal: '#0DBF97',
  amber: '#F59E0B',
  rose: '#F04E6A',
  violet: '#8B5CF6',
};

// ── Compact stat card
function StatCard({ label, value, sub, trend, colors, icon }: {
  label: string; value: string; sub: string;
  trend?: string; colors: string[]; icon: string;
}) {
  return (
    <LinearGradient colors={colors as any} style={sc.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={sc.row}>
        <View style={sc.iconBox}>
          <Ionicons name={icon as any} size={13} color="rgba(255,255,255,0.9)" />
        </View>
        {trend && <Text style={sc.trend}>{trend}</Text>}
      </View>
      <Text style={sc.value}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
      <Text style={sc.sub}>{sub}</Text>
    </LinearGradient>
  );
}
const sc = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    paddingBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trend: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
  },
  value: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  label: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  sub: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
});

// ── Compact action box (3-col grid)
function ActionBox({ title, icon, color, onPress }: {
  title: string; icon: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[ab.card, { width: BOX_W }]}>
      <View style={[ab.iconWrap, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={ab.title} numberOfLines={2}>{title}</Text>
    </TouchableOpacity>
  );
}
const ab = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    lineHeight: 15,
  },
});

// ── Pulse row 
function PulseRow({ item, isLast }: { item: any; isLast: boolean }) {
  return (
    <View style={[pr.wrap, !isLast && pr.border]}>
      <View style={[pr.dot, { backgroundColor: item.color }]} />
      <View style={pr.info}>
        <Text style={pr.name}>{item.name}</Text>
        <Text style={pr.action}>{item.action}</Text>
      </View>
      <Text style={pr.time}>{item.time}</Text>
    </View>
  );
}
const pr = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14 },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 10 },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700', color: C.text },
  action: { fontSize: 11, color: C.muted, marginTop: 1 },
  time: { fontSize: 11, fontWeight: '600', color: C.sub },
});

// ── Main
export default function AdminHome() {
  const { stats, pulse, loading, refreshing, onRefresh, employee } = useAdminDashboard();
  const isSuperAdmin = employee?.role === 'SUPER_ADMIN';

  const actions = [
    { title: 'Staff Directory', icon: 'people-outline', color: C.accent, route: '/(admin)/employees' },
    { title: 'Attendance', icon: 'calendar-outline', color: C.teal, route: '/(admin)/daily-logs' },
    { title: 'Data Export', icon: 'document-text-outline', color: C.amber, route: '/(admin)/reports' },
    ...(!isSuperAdmin ? [
      { title: 'Leave Requests', icon: 'mail-outline', color: C.violet, route: '/(admin)/leave-approvals' },
      { title: 'Correction Requests', icon: 'sync-outline', color: '#10B981', route: '/(admin)/corrections' },
    ] : []),
    ...(isSuperAdmin ? [{ title: 'Work Rules', icon: 'settings-outline', color: C.rose, route: '/(admin)/shift-settings' }] : []),
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <LinearGradient colors={[C.navy, C.navyMid]} style={s.header}>
        <SafeAreaView>
          <View style={s.topRow}>
            <View>
              <Text style={s.title}>Command Center</Text>
              <Text style={s.date}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <TouchableOpacity style={s.avatarBtn} onPress={() => router.push('/(admin)/profile')}>
              <Ionicons name="person-outline" size={16} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>

          <View style={s.statsRow}>
            {loading ? (
              <>
                <Skeleton width="48%" height={110} borderRadius={12} />
                <View style={{ width: 10 }} />
                <Skeleton width="48%" height={110} borderRadius={12} />
              </>
            ) : (
              <>
                <StatCard
                  label="Present"
                  value={String(stats.present)}
                  sub={`${stats.total} total · ${stats.absent} away`}
                  trend={`${Math.round(stats.overallAttendance)}%`}
                  colors={['#5B6EF5', '#4254E8']}
                  icon="people"
                />
                <View style={{ width: 10 }} />
                <StatCard
                  label="Avg. Hours"
                  value={String(stats.avgWorkHours)}
                  sub="Daily team average"
                  colors={['#0DBF97', '#0A9E7E']}
                  icon="time"
                />
              </>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* BODY */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      >
        {/* Quick Actions */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Quick Actions</Text>
          <View style={s.grid}>
            {actions.map((a) => (
              <ActionBox
                key={a.title}
                title={a.title}
                icon={a.icon}
                color={a.color}
                onPress={() => router.push(a.route as any)}
              />
            ))}
          </View>
        </View>

        {/* Operations Pulse */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionLabel}>Attendace Status</Text>
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>LIVE</Text>
            </View>
          </View>
          <View style={s.pulseCard}>
            {loading && !refreshing ? (
              <View style={{ padding: 14, gap: 12 }}>
                <Skeleton width="100%" height={40} />
                <Skeleton width="100%" height={40} />
                <Skeleton width="100%" height={40} />
              </View>
            ) : pulse.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="pulse-outline" size={28} color={C.border} />
                <Text style={s.emptyText}>No recent activity</Text>
              </View>
            ) : (
              pulse.map((item: any, idx: number) => (
                <PulseRow key={item.id || idx} item={item} isLast={idx === pulse.length - 1} />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    paddingBottom: 28,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  date: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row' },

  content: {
    paddingTop: 20,
    paddingBottom: 130,
  },
  section: {
    marginBottom: 22,
    paddingHorizontal: H_PAD,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.sub,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // 3-col flex wrap grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },

  pulseCard: {
    backgroundColor: C.card,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#EF4444' },
  liveText: { fontSize: 9, fontWeight: '800', color: '#EF4444', letterSpacing: 0.5 },

  empty: { alignItems: 'center', paddingVertical: 28 },
  emptyText: { marginTop: 8, fontSize: 12, color: C.muted },
});