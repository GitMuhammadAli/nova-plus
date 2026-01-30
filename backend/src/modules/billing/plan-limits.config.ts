/**
 * Plan Limits Configuration
 * Defines resource limits for each subscription plan
 */

export interface PlanLimits {
  maxUsers: number;
  maxDepartments: number;
  maxProjects: number;
  maxStorageGB: number;
  maxTeams: number;
  maxWorkflows: number;
  features: {
    analytics: boolean;
    advancedReports: boolean;
    apiAccess: boolean;
    webhooks: boolean;
    customBranding: boolean;
    sso: boolean;
    auditLogs: boolean;
    prioritySupport: boolean;
  };
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxUsers: 5,
    maxDepartments: 2,
    maxProjects: 5,
    maxStorageGB: 1,
    maxTeams: 2,
    maxWorkflows: 3,
    features: {
      analytics: false,
      advancedReports: false,
      apiAccess: false,
      webhooks: false,
      customBranding: false,
      sso: false,
      auditLogs: false,
      prioritySupport: false,
    },
  },
  starter: {
    maxUsers: 25,
    maxDepartments: 10,
    maxProjects: 25,
    maxStorageGB: 10,
    maxTeams: 10,
    maxWorkflows: 20,
    features: {
      analytics: true,
      advancedReports: false,
      apiAccess: true,
      webhooks: true,
      customBranding: false,
      sso: false,
      auditLogs: true,
      prioritySupport: false,
    },
  },
  pro: {
    maxUsers: 100,
    maxDepartments: 50,
    maxProjects: 100,
    maxStorageGB: 100,
    maxTeams: 50,
    maxWorkflows: 100,
    features: {
      analytics: true,
      advancedReports: true,
      apiAccess: true,
      webhooks: true,
      customBranding: true,
      sso: false,
      auditLogs: true,
      prioritySupport: true,
    },
  },
  enterprise: {
    maxUsers: -1, // Unlimited
    maxDepartments: -1,
    maxProjects: -1,
    maxStorageGB: -1,
    maxTeams: -1,
    maxWorkflows: -1,
    features: {
      analytics: true,
      advancedReports: true,
      apiAccess: true,
      webhooks: true,
      customBranding: true,
      sso: true,
      auditLogs: true,
      prioritySupport: true,
    },
  },
};

export type PlanName = keyof typeof PLAN_LIMITS;

export function getPlanLimits(planName: string): PlanLimits {
  const plan = PLAN_LIMITS[planName.toLowerCase()];
  return plan || PLAN_LIMITS.free;
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}

