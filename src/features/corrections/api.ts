import { apiClient } from '@/lib/axios';

export const correctionApi = {
  async request(data: { recordId: string, requestedCheckin?: string, requestedCheckout?: string, reason: string }) {
    const response = await apiClient.post('/corrections/request', data);
    return response.data;
  },

  async getMyRequests() {
    const response = await apiClient.get('/corrections/my-requests');
    return response.data;
  },

  async getPending() {
    const response = await apiClient.get('/corrections/pending');
    return response.data;
  },

  async review(id: string, data: { status: 'APPROVED' | 'REJECTED', reviewNote?: string }) {
    const response = await apiClient.patch(`/corrections/${id}/review`, data);
    return response.data;
  }
};
