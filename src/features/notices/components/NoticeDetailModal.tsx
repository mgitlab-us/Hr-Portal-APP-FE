import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NOTICE_TYPE_META, type Notice } from '../types';
import { formatNoticeDate } from '../utils';

interface NoticeDetailModalProps {
  notice: Notice | null;
  onClose: () => void;
}

export function NoticeDetailModal({ notice, onClose }: NoticeDetailModalProps) {
  const insets = useSafeAreaInsets();
  const meta = notice
    ? NOTICE_TYPE_META[notice.type] ?? NOTICE_TYPE_META.ANNOUNCEMENT
    : NOTICE_TYPE_META.ANNOUNCEMENT;

  const postedAt = notice ? formatNoticeDate(notice.createdAt) : '';
  const updatedAt =
    notice && notice.updatedAt && notice.updatedAt !== notice.createdAt
      ? formatNoticeDate(notice.updatedAt)
      : '';

  return (
    <Modal
      visible={notice !== null}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          className="rounded-t-3xl bg-white"
          style={{ maxHeight: '88%', paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="items-center pt-3">
            <View className="h-1 w-10 rounded-full bg-slate-200" />
          </View>

          <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
            {notice ? (
              <View className={`flex-row items-center gap-1.5 rounded-lg px-2.5 py-1 ${meta.bg}`}>
                <Ionicons name={meta.icon as any} size={14} color={meta.color} />
                <Text className={`text-[11px] font-bold uppercase tracking-wider ${meta.text}`}>
                  {meta.label}
                </Text>
              </View>
            ) : (
              <View />
            )}

            <TouchableOpacity
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"
              accessibilityRole="button"
              accessibilityLabel="Close notice"
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {notice && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
            >
              <Text className="mt-2 text-[22px] font-extrabold leading-8 text-slate-900">
                {notice.title}
              </Text>

              <View className="mt-4 flex-row flex-wrap items-center gap-x-4 gap-y-1.5">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="time-outline" size={14} color="#94A3B8" />
                  <Text className="text-[12px] font-medium text-slate-400">{postedAt}</Text>
                </View>

                <View className="flex-row items-center gap-1.5">
                  <Ionicons
                    name={notice.departmentId ? 'business-outline' : 'people-outline'}
                    size={14}
                    color="#94A3B8"
                  />
                  <Text className="text-[12px] font-medium text-slate-400">
                    {notice.departmentId ? 'Department notice' : 'All employees'}
                  </Text>
                </View>
              </View>

              {updatedAt ? (
                <Text className="mt-1.5 text-[11px] font-medium text-slate-400">
                  Updated {updatedAt}
                </Text>
              ) : null}

              <View className="my-5 h-px bg-slate-100" />

              <Text className="text-[15px] leading-7 text-slate-600">{notice.content}</Text>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
