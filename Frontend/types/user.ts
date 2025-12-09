export enum UserRole {
  SUPER_ADMIN = "super_admin",
  COMPANY_ADMIN = "company_admin",
  MANAGER = "manager",
  USER = "user",
}

// Shared User type definition
export interface User {
  _id: string;
  email: string;
  name?: string;
  role: UserRole | string;
  companyId?: string;
  orgId?: string;
  createdBy?: string;
  managerId?: any;
  department?: string;
  location?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type Role = UserRole | string;
