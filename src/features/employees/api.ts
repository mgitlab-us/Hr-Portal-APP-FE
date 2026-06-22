import { apiClient } from '@/lib/axios';

export const employeeApi = {
  list: async () => {
    const res = await apiClient.get('/employees');
    return res.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/employees', data);
    return res.data;
  },
  suggestCode: async (department?: string, designation?: string) => {
    const params: string[] = [];
    if (department) params.push(`department=${encodeURIComponent(department)}`);
    if (designation) params.push(`designation=${encodeURIComponent(designation)}`);
    const query = params.join('&');
    const res = await apiClient.get(`/employees/suggest-code${query ? `?${query}` : ''}`);
    return res.data as { employeeCode: string };
  },
  get: async (id: string) => {
    const res = await apiClient.get(`/employees/${id}`);
    return res.data;
  },
  deactivate: async (id: string) => {
    const res = await apiClient.delete(`/employees/${id}`);
    return res.data;
  }
};
