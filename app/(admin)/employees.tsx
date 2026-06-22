import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEmployees } from '@/hooks/useEmployees';

const C = {
  navy: '#0B0F17',
  bg: '#F3F4F8',
  card: '#FFFFFF',
  border: '#E5E9F2',
  text: '#1C2840',
  sub: '#96A0B5',
  muted: '#B0BCCF',
  blue: '#3D52D5',
  blueLight: '#ECEFFE',
  blueIcon: '#5B6EF5',
};

const AVATAR_PALETTE = [
  { bg: '#ECEFFE', text: '#5B6EF5' },
  { bg: '#E0F7F1', text: '#0D9E7A' },
  { bg: '#FEF6E4', text: '#D97706' },
  { bg: '#F4EFFE', text: '#8B5CF6' },
  { bg: '#FEE9ED', text: '#E8405A' },
  { bg: '#E0F0FF', text: '#2563EB' },
];

function avatarColors(name: string) {
  const i = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[i];
}

function EmployeeCard({ item, currentEmployee, onDeactivate }: any) {
  const av = avatarColors(item.name);
  const isAdmin = item.role !== 'EMPLOYEE';
  const isSelf = item.id === currentEmployee?.id;
  const isSuperAdmin = item.role === 'SUPER_ADMIN';

  return (
    <View style={card.wrap}>
      <View style={[card.avatar, { backgroundColor: av.bg }]}>
        <Text style={[card.avatarText, { color: av.text }]}>
          {item.name[0].toUpperCase()}
        </Text>
      </View>

      <View style={card.info}>
        <View style={card.nameRow}>
          <Text style={card.name} numberOfLines={1}>{item.name}</Text>
          {isAdmin && (
            <View style={[card.pill, { backgroundColor: av.bg }]}>
              <Text style={[card.pillText, { color: av.text }]}>
                {item.role.replace('_', ' ')}
              </Text>
            </View>
          )}
        </View>
        {(item.profile?.designation || item.profile?.department) && (
          <Text style={card.meta} numberOfLines={1}>
            {[item.profile?.designation, item.profile?.department].filter(Boolean).join('  ·  ')}
          </Text>
        )}
        <Text style={card.email} numberOfLines={1}>{item.email}</Text>
      </View>

      {!isSelf && !isSuperAdmin && (
        <TouchableOpacity style={card.delBtn} onPress={() => onDeactivate(item)} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    paddingVertical: 14,
    paddingHorizontal: 15,
    gap: 13,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 18, fontWeight: '500' },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 },
  name: { fontSize: 15, fontWeight: '600', color: C.text, flexShrink: 1 },
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  meta: { fontSize: 12, color: C.sub, marginBottom: 2 },
  email: { fontSize: 11, color: C.muted },
  delBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FEF2F2',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export default function EmployeesScreen() {
  const {
    filteredEmployees, loading, error,
    query, setQuery, loadData,
    handleDeactivate, currentEmployee,
  } = useEmployees();

  const insets = useSafeAreaInsets();

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <SafeAreaView style={s.header}>
        <View style={s.topRow}>
          <View>
            <Text style={s.adminTag}>Admin</Text>
            <Text style={s.title}>Team Directory</Text>
            <Text style={s.sub}>{filteredEmployees.length} active members</Text>
          </View>
          <TouchableOpacity
            style={s.addBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/(admin)/create-employee')}
          >
            <Ionicons name="person-add-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.3)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, email, department…"
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={s.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* BODY */}
      <View style={s.body}>

        {error && (
          <View style={s.errorCard}>
            <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={loadData}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={C.blue} />
            <Text style={s.loaderText}>Syncing team…</Text>
          </View>
        ) : (
          <FlatList
            data={filteredEmployees}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: { item: any }) => (
              <EmployeeCard
                item={item}
                currentEmployee={currentEmployee}
                onDeactivate={handleDeactivate}
              />
            )}
            contentContainerStyle={[
              s.list,
              { paddingBottom: insets.bottom + 90 },
            ]}
            showsVerticalScrollIndicator={false}
            onRefresh={loadData}
            refreshing={loading}
            ItemSeparatorComponent={() => <View style={{ height: 9 }} />}
            ListHeaderComponent={
              <View style={s.listHeader}>
                <Text style={s.secLabel}>All members</Text>
                <View style={s.countBadge}>
                  <Text style={s.countText}>{filteredEmployees.length} total</Text>
                </View>
              </View>
            }
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="people-outline" size={38} color="#CBD5E1" />
                <Text style={s.emptyText}>
                  {query.trim() ? 'No employees match your search.' : 'No active employees yet.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 8,
  },
  adminTag: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.28)',
    marginTop: 3,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
    gap: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    padding: 0,
  },

  body: { flex: 1 },

  errorCard: {
    marginHorizontal: 18,
    marginTop: 14,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  errorText: { flex: 1, color: '#991B1B', fontSize: 12, fontWeight: '500' },
  retryBtn: {
    backgroundColor: C.card,
    borderRadius: 7,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  retryText: { color: C.text, fontSize: 12, fontWeight: '600' },

  list: { paddingHorizontal: 18, paddingTop: 16 },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  secLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  countBadge: {
    backgroundColor: C.blueLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.blueIcon,
  },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 12, color: C.sub, fontSize: 13 },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 12, color: C.sub, fontSize: 13, textAlign: 'center' },
});