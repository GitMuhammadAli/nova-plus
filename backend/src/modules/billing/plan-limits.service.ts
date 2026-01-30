import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from './entities/billing.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { Department, DepartmentDocument } from '../department/entities/department.entity';
import { Project, ProjectDocument } from '../project/entities/project.entity';
// Note: Team entity doesn't have companyId directly, so we track via manager's company
import { Workflow, WorkflowDocument } from '../workflow/entities/workflow.entity';
import { Upload, UploadDocument } from '../uploads/entities/upload.entity';
import { getPlanLimits, PlanLimits, isUnlimited } from './plan-limits.config';

export interface UsageStats {
  users: { current: number; max: number; percentage: number };
  departments: { current: number; max: number; percentage: number };
  projects: { current: number; max: number; percentage: number };
  storage: { currentGB: number; maxGB: number; percentage: number };
  teams: { current: number; max: number; percentage: number };
  workflows: { current: number; max: number; percentage: number };
}

export interface PlanInfo {
  planName: string;
  limits: PlanLimits;
  usage: UsageStats;
  features: PlanLimits['features'];
}

@Injectable()
export class PlanLimitsService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    // Team model removed - teams are counted differently
    @InjectModel(Workflow.name) private workflowModel: Model<WorkflowDocument>,
    @InjectModel(Upload.name) private uploadModel: Model<UploadDocument>,
  ) {}

  /**
   * Get the current plan for a company
   */
  async getCompanyPlan(companyId: string): Promise<string> {
    const subscription = await this.subscriptionModel.findOne({
      companyId: new Types.ObjectId(companyId),
      status: { $in: ['active', 'trialing'] },
    });

    if (!subscription) {
      return 'free';
    }

    // Extract plan name from planId or planName
    const planName = subscription.planName?.toLowerCase() || 
                     this.extractPlanFromId(subscription.planId);
    
    return planName || 'free';
  }

  /**
   * Extract plan name from Stripe price ID
   */
  private extractPlanFromId(planId: string): string {
    if (planId.includes('starter')) return 'starter';
    if (planId.includes('pro')) return 'pro';
    if (planId.includes('enterprise')) return 'enterprise';
    return 'free';
  }

  /**
   * Get plan limits for a company
   */
  async getPlanLimits(companyId: string): Promise<PlanLimits> {
    const planName = await this.getCompanyPlan(companyId);
    return getPlanLimits(planName);
  }

  /**
   * Get full plan info including usage stats
   */
  async getPlanInfo(companyId: string): Promise<PlanInfo> {
    const planName = await this.getCompanyPlan(companyId);
    const limits = getPlanLimits(planName);
    const usage = await this.getUsageStats(companyId, limits);

    return {
      planName,
      limits,
      usage,
      features: limits.features,
    };
  }

  /**
   * Get current usage statistics for a company
   */
  async getUsageStats(companyId: string, limits?: PlanLimits): Promise<UsageStats> {
    if (!limits) {
      limits = await this.getPlanLimits(companyId);
    }

    const companyObjectId = new Types.ObjectId(companyId);

    // Count resources in parallel
    const [userCount, departmentCount, projectCount, workflowCount, storageBytes] = await Promise.all([
      this.userModel.countDocuments({ companyId: companyObjectId, isActive: true }),
      this.departmentModel.countDocuments({ companyId: companyObjectId, isActive: true }),
      this.projectModel.countDocuments({ companyId: companyObjectId, isActive: true }),
      this.workflowModel.countDocuments({ companyId: companyObjectId }),
      this.calculateStorageUsage(companyId),
    ]);

    // Count teams via managers that belong to this company
    const companyManagers = await this.userModel.find({ 
      companyId: companyObjectId, 
      role: { $in: ['manager', 'company_admin'] },
      isActive: true 
    }).select('_id');
    const managerIds = companyManagers.map(m => m._id);
    // For now, estimate teams based on departments (1 team per department is a reasonable approximation)
    const teamCount = departmentCount;

    const storageGB = Math.round((storageBytes / (1024 * 1024 * 1024)) * 100) / 100;

    return {
      users: {
        current: userCount,
        max: limits.maxUsers,
        percentage: isUnlimited(limits.maxUsers) ? 0 : Math.round((userCount / limits.maxUsers) * 100),
      },
      departments: {
        current: departmentCount,
        max: limits.maxDepartments,
        percentage: isUnlimited(limits.maxDepartments) ? 0 : Math.round((departmentCount / limits.maxDepartments) * 100),
      },
      projects: {
        current: projectCount,
        max: limits.maxProjects,
        percentage: isUnlimited(limits.maxProjects) ? 0 : Math.round((projectCount / limits.maxProjects) * 100),
      },
      storage: {
        currentGB: storageGB,
        maxGB: limits.maxStorageGB,
        percentage: isUnlimited(limits.maxStorageGB) ? 0 : Math.round((storageGB / limits.maxStorageGB) * 100),
      },
      teams: {
        current: teamCount,
        max: limits.maxTeams,
        percentage: isUnlimited(limits.maxTeams) ? 0 : Math.round((teamCount / limits.maxTeams) * 100),
      },
      workflows: {
        current: workflowCount,
        max: limits.maxWorkflows,
        percentage: isUnlimited(limits.maxWorkflows) ? 0 : Math.round((workflowCount / limits.maxWorkflows) * 100),
      },
    };
  }

  /**
   * Calculate total storage usage for a company
   */
  private async calculateStorageUsage(companyId: string): Promise<number> {
    const result = await this.uploadModel.aggregate([
      { $match: { companyId: new Types.ObjectId(companyId) } },
      { $group: { _id: null, totalBytes: { $sum: '$size' } } },
    ]);

    return result[0]?.totalBytes || 0;
  }

  /**
   * Check if a company can create a new user
   */
  async canCreateUser(companyId: string): Promise<boolean> {
    const limits = await this.getPlanLimits(companyId);
    if (isUnlimited(limits.maxUsers)) return true;

    const currentCount = await this.userModel.countDocuments({
      companyId: new Types.ObjectId(companyId),
      isActive: true,
    });

    return currentCount < limits.maxUsers;
  }

  /**
   * Check if a company can create a new department
   */
  async canCreateDepartment(companyId: string): Promise<boolean> {
    const limits = await this.getPlanLimits(companyId);
    if (isUnlimited(limits.maxDepartments)) return true;

    const currentCount = await this.departmentModel.countDocuments({
      companyId: new Types.ObjectId(companyId),
      isActive: true,
    });

    return currentCount < limits.maxDepartments;
  }

  /**
   * Check if a company can create a new project
   */
  async canCreateProject(companyId: string): Promise<boolean> {
    const limits = await this.getPlanLimits(companyId);
    if (isUnlimited(limits.maxProjects)) return true;

    const currentCount = await this.projectModel.countDocuments({
      companyId: new Types.ObjectId(companyId),
      isActive: true,
    });

    return currentCount < limits.maxProjects;
  }

  /**
   * Check if a company can create a new team
   * Note: Teams are estimated via departments since Team entity doesn't have companyId
   */
  async canCreateTeam(companyId: string): Promise<boolean> {
    const limits = await this.getPlanLimits(companyId);
    if (isUnlimited(limits.maxTeams)) return true;

    // Estimate team count via departments
    const currentCount = await this.departmentModel.countDocuments({
      companyId: new Types.ObjectId(companyId),
      isActive: true,
    });

    return currentCount < limits.maxTeams;
  }

  /**
   * Check if a company can create a new workflow
   */
  async canCreateWorkflow(companyId: string): Promise<boolean> {
    const limits = await this.getPlanLimits(companyId);
    if (isUnlimited(limits.maxWorkflows)) return true;

    const currentCount = await this.workflowModel.countDocuments({
      companyId: new Types.ObjectId(companyId),
    });

    return currentCount < limits.maxWorkflows;
  }

  /**
   * Check if a company can upload more storage
   */
  async canUploadStorage(companyId: string, additionalBytes: number): Promise<boolean> {
    const limits = await this.getPlanLimits(companyId);
    if (isUnlimited(limits.maxStorageGB)) return true;

    const currentBytes = await this.calculateStorageUsage(companyId);
    const maxBytes = limits.maxStorageGB * 1024 * 1024 * 1024;

    return (currentBytes + additionalBytes) <= maxBytes;
  }

  /**
   * Check if a feature is enabled for a company's plan
   */
  async hasFeature(companyId: string, featureName: keyof PlanLimits['features']): Promise<boolean> {
    const limits = await this.getPlanLimits(companyId);
    return limits.features[featureName] || false;
  }

  /**
   * Enforce user limit - throws if limit exceeded
   */
  async enforceUserLimit(companyId: string): Promise<void> {
    if (!(await this.canCreateUser(companyId))) {
      const limits = await this.getPlanLimits(companyId);
      throw new ForbiddenException(
        `User limit reached (${limits.maxUsers}). Please upgrade your plan to add more users.`
      );
    }
  }

  /**
   * Enforce department limit - throws if limit exceeded
   */
  async enforceDepartmentLimit(companyId: string): Promise<void> {
    if (!(await this.canCreateDepartment(companyId))) {
      const limits = await this.getPlanLimits(companyId);
      throw new ForbiddenException(
        `Department limit reached (${limits.maxDepartments}). Please upgrade your plan to add more departments.`
      );
    }
  }

  /**
   * Enforce project limit - throws if limit exceeded
   */
  async enforceProjectLimit(companyId: string): Promise<void> {
    if (!(await this.canCreateProject(companyId))) {
      const limits = await this.getPlanLimits(companyId);
      throw new ForbiddenException(
        `Project limit reached (${limits.maxProjects}). Please upgrade your plan to add more projects.`
      );
    }
  }

  /**
   * Enforce team limit - throws if limit exceeded
   */
  async enforceTeamLimit(companyId: string): Promise<void> {
    if (!(await this.canCreateTeam(companyId))) {
      const limits = await this.getPlanLimits(companyId);
      throw new ForbiddenException(
        `Team limit reached (${limits.maxTeams}). Please upgrade your plan to add more teams.`
      );
    }
  }

  /**
   * Enforce workflow limit - throws if limit exceeded
   */
  async enforceWorkflowLimit(companyId: string): Promise<void> {
    if (!(await this.canCreateWorkflow(companyId))) {
      const limits = await this.getPlanLimits(companyId);
      throw new ForbiddenException(
        `Workflow limit reached (${limits.maxWorkflows}). Please upgrade your plan to add more workflows.`
      );
    }
  }

  /**
   * Enforce storage limit - throws if limit exceeded
   */
  async enforceStorageLimit(companyId: string, fileSize: number): Promise<void> {
    if (!(await this.canUploadStorage(companyId, fileSize))) {
      const limits = await this.getPlanLimits(companyId);
      throw new ForbiddenException(
        `Storage limit reached (${limits.maxStorageGB}GB). Please upgrade your plan for more storage.`
      );
    }
  }

  /**
   * Enforce feature access - throws if feature not available
   */
  async enforceFeature(companyId: string, featureName: keyof PlanLimits['features']): Promise<void> {
    if (!(await this.hasFeature(companyId, featureName))) {
      throw new ForbiddenException(
        `The ${featureName} feature is not available on your current plan. Please upgrade to access this feature.`
      );
    }
  }
}

