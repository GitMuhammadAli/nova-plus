import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './task.service';
import { getModelToken } from '@nestjs/mongoose';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { Project } from '../project/entities/project.entity';
import { Company } from '../company/entities/company.entity';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let taskModel: any;
  let userModel: any;
  let projectModel: any;

  const mockCompanyId = 'company123';
  const mockUserId = 'user123';
  const mockAssigneeId = 'user456';
  const mockProjectId = 'project123';

  const mockManagerUser = {
    _id: mockUserId,
    email: 'manager@test.com',
    name: 'Manager',
    role: UserRole.MANAGER,
    companyId: mockCompanyId,
  };

  const mockRegularUser = {
    _id: mockUserId,
    email: 'user@test.com',
    name: 'User',
    role: UserRole.USER,
    companyId: mockCompanyId,
  };

  const mockAssignee = {
    _id: mockAssigneeId,
    email: 'assignee@test.com',
    name: 'Assignee',
    companyId: mockCompanyId,
  };

  const mockProject = {
    _id: mockProjectId,
    name: 'Test Project',
    companyId: mockCompanyId,
  };

  const mockTask = {
    _id: 'task123',
    title: 'Test Task',
    description: 'Test description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    companyId: mockCompanyId,
    assignedBy: mockUserId,
    assignedTo: mockAssigneeId,
    projectId: mockProjectId,
    isActive: true,
  };

  beforeEach(async () => {
    const mockTaskModelFactory = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ ...mockTask, ...data }),
    }));
    Object.assign(mockTaskModelFactory, {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getModelToken(Task.name),
          useValue: mockTaskModelFactory,
        },
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getModelToken(Project.name),
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: getModelToken(Company.name),
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskModel = module.get(getModelToken(Task.name));
    userModel = module.get(getModelToken(User.name));
    projectModel = module.get(getModelToken(Project.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      title: 'New Task',
      description: 'Task description',
      assignedTo: 'user456',
      projectId: 'project123',
      priority: TaskPriority.HIGH,
    };

    it('should throw ForbiddenException if regular user tries to create', async () => {
      await expect(
        service.create(createDto as any, mockRegularUser as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if user has no companyId', async () => {
      const noCompanyUser = { ...mockManagerUser, companyId: null };
      await expect(
        service.create(createDto as any, noCompanyUser as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if assigned user not found', async () => {
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.create(createDto as any, mockManagerUser as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if assignee is from different company', async () => {
      userModel.findById.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ ...mockAssignee, companyId: 'otherCompany' }),
      });

      await expect(
        service.create(createDto as any, mockManagerUser as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if project not found', async () => {
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAssignee),
      });
      projectModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.create(createDto as any, mockManagerUser as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create task when valid manager and data', async () => {
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAssignee),
      });
      projectModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProject),
      });

      const result = await service.create(
        createDto as any,
        mockManagerUser as any,
      );

      expect(result).toBeDefined();
      expect(result.title).toBe(createDto.title);
    });
  });

  describe('findByCompany', () => {
    it('should query tasks with company filter', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockTask]),
      };
      taskModel.find.mockReturnValue(mockQuery);
      taskModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findByCompany(mockCompanyId, {});

      expect(taskModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: mockCompanyId,
          isActive: true,
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('findMyTasks', () => {
    it('should return tasks assigned to user', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockTask]),
      };
      taskModel.find.mockReturnValue(mockQuery);

      const result = await service.findMyTasks(mockUserId);

      expect(taskModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedTo: mockUserId,
          isActive: true,
        }),
      );
      expect(result).toEqual([mockTask]);
    });
  });
});
