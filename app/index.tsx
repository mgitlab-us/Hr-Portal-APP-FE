import { Redirect } from 'expo-router';
import { useAuthStore } from '@/features/auth/store';

export default function Index() {
  const { isAuthenticated, employee } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (
    employee?.role === 'ADMIN' ||
    employee?.role === 'SUPER_ADMIN' ||
    employee?.role === 'MANAGER'
  ) {
    return <Redirect href="/(admin)/" />;
  }

  return <Redirect href="/(employee)/" />;
}
