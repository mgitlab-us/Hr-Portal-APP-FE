import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { syncPushTokenToServer } from '@/lib/notificationService';

export function usePushNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      syncedRef.current = false;
      return;
    }
    if (syncedRef.current) return;

    syncedRef.current = true;
    syncPushTokenToServer();
  }, [isAuthenticated]);
}
