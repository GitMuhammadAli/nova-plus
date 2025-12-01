import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { serverAPI } from './server-api';

/**
 * Get the current authenticated user on the server
 */
export async function getServerUser() {
  try {
    const user = await serverAPI.getCurrentUser();
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth() {
  const user = await getServerUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

/**
 * Check if user has required role
 */
export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  const userRole = (user.role || '').toLowerCase();
  const normalizedRoles = allowedRoles.map(r => r.toLowerCase());
  
  // Handle role aliases
  const roleMap: Record<string, string> = {
    'admin': 'company_admin',
    'superadmin': 'super_admin',
  };
  
  const normalizedUserRole = roleMap[userRole] || userRole;
  const normalizedAllowedRoles = normalizedRoles.map(r => roleMap[r] || r);
  
  if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
    redirect('/dashboard');
  }
  
  return user;
}

