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
   * This is the public endpoint for companies to register themselves
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

    // Create company (no createdBy since it's public registration)
    const company = new this.companyModel({
      name: registerCompanyDto.companyName,
      domain: registerCompanyDto.domain,
      createdBy: null, // Public registration - no super admin created it
      managers: [],
      users: [],
      isActive: true,
    });

    const savedCompany = await company.save();

    // Create company admin user (CEO)
    const hashedPassword = await bcrypt.hash(registerCompanyDto.password, 10);

    const companyAdmin = await this.userModel.create({
      email: registerCompanyDto.email,
      password: hashedPassword,
      name: registerCompanyDto.adminName,
      role: UserRole.COMPANY_ADMIN,
      companyId: savedCompany._id.toString(),
      orgId: savedCompany._id.toString(), // Keep orgId for backward compatibility
      createdBy: null, // Self-registered
      isActive: true,
    });

    // Update company with company admin
    savedCompany.managers.push(companyAdmin._id as any);
    savedCompany.users.push(companyAdmin._id as any);
    await savedCompany.save();

    // Generate JWT tokens for the new admin
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

    // Check if company admin email already exists
    const existingUser = await this.userModel.findOne({ email: createCompanyDto.companyAdminEmail }).exec();
    if (existingUser) {
      throw new BadRequestException('Company admin email already exists');
    }

    // Create company
    const company = new this.companyModel({
      name: createCompanyDto.name,
      domain: createCompanyDto.domain,
      createdBy: createdBy,
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
      orgId: savedCompany._id.toString(), // Keep orgId for backward compatibility
      createdBy: createdBy,
      isActive: true,
    });

    // Update company with company admin
    savedCompany.managers.push(companyAdmin._id as any);
    savedCompany.users.push(companyAdmin._id as any);
    await savedCompany.save();

    const companyObj: any = savedCompany.toObject();
    return {
      company: {
        _id: companyObj._id,
        name: companyObj.name,
        domain: companyObj.domain,
        createdBy: companyObj.createdBy,
        isActive: companyObj.isActive,
        createdAt: companyObj.createdAt,
        updatedAt: companyObj.updatedAt,
      },
      companyAdmin: {
        _id: companyAdmin._id,
        email: companyAdmin.email,
        name: companyAdmin.name,
        role: companyAdmin.role,
      },
    };
  }

  /**
   * Get all companies (Super Admin only)
   */
  async findAll() {
    return this.companyModel
      .find()
      .populate('createdBy', 'name email')
      .populate('managers', 'name email role')
      .exec();
  }

  /**
   * Get company by ID
   */
  async findById(id: string, requestUserId?: string, requestUserRole?: UserRole) {
    const company = await this.companyModel
      .findById(id)
      .populate('createdBy', 'name email')
      .populate('managers', 'name email role')
      .populate('users', 'name email role')
      .exec();

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check access: Super Admin can access any, Company Admin can only access their own
    if (requestUserRole === UserRole.COMPANY_ADMIN) {
      const user = await this.userModel.findById(requestUserId).exec();
      if (user && user.companyId?.toString() !== id) {
        throw new ForbiddenException('You can only access your own company');
      }
    }

    return company;
  }

  /**
   * Get all users in a company (Company Admin only)
   */
  async getCompanyUsers(companyId: string, requestUserId: string, requestUserRole: UserRole) {
    // Verify the user is a company admin of this company
    if (requestUserRole !== UserRole.COMPANY_ADMIN && requestUserRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only company admins can view company users');
    }

    const user = await this.userModel.findById(requestUserId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (requestUserRole === UserRole.COMPANY_ADMIN && user.companyId?.toString() !== companyId) {
      throw new ForbiddenException('You can only view users from your own company');
    }

    // Get all users in the company
    const users = await this.userModel
      .find({ companyId: companyId })
      .select('-password')
      .populate('createdBy', 'name email')
      .populate('managerId', 'name email')
      .exec();

    return users;
  }

  /**
   * Update company
   */
  async update(id: string, data: Partial<CreateCompanyDto>, requestUserId: string, requestUserRole: UserRole) {
    if (requestUserRole !== UserRole.SUPER_ADMIN && requestUserRole !== UserRole.COMPANY_ADMIN) {
      throw new ForbiddenException('Only super admins and company admins can update companies');
    }

    // If company admin, verify they own this company
    if (requestUserRole === UserRole.COMPANY_ADMIN) {
      const user = await this.userModel.findById(requestUserId).exec();
      if (!user || user.companyId?.toString() !== id) {
        throw new ForbiddenException('You can only update your own company');
      }
    }

    // Prepare update data (only allow certain fields)
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.domain !== undefined) updateData.domain = data.domain;

    const company = await this.companyModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'name email')
      .populate('managers', 'name email role')
      .exec();

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }
}

