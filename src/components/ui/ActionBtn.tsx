import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActionBtnProps {
  title: string;
  icon: keyof typeof Ionicons.prototype.props.name;
  onPress: () => void;
  color?: string;
  description?: string;
}

export const ActionBtn: React.FC<ActionBtnProps> = ({ title, icon, onPress, color = '#6366f1', description }) => (
  <TouchableOpacity style={s.btn} onPress={onPress} activeOpacity={0.7}>
    <View style={[s.iconBox, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon as any} size={24} color={color} />
    </View>
    <View style={s.textSide}>
      <Text style={s.btnTitle}>{title}</Text>
      {description && <Text style={s.btnSub}>{description}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
  </TouchableOpacity>
);

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textSide: { flex: 1 },
  btnTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  btnSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
});
