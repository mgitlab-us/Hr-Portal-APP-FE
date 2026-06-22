import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authApi } from '@/features/auth/api';

export const ANDROID_DEFAULT_CHANNEL = 'default';

// Must load at app startup so foreground notifications show banners.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_DEFAULT_CHANNEL, {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#5B6EF5',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (!Device.isDevice) {
    console.warn('[Push] Requires a physical device — emulators cannot receive push notifications.');
    return undefined;
  }

  if (typeof Notifications.getPermissionsAsync !== 'function') {
    console.warn('[Push] expo-notifications native module unavailable in this build.');
    return undefined;
  }

  const settings = (await Notifications.getPermissionsAsync()) as { granted?: boolean; status?: string };
  let granted = settings.granted ?? settings.status === 'granted';

  if (!granted) {
    const requested = (await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    })) as { granted?: boolean; status?: string };
    granted = requested.granted ?? requested.status === 'granted';
  }

  if (!granted) {
    console.warn('[Push] Notification permission denied');
    return undefined;
  }

  await ensureAndroidChannel();

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as typeof Constants & { easConfig?: { projectId?: string } }).easConfig?.projectId;

    if (!projectId) {
      console.error('[Push] EAS projectId missing from app.json extra.eas.projectId');
      return undefined;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('[Push] Expo push token:', token);
    return token;
  } catch (error) {
    console.error('[Push] Failed to get Expo push token:', error);
    return undefined;
  }
}

export async function syncPushTokenToServer(): Promise<boolean> {
  const token = await registerForPushNotificationsAsync();
  if (!token) return false;

  try {
    await authApi.updatePushToken(token);
    console.log('[Push] Token saved to server');
    return true;
  } catch (error) {
    console.error('[Push] Failed to save token to server:', error);
    return false;
  }
}
