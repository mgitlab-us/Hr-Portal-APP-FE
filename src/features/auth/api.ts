import { apiClient } from '../../lib/axios';
import { LoginInput, ChangePasswordInput } from '@/types';

export const authApi = {
  login: async (data: LoginInput) => {
    const res = await apiClient.post('/auth/login', data);
    return res.data;
  },

  registerCompany: async (data: any) => {
    const res = await apiClient.post('/auth/register-company', data);
    return res.data;
  },
  
  changePassword: async (data: ChangePasswordInput) => {
    const res = await apiClient.post('/auth/change-password', data);
    return res.data;
  },

  logout: async (refreshToken: string) => {
    const res = await apiClient.post('/auth/logout', { refreshToken });
    return res.data;
  },
  
  updatePushToken: async (pushToken: string) => {
    const res = await apiClient.put('/auth/push-token', { pushToken });
    return res.data;
  }
}
