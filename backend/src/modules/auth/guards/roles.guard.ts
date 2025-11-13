import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Normalize user role - handle various formats
    const userRole = this.normalizeRole(user.role);
    
    // Normalize required roles and check if user's role matches any
    const normalizedRequiredRoles = requiredRoles.map(role => this.normalizeRole(role));
    const hasRequiredRole = normalizedRequiredRoles.some(
      (role) => role === userRole
    );

    // Debug logging in development
    if (process.env.NODE_ENV === 'development' && !hasRequiredRole) {
      console.log('🚫 RolesGuard - Access Denied:', {
        userRole: user.role,
        normalizedUserRole: userRole,
        requiredRoles: requiredRoles,
        normalizedRequiredRoles: normalizedRequiredRoles,
        userId: user._id || user.id,
        email: user.email,
      });
    }

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access denied: requires one of [${requiredRoles.join(', ')}] role(s), but user has role: ${user.role || 'unknown'}`
      );
    }
    return true;
  }

  /**
   * Normalize role to handle various formats:
   * - 'COMPANY_ADMIN' -> 'company_admin'
   * - 'company_admin' -> 'company_admin'
   * - 'Company_Admin' -> 'company_admin'
   * - Also handle legacy roles: 'admin' -> 'company_admin' (for backward compatibility)
   */
  private normalizeRole(role: string | undefined): string {
    if (!role) return '';
    
    const normalized = role.toLowerCase().trim();
    
    // Handle legacy role mappings for backward compatibility
    if (normalized === 'admin' && role !== 'super_admin' && role !== 'superadmin') {
      return 'company_admin';
    }
    
    return normalized;
  }
}
