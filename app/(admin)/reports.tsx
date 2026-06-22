import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  StatusBar, TouchableOpacity, RefreshControl
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';

import { StatCard } from '@/components/ui/StatCard';
import { useAdminReports } from '@/hooks/useAdminReports';

const C = {
  navy: '#0F172A',
  navyMid: '#1E293B',
  accent: '#6366F1',
  teal: '#10B981',
  orange: '#F59E0B',
  rose: '#F43F5E',
  bg: '#F2F4F8',
  card: '#FFFFFF',
  border: '#E8ECF4',
  text: '#0F172A',
  sub: '#64748B',
  muted: '#94A3B8',
};

export default function AdminReportsScreen() {
  const {
    stats, trend, trendMeta, loading,
    downloading, downloadingPdf,
    excelUri, pdfUri, statusMsg,
    selectedMonth, setSelectedMonth,
    handleDownloadExcel, handleDownloadPdf,
    handleShare, onRefresh
  } = useAdminReports();

  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom + 60 + 20;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ── */}
      <LinearGradient colors={[C.navy, C.navyMid]} style={s.header}>
        <SafeAreaView>
          <View style={s.headerTop}>
            <View>
              <Text style={s.headerTitle}>Analytics Center</Text>
              <Text style={s.headerSub}>Monthly performance insights</Text>
            </View>
          </View>
          <View style={s.statsRow}>
            <StatCard
              title="Attendance Rate"
              value={loading ? '--' : `${Math.round(stats?.overallAttendance ?? 0)}%`}
              icon="analytics"
              colors={['#6366F1', '#4F46E5']}
              subtitle={`${stats?.present ?? 0}/${stats?.total ?? 0} present today`}
              trend="+1.2%"
            />
            <StatCard
              title="Avg. Productive"
              value={loading ? '--' : `${stats?.avgWorkHours ?? 0}h`}
              icon="time"
              colors={['#10B981', '#059669']}
              subtitle="Team daily average"
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── BODY ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingBottom: bottomPad }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={C.accent} />}
      >

        {/* Status Breakdown */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Daily Breakdown</Text>
          <View style={s.card}>
            <View style={s.distBar}>
              <View style={[s.distSegment, { flex: stats?.onTimeRate || 33, backgroundColor: C.teal }]} />
              <View style={[s.distSegment, { flex: stats?.lateRate || 33, backgroundColor: C.orange }]} />
              <View style={[s.distSegment, { flex: stats?.absentRate || 34, backgroundColor: C.rose }]} />
            </View>
            <View style={s.legend}>
              {[
                { label: 'On-Time', color: C.teal },
                { label: 'Late', color: C.orange },
                { label: 'Absent', color: C.rose },
              ].map(({ label, color }) => (
                <View key={label} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: color }]} />
                  <Text style={s.legendText}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 7-Day Trend */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>7-Day Trend</Text>
          <View style={s.card}>
            {/* Header row */}
            <View style={s.chartHeader}>
              <View>
                <Text style={s.chartLabel}>ON-TIME RATE</Text>
                <Text style={s.chartVal}>{trendMeta.latestOnTimeRate}%</Text>
              </View>
              <View style={[s.trendBadge, trendMeta.onTimeDelta < 0 && s.trendBadgeDown]}>
                <Ionicons
                  name={trendMeta.onTimeDelta >= 0 ? 'trending-up' : 'trending-down'}
                  size={13}
                  color={trendMeta.onTimeDelta >= 0 ? C.teal : C.rose}
                />
                <Text style={[s.trendText, trendMeta.onTimeDelta < 0 && s.trendTextDown]}>
                  {Math.abs(trendMeta.onTimeDelta)}%
                </Text>
              </View>
            </View>

            {/* Bar chart */}
            <View style={s.barChart}>
              {(trend.length
                ? trend
                : Array.from({ length: 7 }).map((_, i) => ({
                  attendanceRate: 20,
                  dayLabel: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
                }))
              ).map((item, i) => {
                const h = Math.max(8, Math.round((item.attendanceRate || 0) * 0.85));
                const isLast = i === trend.length - 1;
                return (
                  <View key={i} style={s.barCol}>
                    <View style={[s.bar, { height: h }, isLast && { backgroundColor: C.accent }]} />
                    <Text style={s.barLabel}>{item.dayLabel?.slice(0, 1)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Generate Reports */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Generate Reports</Text>
          <View style={s.card}>
            {/* Month picker */}
            <Text style={s.exportLabel}>SELECT MONTH</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.monthRow}
              style={s.monthScroll}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setSelectedMonth(m)}
                  style={[s.monthPill, selectedMonth === m && s.monthPillActive]}
                >
                  <Text style={[s.monthText, selectedMonth === m && s.monthTextActive]}>
                    {format(new Date(2025, m - 1), 'MMM')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Export buttons */}
            <View style={s.exportRow}>
              <TouchableOpacity
                style={[s.exportBtn, { backgroundColor: C.teal }]}
                onPress={() => excelUri ? handleShare(excelUri, '.xlsx') : handleDownloadExcel()}
                disabled={downloading}
              >
                {downloading
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <>
                    <Ionicons name={excelUri ? 'share-social-outline' : 'download-outline'} size={16} color="#FFF" />
                    <Text style={s.exportBtnText}>{excelUri ? 'Share Excel' : 'Export Excel'}</Text>
                  </>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.exportBtn, { backgroundColor: C.rose }]}
                onPress={() => pdfUri ? handleShare(pdfUri, '.pdf') : handleDownloadPdf()}
                disabled={downloadingPdf}
              >
                {downloadingPdf
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <>
                    <Ionicons name={pdfUri ? 'share-social-outline' : 'download-outline'} size={16} color="#FFF" />
                    <Text style={s.exportBtnText}>{pdfUri ? 'Share PDF' : 'Export PDF'}</Text>
                  </>
                }
              </TouchableOpacity>
            </View>

            {statusMsg && (
              <View style={s.statusMsg}>
                <Ionicons name="information-circle-outline" size={13} color={C.sub} />
                <Text style={s.statusMsgText}>{statusMsg}</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Header ──────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    marginTop: 8,
    marginBottom: 18,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: 12 },

  // ── ScrollView body ──────────────────────────────────────────
  content: { paddingTop: 24 },   // clears rounded header edge

  // ── Section ──────────────────────────────────────────────────
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  // ── Shared card ───────────────────────────────────────────────
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── Distribution bar ─────────────────────────────────────────
  distBar: {
    height: 10,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 14,
  },
  distSegment: { height: '100%' },
  legend: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: '600', color: C.text },

  // ── Bar chart ─────────────────────────────────────────────────
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  chartLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.5 },
  chartVal: { fontSize: 22, fontWeight: '800', color: C.text, marginTop: 3 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  trendBadgeDown: { backgroundColor: '#fef2f2' },
  trendText: { fontSize: 11, fontWeight: '800', color: C.teal },
  trendTextDown: { color: C.rose },

  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 90,           // was 140 — too tall for sparse data
  },
  barCol: { alignItems: 'center', gap: 6 },
  bar: { width: 8, borderRadius: 4, backgroundColor: '#E8ECF4' },
  barLabel: { fontSize: 10, fontWeight: '600', color: C.muted },

  // ── Export card ───────────────────────────────────────────────
  exportLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  monthScroll: { marginBottom: 16 },
  monthRow: { gap: 8 },
  monthPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: C.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  monthPillActive: { backgroundColor: C.navy, borderColor: C.navy },
  monthText: { fontSize: 12, fontWeight: '600', color: C.text },
  monthTextActive: { color: '#FFF' },

  exportRow: { flexDirection: 'row', gap: 10 },
  exportBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  exportBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  statusMsg: {
    marginTop: 12,
    backgroundColor: C.bg,
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  statusMsgText: { fontSize: 11, color: C.sub, fontWeight: '600' },
});