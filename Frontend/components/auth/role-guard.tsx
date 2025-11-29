"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import { UserRole } from '@/types/user';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  allowedRoles?: UserRole[]; // For backward compatibility
  redirectTo?: string;
}

export function RoleGuard({ 
  children, 
  requiredRoles, 
  allowedRoles,
  redirectTo = '/unauthorized' 
}: RoleGuardProps) {
  const router = useRouter();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  // Support both requiredRoles and allowedRoles (for backward compatibility)
  const roles = requiredRoles || allowedRoles || [];

  useEffect(() => {
    if (!isLoading && user) {
      const userRole = user.role?.toLowerCase();
      const hasAccess = roles.some(role => {
        const roleStr = typeof role === 'string' ? role.toLowerCase() : role.toLowerCase();
        return roleStr === userRole;
      });
      
      if (!hasAccess) {
        router.replace(redirectTo);
      }
    }
  }, [user, isLoading, roles, router, redirectTo]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const userRole = user.role?.toLowerCase();
  const hasAccess = roles.some(role => {
    const roleStr = typeof role === 'string' ? role.toLowerCase() : role.toLowerCase();
    return roleStr === userRole;
  });

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}

