import { useState, useCallback, useEffect } from 'react';
import { employeeApi } from '../features/employees/api';
import { useAuthStore } from '../features/auth/store';
import { Alert } from 'react-native';

export const useEmployees = () => {
  const currentEmployee = useAuthStore((s) => s.employee);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await employeeApi.list();
      setEmployees(data);
    } catch (e) {
      console.error(e);
      setError('Could not load technical team directory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization
  const { useSocket } = require('./useSocket');
  useSocket('staff:updated', () => {
    console.log('Real-time staff update received');
    loadData();
  });

  const filteredEmployees = employees.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name?.toLowerCase().includes(q) ||
      item.email?.toLowerCase().includes(q) ||
      item.profile?.department?.toLowerCase().includes(q) ||
      item.profile?.designation?.toLowerCase().includes(q) ||
      item.profile?.employeeCode?.toLowerCase().includes(q)
    );
  });

  const handleDeactivate = (item: any) => {
    Alert.alert(
      'Remove Member?',
      `This will deactivate ${item.name} and revoke system access.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await employeeApi.deactivate(item.id);
              await loadData();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || 'Failed to remove employee.');
            }
          },
        },
      ]
    );
  };

  return {
    employees,
    filteredEmployees,
    loading,
    error,
    query,
    setQuery,
    loadData,
    handleDeactivate,
    currentEmployee
  };
};
