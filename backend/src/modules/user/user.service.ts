import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { User, UserRole } from './entities/user.entity';
import bcrypt from 'bcrypt';

export type UserDocument = User & Document;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async create(data: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    orgId?: string;
    createdBy?: string;
    managerId?: string;
    isActive?: boolean;
  }): Promise<User> {
    const hashed = await bcrypt.hash(data.password, 10);
    const user = new this.userModel({
      email: data.email,
      password: hashed,
      name: data.name,
      role: data.role || UserRole.USER,
      orgId: data.orgId,
      createdBy: data.createdBy,
      managerId: data.managerId,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
    return user.save();
  }

  /**
   * Admin creates Managers or Users
   * Admin can create: 'manager' or 'user' roles
   */
  async createByAdmin(
    creatorId: string,
    creatorOrgId: string,
    data: {
      name: string;
      email: string;
      password: string;
      role: UserRole;
      managerId?: string;
    }
  ): Promise<User> {
    // Validate role - Admin can only create 'manager' or 'user', not another 'admin'
    if (data.role === UserRole.ADMIN || data.role === UserRole.SUPERADMIN) {
      throw new ForbiddenException('Admins cannot create other admins');
    }

    // Check if email already exists
    const existingUser = await this.userModel.findOne({ email: data.email }).exec();
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // If creating a user and managerId is provided, verify manager exists and is in same org
    if (data.role === UserRole.USER && data.managerId) {
      const manager = await this.userModel.findById(data.managerId).exec();
      if (!manager || manager.role !== UserRole.MANAGER) {
        throw new BadRequestException('Invalid manager ID or manager does not exist');
      }
      if (manager.orgId?.toString() !== creatorOrgId) {
        throw new ForbiddenException('Manager must be in the same organization');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = new this.userModel({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      orgId: creatorOrgId,
      createdBy: creatorId,
      managerId: data.role === UserRole.USER ? data.managerId : undefined,
      isActive: true,
    });

    const savedUser = await user.save();
    return savedUser;
  }

  /**
   * Manager creates Users under them
   * Managers can only create 'user' role
   */
  async createByManager(
    creatorId: string,
    creatorOrgId: string,
    data: {
      name: string;
      email: string;
      password: string;
      department?: string;
      location?: string;
    }
  ): Promise<User> {
    // Verify creator is a manager
    const creator = await this.userModel.findById(creatorId).exec();
    if (!creator || creator.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Only managers can create users through this endpoint');
    }

    // Ensure manager is in the same org
    if (creator.orgId?.toString() !== creatorOrgId) {
      throw new ForbiddenException('Manager must be in the same organization');
    }

    // Check if email already exists
    const existingUser = await this.userModel.findOne({ email: data.email }).exec();
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = new this.userModel({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: UserRole.USER,
      orgId: creatorOrgId,
      createdBy: creatorId,
      managerId: creatorId, // User's manager is the creator
      isActive: true,
    });

    const savedUser = await user.save();
    return savedUser;
  }

  /**
   * Get all users created by a specific manager (scoped to same org)
   */
  async findUsersByManager(managerId: string, managerOrgId: string, params?: { page?: number; limit?: number; search?: string }) {
    const page = params?.page || 1;
    const limit = params?.limit || 100;
    const skip = (page - 1) * limit;
    const search = params?.search || '';

    const query: any = {
      managerId: managerId,
      orgId: managerOrgId, // Ensure same organization
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await this.userModel
      .find(query)
      .select('-password')
      .populate('createdBy', 'name email')
      .populate('managerId', 'name email')
      .populate('orgId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const total = await this.userModel.countDocuments(query).exec();

    return {
      data: users || [],
      pagination: {
        page,
        limit,
        total: total || 0,
        pages: Math.ceil((total || 0) / limit),
      },
    };
  }

  /**
   * Admin: Get all users in the organization
   */
  async findAllForAdmin(orgId: string, params?: { page?: number; limit?: number; search?: string }) {
    return this.findAll(orgId, params);
  }

  async findAll(orgId: string, params?: { page?: number; limit?: number; search?: string }) {
    const page = params?.page || 1;
    const limit = params?.limit || 100;
    const skip = (page - 1) * limit;
    const search = params?.search || '';

    // Build query - scope by organization
    const query: any = {
      orgId: orgId, // Filter by organization
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Get users (excluding password)
    const users = await this.userModel
      .find(query)
      .select('-password')
      .populate('createdBy', 'name email role')
      .populate('managerId', 'name email role')
      .populate('orgId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    // Get total count
    const total = await this.userModel.countDocuments(query).exec();

    // Return empty array if no users, don't throw error
    return {
      data: users || [],
      pagination: {
        page,
        limit,
        total: total || 0,
        pages: Math.ceil((total || 0) / limit),
      },
    };
  }

  async findById(id: string, orgId?: string) {
    const query: any = { _id: id };
    if (orgId) {
      query.orgId = orgId; // Ensure user is in the same org
    }

    const user = await this.userModel
      .findOne(query)
      .select('-password')
      .populate('createdBy', 'name email role')
      .populate('managerId', 'name email role')
      .populate('orgId', 'name slug')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, data: Partial<User>) {
    const user = await this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .select('-password')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async delete(id: string) {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted successfully' };
  }
}