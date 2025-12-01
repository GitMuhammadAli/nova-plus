/**
 * Role-Based Access Control Configuration
 * Defines permissions and access levels for all user roles
 */

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  COMPANY_ADMIN = 'company_admin',
  MANAGER = 'manager',
  USER = 'user',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  // Legacy roles
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

export type RolePermission = {
  // Pages access
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  
  canViewManagers: boolean;
  canCreateManagers: boolean;
  canEditManagers: boolean;
  canDeleteManagers: boolean;
  
  canViewProjects: boolean;
  canCreateProjects: boolean;
  canEditProjects: boolean;
  canDeleteProjects: boolean;
  
  canViewTasks: boolean;
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canViewAllTasks: boolean; // See tasks assigned to others
  
  canViewDepartments: boolean;
  canCreateDepartments: boolean;
  canEditDepartments: boolean;
  canDeleteDepartments: boolean;
  
  canViewTeams: boolean;
  canCreateTeams: boolean;
  canEditTeams: boolean;
  canDeleteTeams: boolean;
  
  canViewInvites: boolean;
  canCreateInvites: boolean;
  canRevokeInvites: boolean;
  
  canViewAnalytics: boolean;
  canViewReports: boolean;
  canViewSettings: boolean;
  canEditSettings: boolean;
  
  canViewBilling: boolean;
  canManageBilling: boolean;
  
  canViewAuditLogs: boolean;
  
  // Data scope
  canViewAllCompanyData: boolean; // See all company data
  canViewTeamData: boolean; // See only team data
  canViewOwnData: boolean; // See only own data
};

const rolePermissions: Record<string, RolePermission> = {
  // SUPER_ADMIN - Full access to everything
  [UserRole.SUPER_ADMIN]: {
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewManagers: true,
    canCreateManagers: true,
    canEditManagers: true,
    canDeleteManagers: true,
    canViewProjects: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    canViewTasks: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canViewAllTasks: true,
    canViewDepartments: true,
    canCreateDepartments: true,
    canEditDepartments: true,
    canDeleteDepartments: true,
    canViewTeams: true,
    canCreateTeams: true,
    canEditTeams: true,
    canDeleteTeams: true,
    canViewInvites: true,
    canCreateInvites: true,
    canRevokeInvites: true,
    canViewAnalytics: true,
    canViewReports: true,
    canViewSettings: true,
    canEditSettings: true,
    canViewBilling: true,
    canManageBilling: true,
    canViewAuditLogs: true,
    canViewAllCompanyData: true,
    canViewTeamData: true,
    canViewOwnData: true,
  },

  // COMPANY_ADMIN - Full access to company
  [UserRole.COMPANY_ADMIN]: {
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewManagers: true,
    canCreateManagers: true,
    canEditManagers: true,
    canDeleteManagers: true,
    canViewProjects: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    canViewTasks: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canViewAllTasks: true,
    canViewDepartments: true,
    canCreateDepartments: true,
    canEditDepartments: true,
    canDeleteDepartments: true,
    canViewTeams: true,
    canCreateTeams: true,
    canEditTeams: true,
    canDeleteTeams: true,
    canViewInvites: true,
    canCreateInvites: true,
    canRevokeInvites: true,
    canViewAnalytics: true,
    canViewReports: true,
    canViewSettings: true,
    canEditSettings: true,
    canViewBilling: true,
    canManageBilling: true,
    canViewAuditLogs: true,
    canViewAllCompanyData: true,
    canViewTeamData: true,
    canViewOwnData: true,
  },

  // MANAGER - Can manage team and create projects/tasks
  [UserRole.MANAGER]: {
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: false, // Can only edit their team members
    canDeleteUsers: false,
    canViewManagers: false,
    canCreateManagers: false,
    canEditManagers: false,
    canDeleteManagers: false,
    canViewProjects: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    canViewTasks: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canViewAllTasks: true, // Can see all tasks in company
    canViewDepartments: true,
    canCreateDepartments: false,
    canEditDepartments: false,
    canDeleteDepartments: false,
    canViewTeams: true,
    canCreateTeams: true,
    canEditTeams: true,
    canDeleteTeams: false,
    canViewInvites: true,
    canCreateInvites: true,
    canRevokeInvites: false,
    canViewAnalytics: true,
    canViewReports: true,
    canViewSettings: false,
    canEditSettings: false,
    canViewBilling: false,
    canManageBilling: false,
    canViewAuditLogs: false,
    canViewAllCompanyData: false,
    canViewTeamData: true,
    canViewOwnData: true,
  },

  // USER - Can only view and update own tasks
  [UserRole.USER]: {
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewManagers: false,
    canCreateManagers: false,
    canEditManagers: false,
    canDeleteManagers: false,
    canViewProjects: true,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewTasks: true,
    canCreateTasks: false,
    canEditTasks: true, // Can update own task status
    canDeleteTasks: false,
    canViewAllTasks: false, // Only see own tasks
    canViewDepartments: true,
    canCreateDepartments: false,
    canEditDepartments: false,
    canDeleteDepartments: false,
    canViewTeams: true,
    canCreateTeams: false,
    canEditTeams: false,
    canDeleteTeams: false,
    canViewInvites: false,
    canCreateInvites: false,
    canRevokeInvites: false,
    canViewAnalytics: false,
    canViewReports: false,
    canViewSettings: false,
    canEditSettings: false,
    canViewBilling: false,
    canManageBilling: false,
    canViewAuditLogs: false,
    canViewAllCompanyData: false,
    canViewTeamData: false,
    canViewOwnData: true,
  },

  // EDITOR - Similar to USER but can edit content
  [UserRole.EDITOR]: {
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewManagers: false,
    canCreateManagers: false,
    canEditManagers: false,
    canDeleteManagers: false,
    canViewProjects: true,
    canCreateProjects: false,
    canEditProjects: true, // Can edit project content
    canDeleteProjects: false,
    canViewTasks: true,
    canCreateTasks: false,
    canEditTasks: true,
    canDeleteTasks: false,
    canViewAllTasks: false,
    canViewDepartments: true,
    canCreateDepartments: false,
    canEditDepartments: false,
    canDeleteDepartments: false,
    canViewTeams: true,
    canCreateTeams: false,
    canEditTeams: false,
    canDeleteTeams: false,
    canViewInvites: false,
    canCreateInvites: false,
    canRevokeInvites: false,
    canViewAnalytics: false,
    canViewReports: false,
    canViewSettings: false,
    canEditSettings: false,
    canViewBilling: false,
    canManageBilling: false,
    canViewAuditLogs: false,
    canViewAllCompanyData: false,
    canViewTeamData: false,
    canViewOwnData: true,
  },

  // VIEWER - Read-only access
  [UserRole.VIEWER]: {
    canViewUsers: true,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewManagers: true,
    canCreateManagers: false,
    canEditManagers: false,
    canDeleteManagers: false,
    canViewProjects: true,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewTasks: true,
    canCreateTasks: false,
    canEditTasks: false,
    canDeleteTasks: false,
    canViewAllTasks: true,
    canViewDepartments: true,
    canCreateDepartments: false,
    canEditDepartments: false,
    canDeleteDepartments: false,
    canViewTeams: true,
    canCreateTeams: false,
    canEditTeams: false,
    canDeleteTeams: false,
    canViewInvites: true,
    canCreateInvites: false,
    canRevokeInvites: false,
    canViewAnalytics: true,
    canViewReports: true,
    canViewSettings: true,
    canEditSettings: false,
    canViewBilling: false,
    canManageBilling: false,
    canViewAuditLogs: false,
    canViewAllCompanyData: true,
    canViewTeamData: true,
    canViewOwnData: true,
  },

  // Legacy ADMIN role - maps to COMPANY_ADMIN
  [UserRole.ADMIN]: {
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewManagers: true,
    canCreateManagers: true,
    canEditManagers: true,
    canDeleteManagers: true,
    canViewProjects: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    canViewTasks: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canViewAllTasks: true,
    canViewDepartments: true,
    canCreateDepartments: true,
    canEditDepartments: true,
    canDeleteDepartments: true,
    canViewTeams: true,
    canCreateTeams: true,
    canEditTeams: true,
    canDeleteTeams: true,
    canViewInvites: true,
    canCreateInvites: true,
    canRevokeInvites: true,
    canViewAnalytics: true,
    canViewReports: true,
    canViewSettings: true,
    canEditSettings: true,
    canViewBilling: true,
    canManageBilling: true,
    canViewAuditLogs: true,
    canViewAllCompanyData: true,
    canViewTeamData: true,
    canViewOwnData: true,
  },
};

