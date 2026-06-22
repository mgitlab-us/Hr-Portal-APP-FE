import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W } = Dimensions.get('window');

interface StatCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.prototype.props.name;
  colors: [string, string];
  subtitle?: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colors, subtitle, trend }) => (
  <LinearGradient colors={colors} style={s.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
    <View style={s.cardHead}>
      <View style={s.iconBg}>
        <Ionicons name={icon as any} size={18} color="#FFF" />
      </View>
      {trend && (
        <View style={s.trendBadge}>
          <Text style={s.trendText}>{trend}</Text>
        </View>
      )}
    </View>
    <Text style={s.cardVal}>{value}</Text>
    <Text style={s.cardTitle}>{title}</Text>
    {subtitle && <Text style={s.cardSub}>{subtitle}</Text>}
  </LinearGradient>
);

const s = StyleSheet.create({
  card: {
    width: (SCREEN_W - 56) / 2,
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  iconBg: { width: 32, height: 32, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  trendBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)' },
  trendText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  cardVal: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  cardSub: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: '500' },
});
