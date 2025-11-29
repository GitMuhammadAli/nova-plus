export enum UserRole {
  SUPER_ADMIN = "super_admin",
  COMPANY_ADMIN = "company_admin",
  MANAGER = "manager",
  USER = "user",
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole | string;
  companyId?: string;
  orgId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Role = UserRole | string;

