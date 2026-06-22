import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { attendanceApi } from '@/features/attendance/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_W } = Dimensions.get('window');

const C = {
  navy: '#0F1D3A',
  accent: '#5BA3F5',
  teal: '#1DB8A0',
  white: '#FFFFFF',
  subtle: '#8A9BB5',
  bg: '#F8FAFC',
};

function AchievementCard({ icon, label, value, color }: any) {
  return (
    <View style={s.card}>
      <View style={[s.iconBox, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={s.cardLabel}>{label}</Text>
        <Text style={s.cardValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function EmployeeSummaryScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceApi.getPersonalStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color={C.accent} /></View>;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <LinearGradient colors={[C.navy, '#1E293B']} style={s.header}>
          <SafeAreaView>
            <View style={s.headerContent}>
              <View style={s.streakCircle}>
                <Text style={s.streakNum}>{stats.streak}</Text>
                <Text style={s.streakLbl}>DAYS STREAK</Text>
                <Ionicons name="flame" size={32} color="#FF9F43" style={s.flame} />
              </View>
              <Text style={s.headerTitle}>Monthly Milestone</Text>
              <Text style={s.headerSub}>You're doing great this month!</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ── Content ── */}
        <View style={s.content}>
          <View style={s.grid}>
            <AchievementCard
              icon="time-outline"
              label="TOTAL HOURS"
              value={`${stats.totalHours}h`}
              color={C.accent}
            />
            <AchievementCard
              icon="calendar-outline"
              label="DAYS PRESENT"
              value={stats.daysPresent}
              color={C.teal}
            />
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Precision Score</Text>
            <View style={s.scoreCard}>
              <View style={s.scoreInfo}>
                <Text style={s.scoreValue}>{stats.onTimeRate}%</Text>
                <Text style={s.scoreLabel}>On-Time Arrival</Text>
              </View>
              <View style={s.progressTrack}>
                <View style={[s.progressBar, { width: `${stats.onTimeRate}%` }]} />
              </View>
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Engagement Goals</Text>
            <View style={s.goalItem}>
              <Ionicons name="trophy-outline" size={20} color="#F59E0B" />
              <Text style={s.goalText}>Complete 20 check-ins this month</Text>
              <Text style={s.goalProgress}>{stats.daysPresent}/20</Text>
            </View>
            <View style={s.goalItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color={C.teal} />
              <Text style={s.goalText}>Keep streak above 5 days</Text>
              <Text style={[s.goalProgress, { color: stats.streak >= 5 ? C.teal : C.subtle }]}>
                {stats.streak >= 5 ? 'Done' : 'In Progress'}
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingBottom: 120,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40
  },
  headerContent: { alignItems: 'center', paddingTop: 20 },
  streakCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  streakNum: { fontSize: 48, fontWeight: '900', color: C.white },
  streakLbl: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  flame: { position: 'absolute', bottom: -10, right: -5 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.white, marginBottom: 4 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  content: { padding: 24, paddingBottom: 120 },
  grid: { flexDirection: 'row', gap: 16, marginTop: -50 },
  card: { flex: 1, backgroundColor: C.white, borderRadius: 24, padding: 20, elevation: 4, shadowColor: C.navy, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 10, fontWeight: '700', color: C.subtle, letterSpacing: 0.5, marginBottom: 4 },
  cardValue: { fontSize: 20, fontWeight: '800', color: C.navy },
  section: { marginTop: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.navy, marginBottom: 16, paddingLeft: 4 },
  scoreCard: { backgroundColor: C.white, borderRadius: 24, padding: 24, elevation: 2 },
  scoreInfo: { alignItems: 'center', marginBottom: 20 },
  scoreValue: { fontSize: 32, fontWeight: '900', color: C.navy },
  scoreLabel: { fontSize: 13, color: C.subtle, fontWeight: '600', marginTop: 4 },
  progressTrack: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: C.teal, borderRadius: 4 },
  goalItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 12, gap: 12 },
  goalText: { flex: 1, fontSize: 14, fontWeight: '600', color: C.navy },
  goalProgress: { fontSize: 12, fontWeight: '800', color: C.subtle }
});
