import { useUserStore } from '@/zustand-stores/userStore';
import { UserRole } from '@/types/user';

export function useRole() {
  const { user, hasRole } = useUserStore();

  const isAdmin = hasRole([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN]);
  const isManager = hasRole(UserRole.MANAGER);
  const isUser = hasRole(UserRole.USER);
  const isSuperAdmin = hasRole(UserRole.SUPER_ADMIN);

  return {
    user,
    role: user?.role as UserRole,
    isAdmin,
    isManager,
    isUser,
    isSuperAdmin,
    hasRole,
  };
}

