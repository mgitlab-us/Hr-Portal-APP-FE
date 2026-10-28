import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leavesApi } from './api';

export function useMyLeaves() {
  return useQuery({
    queryKey: ['leaves', 'me'],
    queryFn: leavesApi.getMyLeaves,
  });
}

export function useMyLeaveBalances() {
  return useQuery({
    queryKey: ['leaves', 'balances'],
    queryFn: leavesApi.getMyBalances,
  });
}

export function useAdminPendingLeaves() {
  return useQuery({
    queryKey: ['leaves', 'admin', 'pending'],
    queryFn: leavesApi.getAdminPending,
  });
}

export function useManagerPendingLeaves() {
  return useQuery({
    queryKey: ['leaves', 'manager', 'pending'],
    queryFn: leavesApi.getManagerPending,
  });
}

export function useTeamLeaveCalendar(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: ['leaves', 'calendar', from, to],
    queryFn: () => leavesApi.getCalendar(from, to),
    enabled,
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
