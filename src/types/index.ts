export interface Employee {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: 'EMPLOYEE' | 'ADMIN' | 'SUPER_ADMIN';
  mustChangePassword: boolean;
  employeeCode?: string;
  designation?: string;
  department?: string;
  company?: {
    name: string;
    timezone: string;
  };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  oldPassword?: string;
  newPassword: string;
}
