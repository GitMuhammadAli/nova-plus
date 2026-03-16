import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { getModelToken } from '@nestjs/mongoose';
import { Project, ProjectStatus } from './entities/project.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { Company } from '../company/entities/company.entity';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('ProjectService', () => {
  let service: ProjectService;
  let projectModel: any;
  let userModel: any;
  let companyModel: any;

  const mockCompanyId = 'company123';
  const mockUserId = 'user123';

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
    name: 'Regular User',
    role: UserRole.USER,
    companyId: mockCompanyId,
  };

  const mockCompany = {
    _id: mockCompanyId,
    name: 'Test Company',
  };

  const mockProject = {
    _id: 'project123',
    name: 'Test Project',
    description: 'A test project',
    status: ProjectStatus.ACTIVE,
    companyId: mockCompanyId,
    createdBy: mockUserId,
    assignedUsers: [],
    isActive: true,
  };

  beforeEach(async () => {
    const mockProjectModelFactory = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ ...mockProject, ...data }),
    }));
    Object.assign(mockProjectModelFactory, {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getModelToken(Project.name),
          useValue: mockProjectModelFactory,
        },
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn(),
            find: jest.fn(),
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

    service = module.get<ProjectService>(ProjectService);
    projectModel = module.get(getModelToken(Project.name));
    userModel = module.get(getModelToken(User.name));
    companyModel = module.get(getModelToken(Company.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'New Project',
      description: 'Project description',
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

    it('should throw NotFoundException if company not found', async () => {
      companyModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.create(createDto as any, mockManagerUser as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create project for manager with valid company', async () => {
      companyModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCompany),
      });

      const result = await service.create(
        createDto as any,
        mockManagerUser as any,
      );

      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
    });
  });

  describe('findByCompany', () => {
    it('should return projects for a company', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockProject]),
      };
      projectModel.find.mockReturnValue(mockQuery);
      projectModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findByCompany(mockCompanyId, {});

      expect(projectModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: mockCompanyId,
          isActive: true,
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProject),
      };
      projectModel.findById.mockReturnValue(mockQuery);

      const result = await service.findOne('project123');

      expect(projectModel.findById).toHaveBeenCalledWith('project123');
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      projectModel.findById.mockReturnValue(mockQuery);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
