import { apiClient } from '@/lib/axios';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'SICK' | 'CASUAL' | 'VACATION' | 'OTHER';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string;
  createdAt: string;
  employee?: {
    name: string;
    profile?: {
      employeeCode: string;
      department: string;
    }
  }
}

export const leavesApi = {
  create: async (data: any) => {
    const res = await apiClient.post<LeaveRequest>('/leaves', data);
    return res.data;
  },
  getMyLeaves: async () => {
    const res = await apiClient.get<LeaveRequest[]>('/leaves/me');
    return res.data;
  },
  getAdminPending: async () => {
    const res = await apiClient.get<LeaveRequest[]>('/leaves/admin/pending');
    return res.data;
  },
  review: async (id: string, data: { status: 'APPROVED' | 'REJECTED', reviewNote?: string }) => {
    const res = await apiClient.put<LeaveRequest>(`/leaves/admin/${id}/review`, data);
    return res.data;
  },
};
