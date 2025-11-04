"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export function RoleGuard({ children, allowedRoles, redirectTo = '/unauthorized' }: RoleGuardProps) {
  const router = useRouter();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isLoading && user) {
      const userRole = user.role?.toLowerCase();
      const hasAccess = allowedRoles.some(role => role.toLowerCase() === userRole);
      
      if (!hasAccess) {
        router.replace(redirectTo);
      }
    }
  }, [user, isLoading, allowedRoles, router, redirectTo]);

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
  const hasAccess = allowedRoles.some(role => role.toLowerCase() === userRole);

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}

