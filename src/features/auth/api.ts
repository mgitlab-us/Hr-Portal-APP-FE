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
  },

  forgotPassword: async (email: string) => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  verifyResetOtp: async (email: string, otp: string) => {
    const res = await apiClient.post('/auth/verify-reset-otp', { email, otp });
    return res.data;
  },

  resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
    const res = await apiClient.post('/auth/reset-password', data);
    return res.data;
  },
};
