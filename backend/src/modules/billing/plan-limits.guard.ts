import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlanLimitsService } from './plan-limits.service';
import { PlanLimits } from './plan-limits.config';

// Metadata keys
export const REQUIRE_FEATURE = 'requireFeature';
export const REQUIRE_LIMIT_CHECK = 'requireLimitCheck';

// Type for limit checks
export type LimitCheckType = 'user' | 'department' | 'project' | 'team' | 'workflow';

// Decorators
export const RequireFeature = (featureName: keyof PlanLimits['features']) =>
  SetMetadata(REQUIRE_FEATURE, featureName);

export const RequireLimitCheck = (limitType: LimitCheckType) =>
  SetMetadata(REQUIRE_LIMIT_CHECK, limitType);

/**
 * Guard that checks if a feature is enabled for the company's plan
 */
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private planLimitsService: PlanLimitsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureName = this.reflector.get<keyof PlanLimits['features']>(
      REQUIRE_FEATURE,
      context.getHandler(),
    );

    // If no feature requirement, allow access
    if (!featureName) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const companyId = this.getCompanyId(request);

    if (!companyId) {
      throw new ForbiddenException('Company context required');
    }

    const hasFeature = await this.planLimitsService.hasFeature(companyId, featureName);

    if (!hasFeature) {
      throw new ForbiddenException(
        `The ${featureName} feature is not available on your current plan. Please upgrade to access this feature.`
      );
    }

    return true;
  }

  private getCompanyId(request: any): string | null {
    // Try to get companyId from user object (set by JWT auth)
    if (request.user?.companyId) {
      return request.user.companyId.toString();
    }
    // Try to get from params
    if (request.params?.companyId) {
      return request.params.companyId;
    }
    // Try to get from body
    if (request.body?.companyId) {
      return request.body.companyId;
    }
    return null;
  }
}

/**
 * Guard that checks if a resource limit has been reached
 */
@Injectable()
export class LimitCheckGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private planLimitsService: PlanLimitsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitType = this.reflector.get<LimitCheckType>(
      REQUIRE_LIMIT_CHECK,
      context.getHandler(),
    );

    // If no limit check required, allow access
    if (!limitType) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const companyId = this.getCompanyId(request);

    if (!companyId) {
      throw new ForbiddenException('Company context required');
    }

    // Check the appropriate limit based on type
    switch (limitType) {
      case 'user':
        await this.planLimitsService.enforceUserLimit(companyId);
        break;
      case 'department':
        await this.planLimitsService.enforceDepartmentLimit(companyId);
        break;
      case 'project':
        await this.planLimitsService.enforceProjectLimit(companyId);
        break;
      case 'team':
        await this.planLimitsService.enforceTeamLimit(companyId);
        break;
      case 'workflow':
        await this.planLimitsService.enforceWorkflowLimit(companyId);
        break;
    }

    return true;
  }

  private getCompanyId(request: any): string | null {
    if (request.user?.companyId) {
      return request.user.companyId.toString();
    }
    if (request.params?.companyId) {
      return request.params.companyId;
    }
    if (request.body?.companyId) {
      return request.body.companyId;
    }
    return null;
  }
}

