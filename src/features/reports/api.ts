import * as FileSystem from 'expo-file-system/legacy';
const { cacheDirectory, documentDirectory } = FileSystem as any;
const CACHE_DIR: string = (cacheDirectory || documentDirectory || '').replace(/\/?$/, '/');
const DOC_DIR: string = (documentDirectory || cacheDirectory || '').replace(/\/?$/, '/');

import { apiClient } from '@/lib/axios';
import { secureStorage } from '@/lib/secureStorage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const REPORTS_DIR = `${DOC_DIR}reports/`;
const DOWNLOADS_DIR_URI_KEY = 'attendance_app_downloads_dir_uri';

const ensureReportsDir = async () => {
  const info = await FileSystem.getInfoAsync(REPORTS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(REPORTS_DIR, { intermediates: true });
  }
};

const download = async (url: string, filename: string, isRetry = false): Promise<string> => {
  const token = await secureStorage.getAccessToken();
  // Download into cache first, then persist a copy in document storage.
  const cacheUri = `${CACHE_DIR}${filename}`;

  const result = await FileSystem.downloadAsync(url, cacheUri, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (result.status === 401 && !isRetry) {
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken) {
        const { data } = await apiClient.post('/auth/refresh', { refreshToken });
        await secureStorage.setTokens(data.accessToken, data.refreshToken);
        return download(url, filename, true);
      }
    } catch (refreshErr) {
      console.error('Download auto-refresh failed:', refreshErr);
    }
  }

  if (result.status !== 200) {
    throw new Error(`Download failed: ${result.status}`);
  }

  await ensureReportsDir();
  const persistentUri = `${REPORTS_DIR}${filename}`;
  await FileSystem.copyAsync({ from: result.uri, to: persistentUri });

  // Also try to save into Android's public Downloads via SAF (requires 1-time permission).
  // This makes the files appear like "normal app downloads" in the phone Downloads folder.
  if (Platform.OS === 'android') {
    const ext = filename.toLowerCase().includes('.xlsx') ? 'xlsx' : filename.toLowerCase().includes('.pdf') ? 'pdf' : '';
    const mimeType =
      ext === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : ext === 'pdf'
          ? 'application/pdf'
          : null;

    if (mimeType) {
      try {
        let downloadsDirUri = await SecureStore.getItemAsync(DOWNLOADS_DIR_URI_KEY);
        if (!downloadsDirUri) {
          // Preselect the Downloads folder in the SAF picker.
          const initial = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initial);
          if (permissions.granted) {
            downloadsDirUri = permissions.directoryUri;
            await SecureStore.setItemAsync(DOWNLOADS_DIR_URI_KEY, downloadsDirUri);
          }
        }

        if (downloadsDirUri) {
          // SAF createFileAsync expects name without extension.
          const fileNameWithoutExt = filename.replace(/\.[^/.]+$/, '');

          // Some devices/dev modes may throw if a file already exists; fall back to unique name.
          const baseName = fileNameWithoutExt;
          const createAttempt = async (name: string) => {
            const safFileUri = await FileSystem.StorageAccessFramework.createFileAsync(downloadsDirUri!, name, mimeType);
            // Write binary file as base64 into the SAF target.
            const base64 = await FileSystem.readAsStringAsync(result.uri, { encoding: FileSystem.EncodingType.Base64 });
            await FileSystem.writeAsStringAsync(safFileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
          };

          try {
            await createAttempt(baseName);
          } catch (e) {
            await createAttempt(`${baseName}-${Date.now()}`);
          }
        }
      } catch (e) {
        console.error('Failed to save to Downloads:', e);
      }
    }
  }

  // Keep using content URI on Android for compatibility with file openers,
  // while also persisting the real file in app document storage.
  if (Platform.OS === 'android') {
    try {
      return await FileSystem.getContentUriAsync(persistentUri);
    } catch (e) {
      console.error('Failed to get content URI:', e);
      return persistentUri;
    }
  }

  return persistentUri;
};

export const reportsApi = {
  downloadMonthlyReport: async (year: number, month: number) => {
    const filename = `attendance-${year}-${month}.xlsx`;
    const url = `${apiClient.defaults.baseURL}/reports/monthly?year=${year}&month=${month}`;
    return download(url, filename);
  },

  downloadMonthlyPDF: async (year: number, month: number) => {
    const filename = `attendance-${year}-${month}.pdf`;
    const url = `${apiClient.defaults.baseURL}/reports/monthly-pdf?year=${year}&month=${month}`;
    return download(url, filename);
  },
  downloadMyMonthlyPDF: async (year: number, month: number) => {
    const filename = `my-attendance-${year}-${month}.pdf`;
    const url = `${apiClient.defaults.baseURL}/reports/my-monthly-pdf?year=${year}&month=${month}`;
    return download(url, filename);
  },
};
