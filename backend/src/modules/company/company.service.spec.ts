import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from './company.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Company } from './entities/company.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}));

describe('CompanyService', () => {
  let service: CompanyService;
  let companyModel: any;
  let userModel: any;
  let jwtService: JwtService;
  let auditService: AuditService;

  const mockCompanyId = new Types.ObjectId();
  const mockUserId = new Types.ObjectId();

  const mockCompany = {
    _id: mockCompanyId,
    name: 'Test Company',
    domain: 'testcompany.com',
    description: 'A test company',
    managers: [],
    users: [],
    isActive: true,
    save: jest.fn().mockImplementation(function () {
      return this;
    }),
    toObject: jest.fn().mockImplementation(function () {
      return { ...this };
    }),
  };

  const mockUser = {
    _id: mockUserId,
    email: 'admin@testcompany.com',
    password: 'hashedPassword',
    name: 'Admin User',
    role: UserRole.COMPANY_ADMIN,
    companyId: mockCompanyId,
    isActive: true,
    toObject: jest.fn().mockImplementation(function () {
      const obj = { ...this };
      delete obj.password;
      return obj;
    }),
  };

  beforeEach(async () => {
    const mockCompanyModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    // Make the model constructor callable
    const CompanyModelMock = function (data: any) {
      return {
        ...mockCompany,
        ...data,
        save: jest.fn().mockResolvedValue({ ...mockCompany, ...data }),
        toObject: jest.fn().mockReturnValue({ ...mockCompany, ...data }),
      };
    };
    Object.assign(CompanyModelMock, mockCompanyModel);

    const mockUserModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      countDocuments: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mockToken'),
    };

    const mockAuditService = {
      log: jest.fn(),
      createLog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        { provide: getModelToken(Company.name), useValue: CompanyModelMock },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    companyModel = module.get(getModelToken(Company.name));
    userModel = module.get(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      companyName: 'New Company',
      domain: 'newcompany.com',
      adminName: 'Admin',
      email: 'admin@newcompany.com',
      password: 'Password123!',
    };

    it('should register a new company with admin user', async () => {
      companyModel.findOne = jest
        .fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) }) // company name check
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) }); // domain check
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }); // email check
      userModel.create.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('company');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw BadRequestException if company name exists', async () => {
      companyModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCompany),
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if email already registered', async () => {
      companyModel.findOne = jest
        .fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a company by ID', async () => {
      companyModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCompany),
      });

      const result = await service.findOne(mockCompanyId.toString());

      expect(result).toEqual(mockCompany);
      expect(companyModel.findById).toHaveBeenCalledWith(
        mockCompanyId.toString(),
      );
    });

    it('should throw NotFoundException if company not found', async () => {
      companyModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('nonexistentId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCompanyUsers', () => {
    it('should return users for a company', async () => {
      const mockUsers = [mockUser, { ...mockUser, _id: new Types.ObjectId() }];
      userModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUsers),
      });
      userModel.countDocuments.mockResolvedValue(2);

      const result = await service.getCompanyUsers(mockCompanyId.toString());

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('total');
      expect(result.users.length).toBe(2);
      expect(userModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: mockCompanyId.toString() }),
      );
    });

    it('should paginate results correctly', async () => {
      userModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockUser]),
      });
      userModel.countDocuments.mockResolvedValue(25);

      const result = await service.getCompanyUsers(
        mockCompanyId.toString(),
        2,
        10,
      );

      expect(userModel.find().skip).toHaveBeenCalledWith(10);
      expect(userModel.find().limit).toHaveBeenCalledWith(10);
    });
  });

  describe('getCompanyStats', () => {
    it('should return company statistics', async () => {
      companyModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCompany),
      });
      userModel.countDocuments.mockResolvedValue(10);
      userModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getCompanyStats(mockCompanyId.toString());

      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('companyName');
    });
  });

  describe('Multi-tenancy isolation', () => {
    it('should only return users belonging to the company', async () => {
      const companyAId = new Types.ObjectId().toString();
      const companyBId = new Types.ObjectId().toString();

      userModel.find.mockImplementation((query: any) => ({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockResolvedValue(
            query.companyId === companyAId
              ? [{ ...mockUser, companyId: companyAId }]
              : [{ ...mockUser, companyId: companyBId }],
          ),
      }));
      userModel.countDocuments.mockResolvedValue(1);

      const resultA = await service.getCompanyUsers(companyAId);
      const resultB = await service.getCompanyUsers(companyBId);

      // Verify queries filter by companyId
      expect(userModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: companyAId }),
      );
      expect(userModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: companyBId }),
      );

      // Verify results are from different companies
      expect(resultA.users[0].companyId).toBe(companyAId);
      expect(resultB.users[0].companyId).toBe(companyBId);
    });

    it('should not allow updating company you do not own', async () => {
      const differentCompanyId = new Types.ObjectId().toString();
      companyModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Attempting to get stats for non-existent company should throw
      await expect(service.getCompanyStats(differentCompanyId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update company details', async () => {
      const updateDto = { name: 'Updated Company Name' };
      companyModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockCompany, ...updateDto }),
      });

      const result = await service.update(
        mockCompanyId.toString(),
        updateDto,
        mockUserId.toString(),
      );

      expect(result.name).toBe('Updated Company Name');
      expect(companyModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockCompanyId.toString(),
        expect.any(Object),
        { new: true },
      );
    });

    it('should throw NotFoundException for non-existent company', async () => {
      companyModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update(
          'nonexistentId',
          { name: 'New Name' },
          mockUserId.toString(),
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
