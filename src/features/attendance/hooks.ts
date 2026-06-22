import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from './api';

export function useTodayAttendance() {
  return useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceApi.getToday(),
  });
}

export function useAttendanceHistory() {
  return useQuery({
    queryKey: ['attendance', 'history'],
    queryFn: () => attendanceApi.getHistory(),
  });
}

export function usePersonalStats() {
  return useQuery({
    queryKey: ['attendance', 'stats', 'personal'],
    queryFn: () => attendanceApi.getPersonalStats(),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lat, lng, accuracy }: { lat: number; lng: number; accuracy: number }) => 
      attendanceApi.checkin(lat, lng, accuracy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lat, lng, accuracy }: { lat: number; lng: number; accuracy: number }) => 
      attendanceApi.checkout(lat, lng, accuracy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useStartBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceApi.startBreak(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useEndBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceApi.endBreak(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
