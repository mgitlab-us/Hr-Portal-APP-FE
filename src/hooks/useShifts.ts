import { useState, useCallback, useEffect } from 'react';
import { shiftsApi, ShiftProfile } from '@/features/shifts/api';
import { Alert } from 'react-native';

export function useShifts() {
  const [shifts, setShifts] = useState<ShiftProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchShifts = useCallback(async () => {
    try {
      const { data } = await shiftsApi.getCompanyShifts();
      setShifts(data);
    } catch (e) {
      console.error('Fetch shifts error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchShifts();
  }, [fetchShifts]);

  const createShift = async (data: any) => {
    try {
      const resp = await shiftsApi.createShift(data);
      setShifts(prev => [...prev, resp.data]);
      return resp.data;
    } catch (e) {
      Alert.alert('Error', 'Failed to create shift profile');
      throw e;
    }
  };

  const updateShift = async (id: string, data: any) => {
    try {
      const resp = await shiftsApi.updateShift(id, data);
      setShifts(prev => prev.map(s => s.id === id ? resp.data : s));
      return resp.data;
    } catch (e) {
      Alert.alert('Error', 'Failed to update shift profile');
      throw e;
    }
  };

  const deleteShift = async (id: string) => {
    try {
      await shiftsApi.deleteShift(id);
      setShifts(prev => prev.filter(s => s.id !== id));
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to delete shift profile';
      Alert.alert('Error', msg);
      throw e;
    }
  };

  return {
    shifts,
    loading,
    refreshing,
    onRefresh,
    createShift,
    updateShift,
    deleteShift,
  };
}
