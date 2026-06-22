import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/features/auth/store';
import { secureStorage } from '@/lib/secureStorage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  navy: '#0F1D3A',
  accent: '#5BA3F5',
  teal: '#1DB8A0',
  white: '#FFFFFF',
  subtle: '#8A9BB5',
  danger: '#FF6B6B',
  bg: '#F8FAFC',
};

function SettingRow({ icon, label, color = C.navy, onPress }: any) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress}>
      <View style={[s.rowIcon, { backgroundColor: `${color}10` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={s.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={C.subtle} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

export default function AdminProfileScreen() {
  const { employee, clearAuth } = useAuthStore();
  const insets = useSafeAreaInsets();
  const avatarLetter = employee?.name?.[0]?.toUpperCase() || 'A';

  const handleLogout = async () => {
    await secureStorage.removeTokens();
    clearAuth();
    router.replace('/(auth)/login');
  };




  return (
    <SafeAreaView style={s.root} edges={['bottom']}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 114 + insets.bottom + 16 }}
      >
        {/* ── Header ── */}
        <LinearGradient colors={[C.navy, '#1E293B']} style={s.header}>
          <SafeAreaView>
            <View style={s.headerContent}>
              <View style={s.avatarContainer}>
                <LinearGradient colors={['#818CF8', '#4F46E5']} style={s.avatarGradient}>
                  <Text style={s.avatarText}>{avatarLetter}</Text>
                </LinearGradient>
                <View style={s.adminBadge}>
                  <Ionicons name="shield-checkmark" size={11} color={C.white} />
                </View>
              </View>
              <Text style={s.name}>{employee?.name || 'Administrator'}</Text>
              <View style={s.badge}>
                <Text style={s.badgeText}>{employee?.role || 'ADMIN'}</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ── Content ── */}
        <View style={s.content}>

          {/* Account info */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Account</Text>
            <View style={s.card}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Name</Text>
                <Text style={s.infoValue}>{employee?.name || '-'}</Text>
              </View>
              <View style={s.divider} />
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Email</Text>
                <Text style={s.infoValue}>{employee?.email || '-'}</Text>
              </View>
              <View style={s.divider} />
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Role</Text>
                <Text style={s.infoValue}>{employee?.role || 'ADMIN'}</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Quick Actions</Text>
            <View style={s.card}>
              <SettingRow icon="people-outline" label="Team Directory" color={C.accent} onPress={() => router.push('/(admin)/employees')} />
              <View style={s.divider} />
              <SettingRow icon="person-add-outline" label="Add Employee" color={C.teal} onPress={() => router.push('/(admin)/create-employee')} />
              <View style={s.divider} />
              <SettingRow icon="time-outline" label="Shift Settings" color="#2563EB" onPress={() => router.push('/(admin)/shift-settings')} />
              <View style={s.divider} />
              <SettingRow icon="calendar-outline" label="Leave Approvals" color="#7C5CBF" onPress={() => router.push('/(admin)/leave-approvals')} />
              <View style={s.divider} />
              <SettingRow icon="checkmark-done-outline" label="Corrections Queue" color="#F59E0B" onPress={() => router.push('/(admin)/corrections')} />
              <View style={s.divider} />
              <SettingRow icon="bar-chart-outline" label="Reports & Exports" color="#10B981" onPress={() => router.push('/(admin)/reports')} />
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <View style={s.logoutInner}>
              <Ionicons name="log-out-outline" size={18} color={C.danger} />
              <Text style={s.logoutText}>Log Out from Admin Console</Text>
            </View>
          </TouchableOpacity>

          <Text style={s.version}>AttendX Admin v1.0.0 • Secure Session</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Header ──────────────────────────────────────────────────
  header: {
    paddingBottom: 32,           // was 120 — unnecessarily tall
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: { alignItems: 'center', paddingTop: 16 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatarGradient: {
    width: 80,                   // was 100 — more proportional
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: C.white },
  adminBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: C.teal,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.navy,
  },
  name: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 6 },
  badge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '800', color: C.white, letterSpacing: 1 },

  // ── Body ────────────────────────────────────────────────────
  content: { paddingHorizontal: 20 },   // no paddingBottom — handled by ScrollView

  section: { marginTop: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    paddingLeft: 2,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8ECF4',
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── Rows ────────────────────────────────────────────────────
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowLabel: { fontSize: 14, color: C.navy, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#F1F5F9' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoLabel: { fontSize: 12, color: C.subtle, fontWeight: '600' },
  infoValue: { fontSize: 13, color: C.navy, fontWeight: '700' },

  // ── Logout ──────────────────────────────────────────────────
  logoutBtn: { marginTop: 28 },
  logoutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFD5D5',
    backgroundColor: '#FFF5F5',
  },
  logoutText: { color: C.danger, fontSize: 14, fontWeight: '700' },

  version: { textAlign: 'center', marginTop: 20, color: '#CBD5E1', fontSize: 11, fontWeight: '500' },
});