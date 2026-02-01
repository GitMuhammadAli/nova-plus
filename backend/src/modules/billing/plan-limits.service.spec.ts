import { Test, TestingModule } from '@nestjs/testing';
import { PlanLimitsService } from './plan-limits.service';
import { getModelToken } from '@nestjs/mongoose';
import { Subscription } from './entities/billing.entity';
import { User } from '../user/entities/user.entity';
import { Department } from '../department/entities/department.entity';
import { Project } from '../project/entities/project.entity';
import { Workflow } from '../workflow/entities/workflow.entity';
import { Upload } from '../uploads/entities/upload.entity';
import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('PlanLimitsService', () => {
  let service: PlanLimitsService;
  let subscriptionModel: any;
  let userModel: any;
  let departmentModel: any;
  let projectModel: any;
  let workflowModel: any;
  let uploadModel: any;

  const mockCompanyId = new Types.ObjectId().toString();

  beforeEach(async () => {
    const mockSubscriptionModel = {
      findOne: jest.fn(),
    };

    const mockUserModel = {
      countDocuments: jest.fn(),
      find: jest.fn(),
    };

    const mockDepartmentModel = {
      countDocuments: jest.fn(),
    };

    const mockProjectModel = {
      countDocuments: jest.fn(),
    };

    const mockWorkflowModel = {
      countDocuments: jest.fn(),
    };

    const mockUploadModel = {
      aggregate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanLimitsService,
        {
          provide: getModelToken(Subscription.name),
          useValue: mockSubscriptionModel,
        },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        {
          provide: getModelToken(Department.name),
          useValue: mockDepartmentModel,
        },
        { provide: getModelToken(Project.name), useValue: mockProjectModel },
        { provide: getModelToken(Workflow.name), useValue: mockWorkflowModel },
        { provide: getModelToken(Upload.name), useValue: mockUploadModel },
      ],
    }).compile();

    service = module.get<PlanLimitsService>(PlanLimitsService);
    subscriptionModel = module.get(getModelToken(Subscription.name));
    userModel = module.get(getModelToken(User.name));
    departmentModel = module.get(getModelToken(Department.name));
    projectModel = module.get(getModelToken(Project.name));
    workflowModel = module.get(getModelToken(Workflow.name));
    uploadModel = module.get(getModelToken(Upload.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCompanyPlan', () => {
    it('should return free plan when no subscription exists', async () => {
      subscriptionModel.findOne.mockResolvedValue(null);

      const result = await service.getCompanyPlan(mockCompanyId);

      expect(result).toBe('free');
    });

    it('should return subscription plan name when subscription exists', async () => {
      subscriptionModel.findOne.mockResolvedValue({
        planName: 'pro',
        status: 'active',
      });

      const result = await service.getCompanyPlan(mockCompanyId);

      expect(result).toBe('pro');
    });

    it('should extract plan from planId if planName not available', async () => {
      subscriptionModel.findOne.mockResolvedValue({
        planId: 'price_starter_monthly_123',
        status: 'active',
      });

      const result = await service.getCompanyPlan(mockCompanyId);

      expect(result).toBe('starter');
    });
  });

  describe('getPlanLimits', () => {
    it('should return free plan limits for free tier', async () => {
      subscriptionModel.findOne.mockResolvedValue(null);

      const limits = await service.getPlanLimits(mockCompanyId);

      expect(limits.maxUsers).toBe(5);
      expect(limits.maxDepartments).toBe(2);
      expect(limits.maxProjects).toBe(5);
      expect(limits.features.analytics).toBe(false);
    });

    it('should return pro plan limits for pro tier', async () => {
      subscriptionModel.findOne.mockResolvedValue({
        planName: 'pro',
        status: 'active',
      });

      const limits = await service.getPlanLimits(mockCompanyId);

      expect(limits.maxUsers).toBe(100);
      expect(limits.maxDepartments).toBe(50);
      expect(limits.features.analytics).toBe(true);
      expect(limits.features.advancedReports).toBe(true);
    });

    it('should return unlimited (-1) for enterprise tier', async () => {
      subscriptionModel.findOne.mockResolvedValue({
        planName: 'enterprise',
        status: 'active',
      });

      const limits = await service.getPlanLimits(mockCompanyId);

      expect(limits.maxUsers).toBe(-1);
      expect(limits.maxDepartments).toBe(-1);
      expect(limits.features.sso).toBe(true);
    });
  });

  describe('getUsageStats', () => {
    it('should calculate usage statistics correctly', async () => {
      subscriptionModel.findOne.mockResolvedValue(null);
      userModel.countDocuments.mockResolvedValue(3);
      userModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([{ _id: '1' }, { _id: '2' }]),
      });
      departmentModel.countDocuments.mockResolvedValue(1);
      projectModel.countDocuments.mockResolvedValue(2);
      workflowModel.countDocuments.mockResolvedValue(1);
      uploadModel.aggregate.mockResolvedValue([
        { totalBytes: 512 * 1024 * 1024 },
      ]); // 0.5 GB

      const usage = await service.getUsageStats(mockCompanyId);

      expect(usage.users.current).toBe(3);
      expect(usage.users.max).toBe(5);
      expect(usage.users.percentage).toBe(60);
      expect(usage.departments.current).toBe(1);
      expect(usage.storage.currentGB).toBe(0.5);
    });

    it('should calculate 0% for unlimited resources', async () => {
      subscriptionModel.findOne.mockResolvedValue({
        planName: 'enterprise',
        status: 'active',
      });
      userModel.countDocuments.mockResolvedValue(50);
      userModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });
      departmentModel.countDocuments.mockResolvedValue(20);
      projectModel.countDocuments.mockResolvedValue(30);
      workflowModel.countDocuments.mockResolvedValue(10);
      uploadModel.aggregate.mockResolvedValue([
        { totalBytes: 50 * 1024 * 1024 * 1024 },
      ]);

      const usage = await service.getUsageStats(mockCompanyId);

      expect(usage.users.percentage).toBe(0);
      expect(usage.departments.percentage).toBe(0);
    });
  });

  describe('canCreateUser', () => {
    it('should return true when under limit', async () => {
      subscriptionModel.findOne.mockResolvedValue(null);
      userModel.countDocuments.mockResolvedValue(3);

      const result = await service.canCreateUser(mockCompanyId);

      expect(result).toBe(true);
    });

    it('should return false when at limit', async () => {
      subscriptionModel.findOne.mockResolvedValue(null);
      userModel.countDocuments.mockResolvedValue(5);

      const result = await service.canCreateUser(mockCompanyId);

      expect(result).toBe(false);
    });

    it('should return true for unlimited plan', async () => {
      subscriptionModel.findOne.mockResolvedValue({
        planName: 'enterprise',
        status: 'active',
      });

      const result = await service.canCreateUser(mockCompanyId);

      expect(result).toBe(true);
    });
  });

  describe('enforceUserLimit', () => {
    it('should not throw when under limit', async () => {
      subscriptionModel.findOne.mockResolvedValue(null);
      userModel.countDocuments.mockResolvedValue(3);

      await expect(
        service.enforceUserLimit(mockCompanyId),
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenException when at limit', async () => {
      subscriptionModel.findOne.mockResolvedValue(null);
      userModel.countDocuments.mockResolvedValue(5);

      await expect(service.enforceUserLimit(mockCompanyId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('canUploadStorage', () => {
    it('should return true when under storage limit', async () => {
      subscriptionModel.findOne.mockResolvedValue(null);
      uploadModel.aggregate.mockResolvedValue([
        { totalBytes: 500 * 1024 * 1024 },
      ]); // 0.5 GB

      const result = await service.canUploadStorage(
        mockCompanyId,
        100 * 1024 * 1024,
      ); // 100 MB

      expect(result).toBe(true);
    });

    it('should return false when would exceed storage limit', async () => {
      subscriptionModel.findOne.mockResolvedValue(null);
      uploadModel.aggregate.mockResolvedValue([
        { totalBytes: 900 * 1024 * 1024 },
      ]); // 0.9 GB

      const result = await service.canUploadStorage(
        mockCompanyId,
        200 * 1024 * 1024,
      ); // 200 MB

      expect(result).toBe(false);
    });
  });

  describe('hasFeature', () => {
    it('should return false for analytics on free plan', async () => {
      subscriptionModel.findOne.mockResolvedValue(null);

      const result = await service.hasFeature(mockCompanyId, 'analytics');

      expect(result).toBe(false);
    });

    it('should return true for analytics on pro plan', async () => {
      subscriptionModel.findOne.mockResolvedValue({
        planName: 'pro',
        status: 'active',
      });

      const result = await service.hasFeature(mockCompanyId, 'analytics');

      expect(result).toBe(true);
    });

    it('should return true for SSO on enterprise plan', async () => {
      subscriptionModel.findOne.mockResolvedValue({
        planName: 'enterprise',
        status: 'active',
      });

      const result = await service.hasFeature(mockCompanyId, 'sso');

      expect(result).toBe(true);
    });
  });

  describe('enforceFeature', () => {
    it('should not throw when feature is available', async () => {
      subscriptionModel.findOne.mockResolvedValue({
        planName: 'pro',
        status: 'active',
      });

      await expect(
        service.enforceFeature(mockCompanyId, 'analytics'),
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenException when feature is not available', async () => {
      subscriptionModel.findOne.mockResolvedValue(null);

      await expect(
        service.enforceFeature(mockCompanyId, 'analytics'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getPlanInfo', () => {
    it('should return complete plan info with usage stats', async () => {
      subscriptionModel.findOne.mockResolvedValue({
        planName: 'starter',
        status: 'active',
      });
      userModel.countDocuments.mockResolvedValue(10);
      userModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });
      departmentModel.countDocuments.mockResolvedValue(5);
      projectModel.countDocuments.mockResolvedValue(10);
      workflowModel.countDocuments.mockResolvedValue(5);
      uploadModel.aggregate.mockResolvedValue([
        { totalBytes: 2 * 1024 * 1024 * 1024 },
      ]);

      const planInfo = await service.getPlanInfo(mockCompanyId);

      expect(planInfo.planName).toBe('starter');
      expect(planInfo.limits).toBeDefined();
      expect(planInfo.usage).toBeDefined();
      expect(planInfo.features).toBeDefined();
      expect(planInfo.limits.maxUsers).toBe(25);
      expect(planInfo.usage.users.current).toBe(10);
    });
  });
});
