import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { NOTICE_FILTERS, NOTICE_TYPE_META, type NoticeFilter } from '../types';

interface NoticeTypeFiltersProps {
  value: NoticeFilter;
  onChange: (value: NoticeFilter) => void;
}

export function NoticeTypeFilters({ value, onChange }: NoticeTypeFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
    >
      {NOTICE_FILTERS.map((option) => {
        const active = option.value === value;
        const meta = option.value === 'ALL' ? null : NOTICE_TYPE_META[option.value];

        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.8}
            onPress={() => onChange(option.value)}
            className={`flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 ${
              active
                ? 'border-[#1C2840] bg-[#1C2840]'
                : 'border-slate-200 bg-white'
            }`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Filter notices by ${option.label}`}
          >
            {meta && (
              <View
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
            )}
            <Text
              className={`text-xs font-semibold ${
                active ? 'text-white' : 'text-slate-600'
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
