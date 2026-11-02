export interface Employee {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN';
  mustChangePassword: boolean;
  employeeCode?: string;
  designation?: string;
  department?: string;
  departmentId?: string | null;
  adminDepartmentIds?: string[];
  managerDepartmentIds?: string[];
  permissions?: {
    companyWide: boolean;
    readAllEmployees: boolean;
    manageCompany: boolean;
    manageAllDepartments: boolean;
    canManageEmployees: boolean;
    canManagePayroll: boolean;
    canApproveManager: boolean;
    canApproveHr: boolean;
    canViewAuditLogs: boolean;
  };
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
