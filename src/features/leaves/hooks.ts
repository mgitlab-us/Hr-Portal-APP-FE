import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leavesApi } from './api';

export function useMyLeaves() {
  return useQuery({
    queryKey: ['leaves', 'me'],
    queryFn: leavesApi.getMyLeaves,
  });
}

export function useAdminPendingLeaves() {
  return useQuery({
    queryKey: ['leaves', 'admin', 'pending'],
    queryFn: leavesApi.getAdminPending,
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leavesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
}

export function useReviewLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => leavesApi.review(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
}
