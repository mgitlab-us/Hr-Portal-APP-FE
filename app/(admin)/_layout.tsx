import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { CustomTabBar, TAB_BAR_HEIGHT } from '@/components/CustomTabBar';

import { useAuthStore } from '@/features/auth/store';

export default function AdminLayout() {
  usePushNotifications();
  const { employee } = useAuthStore();
  
  // Explicitly check for role to avoid undefined/flash issues
  const role = employee?.role;
  if (!role) return null; // Wait for auth state

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'ADMIN';

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as any)} />}
      screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: 'Directory',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="corrections"
        options={{
          href: isAdmin ? undefined : null,
          title: 'Corrections',
          tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="daily-logs"
        options={{
          href: isAdmin ? null : undefined,
          title: 'Attendance',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leave-approvals"
        options={{
          href: null,
          title: 'Leaves',
          tabBarIcon: ({ color, size }) => <Ionicons name="airplane" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
        }}
      />
      {/* Hidden route — accessed via tapping button in Directory */}
      <Tabs.Screen
        name="create-employee"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="shift-settings"
        options={{ href: null }}
      />
    </Tabs>
  );
}
