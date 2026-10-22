import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/hooks/useSocket';
import { noticesApi } from './api';
import type { NoticeFilter } from './types';

export const NOTICE_PAGE_SIZE = 20;

export function useNotices(filter: NoticeFilter) {
  return useInfiniteQuery({
    queryKey: ['notices', 'list', filter] as const,
    queryFn: ({ pageParam }) =>
      noticesApi.list({
        page: pageParam,
        limit: NOTICE_PAGE_SIZE,
        type: filter === 'ALL' ? undefined : filter,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const loaded = allPages.reduce((total, page) => total + page.data.length, 0);
      return loaded < lastPage.total ? lastPageParam + 1 : undefined;
    },
    staleTime: 30_000,
  });
}

export function useNoticeRealtime() {
  const queryClient = useQueryClient();

  useSocket('notice:new', () => {
    void queryClient.invalidateQueries({ queryKey: ['notices'] });
  });
}
