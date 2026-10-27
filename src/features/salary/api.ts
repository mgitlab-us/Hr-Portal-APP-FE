import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { apiClient } from '@/lib/axios';
import { secureStorage } from '@/lib/secureStorage';

const { cacheDirectory, documentDirectory } = FileSystem as any;
const CACHE_DIR: string = (cacheDirectory || documentDirectory || '').replace(/\/?$/, '/');

export type Payslip = {
  id: string;
  month: number;
  year: number;
  amount: number;
  netAmount: number;
  baseSalary: number;
  houseRentAllowance: number;
  transportAllowance: number;
  medicalAllowance: number;
  otherAllowance: number;
  taxDeduction: number;
  otherDeduction: number;
  grossAmount: number;
  totalDeductions: number;
  status: string;
  paymentDate: string | null;
  referenceId: string | null;
  createdAt: string;
};

export type PayslipResponse = {
  payments: Payslip[];
  ytd: { gross: number; deductions: number; net: number };
};

const downloadPdf = async (paymentId: string, isRetry = false): Promise<string> => {
  const token = await secureStorage.getAccessToken();
  const url = `${apiClient.defaults.baseURL}/salary/me/payslips/${paymentId}/pdf`;
  const target = `${CACHE_DIR}payslip-${paymentId}.pdf`;
  const result = await FileSystem.downloadAsync(url, target, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (result.status === 401 && !isRetry) {
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken) {
        const { data } = await apiClient.post('/auth/refresh', { refreshToken });
        await secureStorage.setTokens(data.accessToken, data.refreshToken);
        return downloadPdf(paymentId, true);
      }
    } catch (error) {
      console.error('Payslip auto-refresh failed:', error);
    }
  }

  if (result.status !== 200) {
    throw new Error(`Payslip download failed (${result.status})`);
  }

  if (Platform.OS === 'android') {
    try {
      return await FileSystem.getContentUriAsync(result.uri);
    } catch (error) {
      console.error('Could not create a shareable payslip URI:', error);
    }
  }

  return result.uri;
};

export const salaryApi = {
  listMine: async (): Promise<PayslipResponse> => {
    const res = await apiClient.get('/salary/me/payslips');
    return res.data;
  },
  downloadPayslip: (paymentId: string) => downloadPdf(paymentId),
};
