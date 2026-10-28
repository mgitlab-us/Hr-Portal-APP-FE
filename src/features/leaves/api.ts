import { apiClient } from '@/lib/axios';

export type LeaveDuration = 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';
export type ApprovalStage = 'MANAGER' | 'HR' | 'COMPLETE';

export interface LeaveAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'SICK' | 'CASUAL' | 'VACATION' | 'OTHER';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  duration?: LeaveDuration;
  approvalStage?: ApprovalStage;
  managerId?: string | null;
  managerReviewedBy?: string | null;
  managerReviewedAt?: string | null;
  managerReviewNote?: string | null;
  attachment?: LeaveAttachment | null;
  reviewNote?: string;
  reviewedAt?: string | null;
  createdAt: string;
  employee?: {
    name: string;
    profile?: {
      employeeCode: string;
      department: string;
      designation?: string | null;
    };
  };
}

export interface CalendarLeave {
  id: string;
  employeeId: string;
  type: 'SICK' | 'CASUAL' | 'VACATION' | 'OTHER';
  duration: LeaveDuration;
  startDate: string;
  endDate: string;
  employee: {
    id: string;
    name: string;
    profile?: { employeeCode: string; designation: string | null } | null;
    department?: { name: string } | null;
  };
}

export interface LeaveBalanceCategory {
  allowance: number;
  carryForward: number;
  total: number;
  used: number;
  remaining: number;
}

export interface LeaveBalances {
  year: number;
  cycleStart: string;
  cycleEnd: string;
  source?: 'DEPARTMENT' | 'COMPANY';
  departmentName?: string | null;
  sick: LeaveBalanceCategory;
  casual: LeaveBalanceCategory;
  vacation: LeaveBalanceCategory;
  other: { used: number };
}

export const leavesApi = {
  create: async (data: {
    type: LeaveRequest['type'];
    startDate: string;
    endDate: string;
    reason: string;
    duration?: LeaveDuration;
    attachment?: { fileName: string; mimeType: string; data: string };
  }) => {
    const res = await apiClient.post<LeaveRequest>('/leaves', data);
    return res.data;
  },
  getMyLeaves: async () => {
    const res = await apiClient.get<LeaveRequest[]>('/leaves/me');
    return res.data;
  },
  getMyBalances: async () => {
    const res = await apiClient.get<LeaveBalances>('/leaves/balances');
    return res.data;
  },
  getAdminPending: async () => {
    const res = await apiClient.get<LeaveRequest[]>('/leaves/admin/pending');
    return res.data;
  },
  getManagerPending: async () => {
    const res = await apiClient.get<LeaveRequest[]>('/leaves/manager/pending');
    return res.data;
  },
  getCalendar: async (from: string, to: string) => {
    const res = await apiClient.get<{ from: string; to: string; leaves: CalendarLeave[] }>(
      '/leaves/calendar',
      { params: { from, to } }
    );
    return res.data;
  },
  getAttachment: async (id: string) => {
    const res = await apiClient.get<{
      fileName: string;
      mimeType: string;
      size: number;
      data: string;
    }>(`/leaves/${id}/attachment`);
    return res.data;
  },
  review: async (id: string, data: { status: 'APPROVED' | 'REJECTED'; reviewNote?: string }) => {
    const res = await apiClient.put<LeaveRequest>(`/leaves/${id}/review`, data);
    return res.data;
  },
};
