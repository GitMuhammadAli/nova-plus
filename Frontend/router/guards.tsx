"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserStore } from '@/zustand-stores/userStore';
import { UserRole } from '@/types/user';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function RouteGuard({ children, allowedRoles, redirectTo = '/unauthorized' }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useUserStore();

  useEffect(() => {
    if (isLoading) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      if (!pathname.includes('/login') && !pathname.includes('/register')) {
        router.push('/login');
      }
      return;
    }

    // Check role authorization
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = user.role as UserRole;
      const hasAccess = allowedRoles.includes(userRole);

      if (!hasAccess) {
        router.push(redirectTo);
      }
    }
  }, [user, isAuthenticated, isLoading, allowedRoles, router, pathname, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role as UserRole;
    const hasAccess = allowedRoles.includes(userRole);

    if (!hasAccess) {
      return null;
    }
  }

  return <>{children}</>;
}

