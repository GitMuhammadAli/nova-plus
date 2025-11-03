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

    // Check if user's role matches any of the required roles
    const userRole = user.role?.toLowerCase();
    const hasRequiredRole = requiredRoles.some(
      (role) => role?.toLowerCase() === userRole
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(`Access denied: requires one of [${requiredRoles.join(', ')}] role(s)`);
    }
    return true;
  }
}
