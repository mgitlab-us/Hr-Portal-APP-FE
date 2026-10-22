import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { TAB_BAR_HEIGHT } from '@/components/CustomTabBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNoticeRealtime, useNotices } from '@/features/notices/hooks';
import { NoticeCard } from '@/features/notices/components/NoticeCard';
import { NoticeDetailModal } from '@/features/notices/components/NoticeDetailModal';
import { NoticeTypeFilters } from '@/features/notices/components/NoticeTypeFilters';
import {
  NOTICE_FILTERS,
  type Notice,
  type NoticeFilter,
} from '@/features/notices/types';

export default function NoticeBoardScreen() {
  const [filter, setFilter] = useState<NoticeFilter>('ALL');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<FlatList<Notice>>(null);

  const {
    data,
    isLoading,
    isError,
    isRefetching,
    isFetchingNextPage,
    isFetching,
    hasNextPage,
    isStale,
    fetchNextPage,
    refetch,
  } = useNotices(filter);

  useNoticeRealtime();

  // Reconcile edits/deletes when the tab regains focus after the cache goes stale.
  useFocusEffect(
    useCallback(() => {
      if (isStale && !isFetching) {
        void refetch();
      }
    }, [isFetching, isStale, refetch])
  );

  const notices = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );
  const total = data?.pages[0]?.total ?? notices.length;
  const activeFilter = NOTICE_FILTERS.find((option) => option.value === filter);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleFilterChange = useCallback((value: NoticeFilter) => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    setFilter(value);
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Notice }) => (
      <NoticeCard notice={item} onPress={setSelectedNotice} />
    ),
    []
  );

  const countLabel = isLoading
    ? 'Loading notices...'
    : total === 1
      ? '1 notice'
      : `${notices.length}${total > notices.length ? ` of ${total}` : ''} notices`;

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#0D1B2A', '#1a2d42']}>
        <SafeAreaView edges={['top']}>
          <View className="px-5 pb-8 pt-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text
                  className="mb-1 text-[10px] font-bold uppercase tracking-[2px]"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Organization
                </Text>
                <Text className="text-2xl font-extrabold tracking-tight text-white">
                  Notice Board
                </Text>
                <Text className="mt-1 text-xs text-white/50">
                  Announcements, holidays and urgent updates
                </Text>
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10">
                <Ionicons name="megaphone" size={20} color="#fff" />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View className="pb-2 pt-4">
        <NoticeTypeFilters value={filter} onChange={handleFilterChange} />

        <View className="mt-2 flex-row items-center justify-between px-5">
          <Text className="text-[11px] font-medium text-slate-400">{countLabel}</Text>
          {isRefetching && !refreshing && !isLoading ? (
            <ActivityIndicator size="small" color="#94A3B8" />
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 px-5 pt-2">
          {[0, 1, 2].map((item) => (
            <Skeleton
              key={item}
              width="100%"
              height={150}
              borderRadius={16}
              style={{ marginBottom: 12 }}
            />
          ))}
        </View>
      ) : isError && notices.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="mb-5 h-20 w-20 items-center justify-center rounded-3xl border border-rose-100 bg-rose-50">
            <Ionicons name="cloud-offline-outline" size={32} color="#E11D48" />
          </View>
          <Text className="mb-2 text-lg font-bold text-slate-700">Could not load notices</Text>
          <Text className="text-center text-sm leading-6 text-slate-400">
            Check your connection and try again.
          </Text>
          <TouchableOpacity
            onPress={() => void refetch()}
            className="mt-5 rounded-xl bg-[#1C2840] px-5 py-3"
            accessibilityRole="button"
            accessibilityLabel="Retry loading notices"
          >
            <Text className="text-xs font-bold uppercase tracking-wider text-white">Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={notices}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: TAB_BAR_HEIGHT + 24,
            flexGrow: notices.length === 0 ? 1 : 0,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#1C2840"
              colors={['#1C2840']}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View className="mt-20 items-center px-10">
              <View className="mb-6 h-20 w-20 items-center justify-center rounded-3xl border border-slate-200 bg-slate-100">
                <Ionicons name="notifications-off-outline" size={32} color="#94A3B8" />
              </View>
              <Text className="mb-2 text-lg font-bold text-slate-700">
                {filter === 'ALL' ? 'Steady here' : `No ${activeFilter?.label.toLowerCase() ?? 'notices'} yet`}
              </Text>
              <Text className="text-center text-sm leading-6 text-slate-400">
                {filter === 'ALL'
                  ? 'No new notices or announcements have been posted yet.'
                  : 'There are no notices in this category right now.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            notices.length > 0 ? (
              <View className="items-center py-4">
                {isFetchingNextPage ? (
                  <ActivityIndicator color="#1C2840" />
                ) : !hasNextPage ? (
                  <Text className="text-[10px] font-semibold uppercase tracking-widest text-slate-300">
                    You're all caught up
                  </Text>
                ) : null}
              </View>
            ) : null
          }
        />
      )}

      <NoticeDetailModal
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
      />
    </View>
  );
}
