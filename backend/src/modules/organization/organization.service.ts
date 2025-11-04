import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from './entities/organization.entity';
import { UsersService } from '../user/user.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UserRole } from '../user/entities/user.entity';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectModel(Organization.name)
    private orgModel: Model<OrganizationDocument>,
    private usersService: UsersService,
  ) {}

  /**
   * Create organization with initial admin user
   */
  async create(data: CreateOrganizationDto) {
    // Check if slug already exists
    const existing = await this.orgModel.findOne({ slug: data.slug }).exec();
    if (existing) {
      throw new BadRequestException('Organization slug already exists');
    }

    // Check if admin email already exists
    const existingUser = await this.usersService.findByEmail(data.adminEmail);
    if (existingUser) {
      throw new BadRequestException('Admin email already exists');
    }

    // Create organization first (without owner, will update after creating admin)
    const org = new this.orgModel({
      name: data.name,
      slug: data.slug,
      description: data.description,
      isActive: true,
    });

    const savedOrg = await org.save();

    // Create admin user for this organization
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.default.hash(data.adminPassword, 10);

    const admin = await this.usersService.create({
      email: data.adminEmail,
      password: hashedPassword,
      name: data.adminName,
      role: UserRole.ADMIN,
      orgId: savedOrg._id.toString(),
      isActive: true,
    });

    // Update organization with owner and add admin to members
    savedOrg.owner = admin._id as any;
    savedOrg.members.push(admin._id as any);
    await savedOrg.save();

    return {
      organization: {
        _id: savedOrg._id,
        name: savedOrg.name,
        slug: savedOrg.slug,
        description: savedOrg.description,
        isActive: savedOrg.isActive,
      },
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
        _id: admin._id,
      },
    };
  }

  /**
   * Get organization by ID
   */
  async findById(id: string) {
    const org = await this.orgModel
      .findById(id)
      .populate('owner', 'name email role')
      .populate('members', 'name email role')
      .exec();
    
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    
    return org;
  }

  /**
   * Get organization by slug
   */
  async findBySlug(slug: string) {
    return this.orgModel.findOne({ slug }).exec();
  }

  /**
   * Get organization for logged-in user
   */
  async getMyOrganization(orgId: string) {
    return this.findById(orgId);
  }

  /**
   * Update organization
   */
  async update(id: string, data: Partial<Organization>) {
    const org = await this.orgModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    
    return org;
  }

  /**
   * Add member to organization
   */
  async addMember(orgId: string, userId: string) {
    const org = await this.findById(orgId);
    
    if (!org.members.some(m => m.toString() === userId)) {
      org.members.push(userId as any);
      await org.save();
    }
    
    return org;
  }

  /**
   * Get all organizations (for superadmin or system use)
   */
  async findAll() {
    return this.orgModel.find().populate('owner', 'name email').exec();
  }
}