/**
 * Normalize role name (handle aliases and legacy roles)
 */
export function normalizeRole(role: string | undefined): string {
  if (!role) return UserRole.USER;
  const normalized = role.toLowerCase();
  
  const roleMap: Record<string, string> = {
    'admin': UserRole.COMPANY_ADMIN,
    'superadmin': UserRole.SUPER_ADMIN,
    'company_admin': UserRole.COMPANY_ADMIN,
    'super_admin': UserRole.SUPER_ADMIN,
  };
  
  return roleMap[normalized] || normalized;
}

/**
 * Get permissions for a user role
 */
export function getRolePermissions(role: string | undefined): RolePermission {
  const normalized = normalizeRole(role);
  return rolePermissions[normalized] || rolePermissions[UserRole.USER];
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  role: string | undefined,
  permission: keyof RolePermission
): boolean {
  const permissions = getRolePermissions(role);
  return permissions[permission] || false;
}

/**
 * Get allowed roles for a page/feature
 */
export function getAllowedRoles(permission: keyof RolePermission): string[] {
  const roles: string[] = [];
  Object.entries(rolePermissions).forEach(([role, perms]) => {
    if (perms[permission]) {
      roles.push(role);
    }
  });
  return roles;
}

/**
 * Check if role can access a page
 */
export function canAccessPage(role: string | undefined, page: string): boolean {
  const permissions = getRolePermissions(role);
  
  const pagePermissionMap: Record<string, keyof RolePermission> = {
    '/users': 'canViewUsers',
    '/managers': 'canViewManagers',
    '/projects': 'canViewProjects',
    '/tasks': 'canViewTasks',
    '/departments': 'canViewDepartments',
    '/teams': 'canViewTeams',
    '/invites': 'canViewInvites',
    '/analytics': 'canViewAnalytics',
    '/reports': 'canViewReports',
    '/settings': 'canViewSettings',
    '/billing': 'canViewBilling',
    '/audit-logs': 'canViewAuditLogs',
  };
  
  const permission = pagePermissionMap[page];
  if (!permission) return true; // Allow access if page not in map
  
  return permissions[permission] || false;
}

