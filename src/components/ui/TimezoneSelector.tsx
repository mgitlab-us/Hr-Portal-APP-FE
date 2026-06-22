import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, FlatList,
  TextInput, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TIMEZONE_OPTIONS, TimezoneOption } from '@/data/timezones';

interface TimezoneSelectorProps {
  value: string;           // IANA timezone string e.g. "Asia/Karachi"
  onChange: (tz: string) => void;
  error?: string;
  label?: string;
}

const C = {
  navy: '#0F172A',
  navyMid: '#1E293B',
  accent: '#6366F1',
  border: '#CBD5E1',
  bg: '#F8FAFC',
  muted: '#94A3B8',
  subtle: '#64748B',
  white: '#FFFFFF',
  error: '#EF4444',
};

export function TimezoneSelector({ value, onChange, error, label = 'Timezone' }: TimezoneSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Derive display label from current IANA value
  const selected = useMemo(
    () => TIMEZONE_OPTIONS.find(o => o.timezone === value),
    [value]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return TIMEZONE_OPTIONS;
    const q = search.toLowerCase();
    return TIMEZONE_OPTIONS.filter(
      o =>
        o.city.toLowerCase().includes(q) ||
        o.country.toLowerCase().includes(q) ||
        o.timezone.toLowerCase().includes(q) ||
        o.offset.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (option: TimezoneOption) => {
    onChange(option.timezone);
    setOpen(false);
    setSearch('');
  };

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={[s.trigger, error && s.triggerError]}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        <Ionicons name="globe-outline" size={18} color={selected ? C.accent : C.muted} style={s.triggerIcon} />
        <View style={s.triggerText}>
          <Text style={s.triggerLabel}>{label}</Text>
          <Text style={[s.triggerValue, !selected && s.placeholder]} numberOfLines={1}>
            {selected ? `${selected.city} (${selected.country}) — ${selected.offset}` : 'Select your timezone city'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={C.muted} />
      </TouchableOpacity>
      {error && <Text style={s.errorText}>{error}</Text>}

      {/* Fullscreen Modal Picker */}
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={s.modal}>
          {/* Header */}
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Timezone</Text>
            <Pressable onPress={() => { setOpen(false); setSearch(''); }} hitSlop={12}>
              <Ionicons name="close" size={22} color={C.navy} />
            </Pressable>
          </View>

          {/* Search */}
          <View style={s.searchBar}>
            <Ionicons name="search-outline" size={16} color={C.muted} />
            <TextInput
              style={s.searchInput}
              placeholder="Search city, country or offset…"
              placeholderTextColor={C.muted}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={C.muted} />
              </Pressable>
            )}
          </View>

          {/* Results */}
          <FlatList
            data={filtered}
            keyExtractor={(item, idx) => `${item.timezone}-${item.city}-${idx}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => {
              const isSelected = item.timezone === value && item.city === selected?.city;
              return (
                <TouchableOpacity
                  style={[s.row, isSelected && s.rowSelected]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={s.rowContent}>
                    <Text style={[s.rowCity, isSelected && s.rowCitySelected]}>{item.city}</Text>
                    <Text style={s.rowCountry}>{item.country}</Text>
                  </View>
                  <Text style={[s.rowOffset, isSelected && s.rowOffsetSelected]}>{item.offset}</Text>
                  {isSelected && <Ionicons name="checkmark" size={16} color={C.accent} style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="search-outline" size={32} color={C.border} />
                <Text style={s.emptyText}>No results for "{search}"</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  triggerError: { borderColor: C.error },
  triggerIcon: { width: 20 },
  triggerText: { flex: 1 },
  triggerLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  triggerValue: { fontSize: 14, fontWeight: '600', color: C.navy },
  placeholder: { color: C.muted, fontWeight: '400' },
  errorText: { fontSize: 11, color: C.error, marginTop: 4, marginLeft: 4 },

  modal: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.white,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: C.navy },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.white,
    marginHorizontal: 16, marginVertical: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.navy },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0',
    backgroundColor: C.white,
  },
  rowSelected: { backgroundColor: '#EEF2FF' },
  rowContent: { flex: 1 },
  rowCity: { fontSize: 15, fontWeight: '700', color: C.navy },
  rowCitySelected: { color: C.accent },
  rowCountry: { fontSize: 12, color: C.subtle, marginTop: 1 },
  rowOffset: { fontSize: 12, fontWeight: '600', color: C.subtle },
  rowOffsetSelected: { color: C.accent },

  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: C.muted },
});
