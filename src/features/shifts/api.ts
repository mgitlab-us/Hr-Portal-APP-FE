import { apiClient } from '@/lib/axios';

export interface ShiftProfile {
  id: string;
  name: string;
  workMinutesPerDay: number;
  breakMinutesAllocated: number;
  gracePeriodMinutes: number;
  expectedCheckinHour: number;
  expectedCheckinMinute: number;
  isDefault: boolean;
}

export const shiftsApi = {
  getCompanyShifts: () => apiClient.get<ShiftProfile[]>('/shifts'),
  createShift: (data: Omit<ShiftProfile, 'id' | 'isDefault'>) => apiClient.post<ShiftProfile>('/shifts', data),
  updateShift: (id: string, data: Partial<ShiftProfile>) => apiClient.patch<ShiftProfile>(`/shifts/${id}`, data),
  deleteShift: (id: string) => apiClient.delete(`/shifts/${id}`),
};
