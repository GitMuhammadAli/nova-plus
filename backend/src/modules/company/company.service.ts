import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { Company, CompanyDocument } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { User, UserRole } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name)
    private companyModel: Model<CompanyDocument>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * Public company registration - creates company + admin user (CEO)
   */
  async register(registerCompanyDto: RegisterCompanyDto) {
    // Check if company name already exists
    const existing = await this.companyModel.findOne({ name: registerCompanyDto.companyName }).exec();
    if (existing) {
      throw new BadRequestException('Company name already exists');
    }

    // Check if domain is provided and unique
    if (registerCompanyDto.domain) {
      const existingDomain = await this.companyModel.findOne({ domain: registerCompanyDto.domain }).exec();
      if (existingDomain) {
        throw new BadRequestException('Company domain already exists');
      }
    }

    // Check if admin email already exists
    const existingUser = await this.userModel.findOne({ email: registerCompanyDto.email }).exec();
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Create company
    const company = new this.companyModel({
      name: registerCompanyDto.companyName,
      domain: registerCompanyDto.domain,
      description: registerCompanyDto.description,
      logoUrl: registerCompanyDto.logoUrl,
      createdBy: null,
      managers: [],
      users: [],
      isActive: true,
    });

    const savedCompany = await company.save();

    // Create company admin user
    const hashedPassword = await bcrypt.hash(registerCompanyDto.password, 10);
    const adminName = registerCompanyDto.adminName || registerCompanyDto.email.split('@')[0];

    const companyAdmin = await this.userModel.create({
      email: registerCompanyDto.email,
      password: hashedPassword,
      name: adminName,
      role: UserRole.COMPANY_ADMIN,
      companyId: savedCompany._id.toString(),
      orgId: savedCompany._id.toString(),
      createdBy: null,
      isActive: true,
    });

    // Update company with admin
    savedCompany.managers.push(companyAdmin._id as any);
    savedCompany.users.push(companyAdmin._id as any);
    await savedCompany.save();

    // Generate JWT tokens
    const userId = companyAdmin._id?.toString() || companyAdmin._id;
    const payload = {
      sub: userId,
      email: companyAdmin.email,
      role: companyAdmin.role,
      companyId: savedCompany._id.toString(),
      orgId: savedCompany._id.toString(),
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const companyObj: any = savedCompany.toObject();
    const adminObj: any = companyAdmin.toObject();
    delete adminObj.password;

    return {
      company: {
        _id: companyObj._id,
        name: companyObj.name,
        domain: companyObj.domain,
        description: companyObj.description,
        logoUrl: companyObj.logoUrl,
        createdBy: companyObj.createdBy,
        isActive: companyObj.isActive,
        createdAt: companyObj.createdAt,
        updatedAt: companyObj.updatedAt,
      },
      admin: {
        _id: adminObj._id,
        email: adminObj.email,
        name: adminObj.name,
        role: adminObj.role,
        companyId: adminObj.companyId,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Create company with company admin (Super Admin only)
   */
  async create(createCompanyDto: CreateCompanyDto, createdBy: string) {
    // Check if company name already exists
    const existing = await this.companyModel.findOne({ name: createCompanyDto.name }).exec();
    if (existing) {
      throw new BadRequestException('Company name already exists');
    }

    // Check if domain is provided and unique
    if (createCompanyDto.domain) {
      const existingDomain = await this.companyModel.findOne({ domain: createCompanyDto.domain }).exec();
      if (existingDomain) {
        throw new BadRequestException('Company domain already exists');
      }
    }

    // Check if admin email already exists
    const existingUser = await this.userModel.findOne({ email: createCompanyDto.companyAdminEmail }).exec();
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Create company
    const company = new this.companyModel({
      name: createCompanyDto.name,
      domain: createCompanyDto.domain,
      description: createCompanyDto.description,
      logoUrl: createCompanyDto.logoUrl,
      createdBy,
      managers: [],
      users: [],
      isActive: true,
    });

    const savedCompany = await company.save();

    // Create company admin user
    const hashedPassword = await bcrypt.hash(createCompanyDto.companyAdminPassword, 10);
    const companyAdmin = await this.userModel.create({
      email: createCompanyDto.companyAdminEmail,
      password: hashedPassword,
      name: createCompanyDto.companyAdminName,
      role: UserRole.COMPANY_ADMIN,
      companyId: savedCompany._id.toString(),
      orgId: savedCompany._id.toString(),
      createdBy,
      isActive: true,
    });

    // Update company
    savedCompany.managers.push(companyAdmin._id as any);
    savedCompany.users.push(companyAdmin._id as any);
    await savedCompany.save();

    const companyObj: any = savedCompany.toObject();
    const adminObj: any = companyAdmin.toObject();
    delete adminObj.password;

    return {
      company: companyObj,
      admin: adminObj,
    };
  }

  /**
   * Find all companies (Super Admin only)
   */
  async findAll() {
    return this.companyModel.find({ isActive: true }).exec();
  }

  /**
   * Find company by ID with authorization check
   */
  async findById(companyId: string, requestUserId: string, requestUserRole: string) {
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔵 Company Service - findById:', {
        companyId,
        requestUserId,
        requestUserRole,
      });
    }

    const company = await this.companyModel.findById(companyId).exec();
    
    if (!company) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Company not found:', companyId);
      }
      throw new NotFoundException('Company not found');
    }

    // Super Admin can access any company
    if (requestUserRole === UserRole.SUPER_ADMIN) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Super Admin access granted');
      }
      return company;
    }

    // Get requesting user to check company membership
    const requestingUser = await this.userModel.findById(requestUserId).exec();
    if (!requestingUser) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Requesting user not found:', requestUserId);
      }
      throw new ForbiddenException('User not found');
    }

    // Convert companyId to string for comparison
    const userCompanyId = requestingUser.companyId?.toString();
    const targetCompanyId = company._id?.toString();

    if (process.env.NODE_ENV === 'development') {
      console.log('🔵 Company access check:', {
        userCompanyId,
        targetCompanyId,
        match: userCompanyId === targetCompanyId,
      });
    }

    // User must belong to the company they're trying to access
    if (userCompanyId !== targetCompanyId) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Company access denied:', {
          userCompanyId,
          targetCompanyId,
        });
      }
      throw new ForbiddenException('You can only access your own company');
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Company access granted');
    }

    return company;
  }

  /**
   * Update company
   */
  async update(companyId: string, updateData: Partial<CreateCompanyDto>, requestUserId: string, requestUserRole: string) {
    const company = await this.findById(companyId, requestUserId, requestUserRole);
    
    if (updateData.name) {
      const existing = await this.companyModel.findOne({ 
        name: updateData.name, 
        _id: { $ne: companyId } 
      }).exec();
      if (existing) {
        throw new BadRequestException('Company name already exists');
      }
    }

    if (updateData.domain) {
      const existing = await this.companyModel.findOne({ 
        domain: updateData.domain, 
        _id: { $ne: companyId } 
      }).exec();
      if (existing) {
        throw new BadRequestException('Company domain already exists');
      }
    }

    Object.assign(company, updateData);
    return company.save();
  }

  /**
   * Get company users
   */
  async getCompanyUsers(companyId: string, requestUserId: string, requestUserRole: string, params?: { page?: number; limit?: number; search?: string }) {
    // Verify user has access to this company
    await this.findById(companyId, requestUserId, requestUserRole);

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const query: any = { 
      companyId: companyId,
    };

    if (params?.search) {
      query.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { email: { $regex: params.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel.find(query).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return {
      data: users.map(user => {
        const userObj: any = user.toObject();
        delete userObj.password;
        return userObj;
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(companyId: string, requestUserId: string, requestUserRole: string) {
    // Verify user has access to this company
    await this.findById(companyId, requestUserId, requestUserRole);

    const [totalUsers, activeUsers, totalManagers, pendingInvites] = await Promise.all([
      this.userModel.countDocuments({ companyId }).exec(),
      this.userModel.countDocuments({ companyId, isActive: true }).exec(),
      this.userModel.countDocuments({ companyId, role: UserRole.MANAGER }).exec(),
      // Get pending invites count (would need invite service)
      0, // Placeholder - implement with invite service
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalManagers,
      pendingInvites,
    };
  }

  /**
   * Get company activity (last 30 actions)
   */
  async getCompanyActivity(companyId: string, requestUserId: string, requestUserRole: string) {
    // Verify user has access to this company
    await this.findById(companyId, requestUserId, requestUserRole);

    // For now, return empty array - would need AuditLog or Activity service
    // This should be implemented with AuditService injection
    return [];
  }

  /**
   * Get company profile with details
   */
  async getCompanyProfile(companyId: string, requestUserId: string, requestUserRole: string) {
    // Verify user has access to this company
    const company = await this.findById(companyId, requestUserId, requestUserRole);

    // Get additional details
    const [totalUsers, totalManagers, totalProjects] = await Promise.all([
      this.userModel.countDocuments({ companyId }).exec(),
      this.userModel.countDocuments({ companyId, role: UserRole.MANAGER }).exec(),
      // Would need Project model
      0,
    ]);

    // Convert to plain object to access timestamps
    const companyObj = company.toObject ? company.toObject() : company as any;

    return {
      company: {
        _id: company._id,
        name: company.name,
        domain: company.domain,
        isActive: company.isActive,
        createdAt: companyObj.createdAt,
        updatedAt: companyObj.updatedAt,
      },
      stats: {
        totalUsers,
        totalManagers,
        totalProjects,
      },
    };
  }
}
