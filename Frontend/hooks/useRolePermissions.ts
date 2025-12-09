import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import { getRolePermissions, hasPermission, normalizeRole, type RolePermission } from '@/lib/roles-config';

/**
 * Hook to get role-based permissions for the current user
 */
export function useRolePermissions() {
  const { user } = useSelector((state: RootState) => state.auth);
  const userRole = user?.role || '';
  const normalizedRole = normalizeRole(userRole);
  const permissions = getRolePermissions(userRole);

  return {
    user,
    userRole: normalizedRole,
    permissions,
    hasPermission: (permission: keyof RolePermission) => hasPermission(userRole, permission),
    isAdmin: normalizedRole === 'company_admin' || normalizedRole === 'super_admin' || normalizedRole === 'admin',
    isManager: normalizedRole === 'manager',
    isUser: normalizedRole === 'user',
    isEditor: normalizedRole === 'editor',
    isViewer: normalizedRole === 'viewer',
  };
}

