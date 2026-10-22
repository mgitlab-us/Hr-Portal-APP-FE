import { apiClient } from '@/lib/axios';
import type { Notice, NoticeListParams, NoticePage } from './types';

export const noticesApi = {
  list: async ({ page = 1, limit = 20, type }: NoticeListParams = {}): Promise<NoticePage> => {
    const res = await apiClient.get<NoticePage | Notice[]>('/notices', {
      params: {
        page,
        limit,
        ...(type ? { type } : {}),
      },
    });

    const payload = res.data;

    // Keep compatibility with older API builds that returned a plain array.
    if (Array.isArray(payload)) {
      return { data: payload, total: payload.length };
    }

    const data = payload?.data ?? [];
    return { data, total: payload?.total ?? data.length };
  },
};
