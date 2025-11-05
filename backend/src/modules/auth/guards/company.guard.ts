import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * CompanyGuard ensures data isolation by companyId
 * Verifies that the user can only access data from their own company
 */
@Injectable()
export class CompanyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Super admins can access any company
    if (user.role === 'super_admin' || user.role === 'superadmin') {
      return true;
    }

    // Get companyId from request params, body, or query
    const companyId = request.params?.companyId || 
                      request.body?.companyId || 
                      request.query?.companyId;

    // If no companyId in request, check if user has one
    if (!companyId) {
      // Allow if user has a companyId (they're accessing their own data)
      if (user.companyId || user.orgId) {
        return true;
      }
      throw new ForbiddenException('Company context required');
    }

    // Verify user's companyId matches requested companyId
    const userCompanyId = user.companyId?.toString() || user.orgId?.toString();
    if (userCompanyId !== companyId.toString()) {
      throw new ForbiddenException('Access denied: You can only access data from your own company');
    }

    return true;
  }
}

