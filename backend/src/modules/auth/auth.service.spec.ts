import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../user/entities/user.entity';
import { Session } from './entities/session.entity';
import { MfaService } from './mfa.service';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let sessionModel: any;
  let jwtService: JwtService;
  let mfaService: MfaService;

  const mockUser = {
    _id: 'user123',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    role: 'user',
    companyId: 'company123',
    mfa: { enabled: false },
  };

  const mockSession = {
    _id: 'session123',
    userId: 'user123',
    refreshTokenHash: 'hashedToken',
  };

  beforeEach(async () => {
    const mockUserModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };

    const mockSessionModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      deleteMany: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mockToken'),
      verify: jest.fn(),
    };

    const mockMfaService = {
      verifyMfaToken: jest.fn(),
      generateMfaSecret: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Session.name), useValue: mockSessionModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MfaService, useValue: mockMfaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
    sessionModel = module.get(getModelToken(Session.name));
    jwtService = module.get<JwtService>(JwtService);
    mfaService = module.get<MfaService>(MfaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockResolvedValue(mockUser);
      sessionModel.create.mockResolvedValue(mockSession);

      const dto = {
        email: 'new@example.com',
        password: 'Password123!',
        name: 'New User',
      };

      const result = await service.register(dto);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: dto.email });
      expect(userModel.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw ForbiddenException if email already exists', async () => {
      userModel.findOne.mockResolvedValue(mockUser);

      const dto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      await expect(service.register(dto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      sessionModel.create.mockResolvedValue(mockSession);

      const dto = {
        email: 'test@example.com',
        password: 'correctPassword',
      };

      const result = await service.login(dto, 'user-agent', '127.0.0.1');

      expect(userModel.findOne).toHaveBeenCalledWith({ email: dto.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, mockUser.password);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      userModel.findOne.mockResolvedValue(null);

      const dto = {
        email: 'nonexistent@example.com',
        password: 'anyPassword',
      };

      await expect(service.login(dto, 'user-agent', '127.0.0.1'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const dto = {
        email: 'test@example.com',
        password: 'wrongPassword',
      };

      await expect(service.login(dto, 'user-agent', '127.0.0.1'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should require MFA token when MFA is enabled', async () => {
      const userWithMfa = {
        ...mockUser,
        mfa: { enabled: true, secret: 'mfaSecret' },
      };
      userModel.findOne.mockResolvedValue(userWithMfa);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const dto = {
        email: 'test@example.com',
        password: 'correctPassword',
      };

      const result = await service.login(dto, 'user-agent', '127.0.0.1');

      expect(result).toHaveProperty('requiresMfa', true);
      expect(result).toHaveProperty('userId');
      expect(result).not.toHaveProperty('accessToken');
    });

    it('should validate MFA token when provided', async () => {
      const userWithMfa = {
        ...mockUser,
        mfa: { enabled: true, secret: 'mfaSecret' },
      };
      userModel.findOne.mockResolvedValue(userWithMfa);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mfaService.verifyMfaToken as jest.Mock).mockResolvedValue(true);
      sessionModel.create.mockResolvedValue(mockSession);

      const dto = {
        email: 'test@example.com',
        password: 'correctPassword',
        mfaToken: '123456',
      };

      const result = await service.login(dto, 'user-agent', '127.0.0.1');

      expect(mfaService.verifyMfaToken).toHaveBeenCalledWith(mockUser._id.toString(), '123456');
      expect(result).toHaveProperty('accessToken');
    });

    it('should throw UnauthorizedException for invalid MFA token', async () => {
      const userWithMfa = {
        ...mockUser,
        mfa: { enabled: true, secret: 'mfaSecret' },
      };
      userModel.findOne.mockResolvedValue(userWithMfa);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mfaService.verifyMfaToken as jest.Mock).mockResolvedValue(false);

      const dto = {
        email: 'test@example.com',
        password: 'correctPassword',
        mfaToken: 'invalidToken',
      };

      await expect(service.login(dto, 'user-agent', '127.0.0.1'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('buildResponseTokens', () => {
    it('should generate access and refresh tokens', async () => {
      sessionModel.create.mockResolvedValue(mockSession);

      const result = await service.buildResponseTokens(mockUser, 'user-agent', '127.0.0.1');

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('email', mockUser.email);
    });

    it('should include companyId in token payload', async () => {
      sessionModel.create.mockResolvedValue(mockSession);

      await service.buildResponseTokens(mockUser, 'user-agent', '127.0.0.1');

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser._id.toString(),
          email: mockUser.email,
          role: mockUser.role,
          companyId: mockUser.companyId,
        }),
        expect.any(Object),
      );
    });
  });
});
