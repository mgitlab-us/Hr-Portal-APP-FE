import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { apiClient } from '@/lib/axios';

export type DocumentCategory =
  | 'CONTRACT'
  | 'ID_PROOF'
  | 'RESUME'
  | 'TAX_FORM'
  | 'CERTIFICATE'
  | 'OTHER';

export type EmployeeDocument = {
  id: string;
  employeeId: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

type DocumentsResponse = {
  data: EmployeeDocument[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type DocumentDownload = {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  data: string;
};

const { cacheDirectory, documentDirectory } = FileSystem as any;
const CACHE_DIR: string = (cacheDirectory || documentDirectory || '').replace(/\/?$/, '/');

const safeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'document';

export const documentsApi = {
  listMine: async (): Promise<EmployeeDocument[]> => {
    const res = await apiClient.get<DocumentsResponse | EmployeeDocument[]>('/documents', {
      params: { limit: 100 },
    });
    const payload = res.data;
    return Array.isArray(payload) ? payload : payload.data || [];
  },

  download: async (document: EmployeeDocument): Promise<string> => {
    const res = await apiClient.get<DocumentDownload>(`/documents/${document.id}`);
    const payload = res.data;
    if (!payload?.data) {
      throw new Error('Document content is unavailable');
    }

    const cleanBase64 = payload.data.replace(/^data:[^;]+;base64,/, '');
    const target = `${CACHE_DIR}${document.id}-${safeFileName(payload.fileName || document.fileName)}`;
    await FileSystem.writeAsStringAsync(target, cleanBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (Platform.OS === 'android') {
      try {
        return await FileSystem.getContentUriAsync(target);
      } catch (error) {
        console.error('Could not create a shareable document URI:', error);
      }
    }

    return target;
  },
};
