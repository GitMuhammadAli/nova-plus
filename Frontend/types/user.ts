// Shared User type definition
export interface User {
  _id: string;
  email: string;
  name?: string;
  role: string;
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

