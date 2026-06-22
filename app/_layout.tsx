import '../uniwind.css';
import '@/lib/notificationService';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store';
import { KeyboardProvider, KeyboardController } from 'react-native-keyboard-controller';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { isAuthenticated, employee } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Safety check for Expo Go (where native modules aren't linked)
  const isLinked = !!KeyboardController && Platform.OS !== 'web';

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated) {
      if (!inAuthGroup) router.replace('/(auth)/login');
    } else {
      if (employee?.mustChangePassword) {
        if (!segments.includes('change-password')) router.replace('/(auth)/change-password');
      } else if (inAuthGroup) {
        const target = (employee?.role === 'ADMIN' || employee?.role === 'SUPER_ADMIN') 
          ? '/(admin)/' : '/(employee)/';
        router.replace(target);
      }
    }
  }, [isAuthenticated, employee, segments]);

  return (
    <QueryClientProvider client={queryClient}>
      <KeyboardProvider enabled={isLinked}>
        <Slot />
      </KeyboardProvider>
    </QueryClientProvider>
  );
}
