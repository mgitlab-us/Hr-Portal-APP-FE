import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NOTICE_TYPE_META, type Notice } from '../types';
import { formatNoticeDate } from '../utils';

interface NoticeCardProps {
  notice: Notice;
  onPress: (notice: Notice) => void;
}

export function NoticeCard({ notice, onPress }: NoticeCardProps) {
  const meta = NOTICE_TYPE_META[notice.type] ?? NOTICE_TYPE_META.ANNOUNCEMENT;
  const postedAt = formatNoticeDate(notice.createdAt, 'dd MMM yyyy · hh:mm a');

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(notice)}
      className="mb-3 overflow-hidden rounded-2xl bg-white"
      style={{
        borderWidth: 0.5,
        borderColor: '#E2E8F0',
        borderLeftWidth: 4,
        borderLeftColor: meta.color,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
      accessibilityRole="button"
      accessibilityLabel={`Open notice: ${notice.title}`}
    >
      <View className="p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <View className={`flex-row items-center gap-1.5 rounded-lg px-2.5 py-1 ${meta.bg}`}>
            <Ionicons name={meta.icon as any} size={14} color={meta.color} />
            <Text className={`text-[11px] font-bold uppercase tracking-wider ${meta.text}`}>
              {meta.label}
            </Text>
          </View>
          <Text className="text-[11px] font-medium text-slate-400">{postedAt}</Text>
        </View>

        <Text className="mb-2 text-lg font-bold text-slate-800" numberOfLines={2}>
          {notice.title}
        </Text>
        <Text className="text-sm leading-6 text-slate-500" numberOfLines={3}>
          {notice.content}
        </Text>

        <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3">
          <View className="flex-row items-center gap-1.5">
            <Ionicons
              name={notice.departmentId ? 'business-outline' : 'people-outline'}
              size={13}
              color="#94A3B8"
            />
            <Text className="text-[11px] font-medium text-slate-400">
              {notice.departmentId ? 'Department notice' : 'All employees'}
            </Text>
          </View>

          <View className="flex-row items-center gap-0.5">
            <Text className="text-[11px] font-semibold text-blue-600">Read</Text>
            <Ionicons name="chevron-forward" size={13} color="#2563EB" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
