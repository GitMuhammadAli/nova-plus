import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document, Types } from 'mongoose';
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
    companyId?: string;
    createdBy?: string;
    managerId?: string;
    isActive?: boolean;
    department?: string;
    location?: string;
  }): Promise<User> {
    const hashed = await bcrypt.hash(data.password, 10);
    const user = new this.userModel({
      email: data.email,
      password: hashed,
      name: data.name,
      role: data.role || UserRole.USER,
      orgId: data.orgId,
      companyId: data.companyId,
      createdBy: data.createdBy,
      managerId: data.managerId,
      isActive: data.isActive !== undefined ? data.isActive : true,
      department: data.department,
      location: data.location,
    });
    return user.save();
  }

  /**
   * Company Admin / Manager creates Managers or Users
   * Can create: 'manager' or 'user' roles
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
      companyId?: string;
      department?: string;
      location?: string;
    }
  ): Promise<User> {
    // Validate role - Cannot create super_admin or company_admin (only super admin can create company_admin)
    if (data.role === UserRole.SUPER_ADMIN || data.role === UserRole.COMPANY_ADMIN) {
      throw new ForbiddenException('Cannot create admin roles through this endpoint');
    }

    // Check if email already exists
    const existingUser = await this.userModel.findOne({ email: data.email }).exec();
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // If creating a user and managerId is provided, verify manager exists and is in same company/org
    if (data.role === UserRole.USER && data.managerId) {
      const manager = await this.userModel.findById(data.managerId).exec();
      if (!manager || manager.role !== UserRole.MANAGER) {
        throw new BadRequestException('Invalid manager ID or manager does not exist');
      }
      // Check company match if companyId provided, otherwise check orgId
      if (data.companyId) {
        if (manager.companyId?.toString() !== data.companyId) {
          throw new ForbiddenException('Manager must be in the same company');
        }
      } else if (manager.orgId?.toString() !== creatorOrgId) {
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
      companyId: data.companyId,
      createdBy: creatorId,
      managerId: data.role === UserRole.USER ? data.managerId : undefined,
      department: data.department,
      location: data.location,
      isActive: true,
    });

    const savedUser = await user.save();
    const userObj: any = savedUser.toObject ? savedUser.toObject() : savedUser;
    delete userObj.password;
    return userObj;
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
      companyId?: string;
    }
  ): Promise<User> {
    // Verify creator is a manager
    const creator = await this.userModel.findById(creatorId).exec();
    if (!creator || creator.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Only managers can create users through this endpoint');
    }

    // Ensure manager is in the same org/company
    if (data.companyId) {
      if (creator.companyId?.toString() !== data.companyId) {
        throw new ForbiddenException('Manager must be in the same company');
      }
    } else if (creator.orgId?.toString() !== creatorOrgId) {
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
      companyId: data.companyId,
      createdBy: creatorId,
      managerId: creatorId, // User's manager is the creator
      department: data.department,
      location: data.location,
      isActive: true,
    });

    const savedUser = await user.save();
    const userObj: any = savedUser.toObject ? savedUser.toObject() : savedUser;
    delete userObj.password;
    return userObj;
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

  /**
   * Company Admin: Get all users in the company
   */
  async findAllForCompany(companyId: string, params?: { page?: number; limit?: number; search?: string }) {
    const page = params?.page || 1;
    const limit = params?.limit || 100;
    const skip = (page - 1) * limit;
    const search = params?.search || '';

    // Build query - scope by company
    const query: any = {
      $or: [
        { companyId: companyId }, // Filter by companyId
        { orgId: companyId }, // Fallback to orgId for backward compatibility
      ],
    };

    if (search) {
      const searchQuery = { $regex: search, $options: 'i' };
      query.$and = [
        {
          $or: [
            { name: searchQuery },
            { email: searchQuery },
          ],
        },
      ];
    }

    // Get users (excluding password)
    const users = await this.userModel
      .find(query)
      .select('-password')
      .populate('createdBy', 'name email role')
      .populate('managerId', 'name email role')
      .populate('companyId', 'name domain')
      .populate('orgId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    // Get total count
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
    const updateData: any = { ...data };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    if (data.managerId) {
      const manager = await this.userModel.findById(data.managerId).exec();
      if (!manager || manager.role !== UserRole.MANAGER) {
        throw new BadRequestException('Invalid manager selected');
      }
      updateData.managerId = manager._id;
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
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

  /**
   * Bulk create users
   */
  async bulkCreate(creatorId: string, companyId: string, users: Array<{ name: string; email: string; password: string; role?: UserRole; departmentId?: string }>) {
    const created: any[] = [];
    const failed: Array<{ email: string; error: string }> = [];

    for (const userData of users) {
      try {
        // Check if email already exists
        const existing = await this.userModel.findOne({ email: userData.email }).exec();
        if (existing) {
          failed.push({ email: userData.email, error: 'Email already exists' });
          continue;
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = new this.userModel({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role || UserRole.USER,
          companyId: new Types.ObjectId(companyId),
          createdBy: new Types.ObjectId(creatorId),
          isActive: true,
        });

        const savedUser = await user.save();
        const userObj: any = savedUser.toObject ? savedUser.toObject() : savedUser;
        delete userObj.password;

        // If departmentId provided, add user to department (would need DepartmentService)
        if (userData.departmentId) {
          // This would require injecting DepartmentService
          // For now, we'll just set the department field
          await this.userModel.findByIdAndUpdate(savedUser._id, { department: userData.departmentId }).exec();
        }

        created.push(userObj);
      } catch (error: any) {
        failed.push({ email: userData.email, error: error.message || 'Unknown error' });
      }
    }

    return { created, failed };
  }

  /**
   * Assign user to department
   */
  async assignDepartment(userId: string, departmentId: string | undefined, companyId: string) {
    const user = await this.userModel.findOne({
      _id: userId,
      $or: [{ companyId }, { orgId: companyId }],
    }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user's department field
    const updateData: any = {};
    if (departmentId) {
      updateData.department = departmentId;
    } else {
      updateData.$unset = { department: '' };
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).select('-password').exec();
    return updatedUser;
  }

  /**
   * Assign manager to user
   */
  async assignManager(userId: string, managerId: string | undefined, companyId: string) {
    const user = await this.userModel.findOne({
      _id: userId,
      $or: [{ companyId }, { orgId: companyId }],
    }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (managerId) {
      const manager = await this.userModel.findOne({
        _id: managerId,
        $or: [{ companyId }, { orgId: companyId }],
        role: UserRole.MANAGER,
      }).exec();

      if (!manager) {
        throw new NotFoundException('Manager not found or invalid');
      }
    }

    const updateData: any = {};
    if (managerId) {
      updateData.managerId = new Types.ObjectId(managerId);
    } else {
      updateData.$unset = { managerId: '' };
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).select('-password').exec();
    return updatedUser;
  }

  /**
   * Get user statistics for company
   */
  async getStats(companyId: string) {
    const [totalUsers, activeUsers, inactiveUsers, managers, users, admins] = await Promise.all([
      this.userModel.countDocuments({ $or: [{ companyId }, { orgId: companyId }] }).exec(),
      this.userModel.countDocuments({ $or: [{ companyId }, { orgId: companyId }], isActive: true }).exec(),
      this.userModel.countDocuments({ $or: [{ companyId }, { orgId: companyId }], isActive: false }).exec(),
      this.userModel.countDocuments({ $or: [{ companyId }, { orgId: companyId }], role: UserRole.MANAGER }).exec(),
      this.userModel.countDocuments({ $or: [{ companyId }, { orgId: companyId }], role: UserRole.USER }).exec(),
      this.userModel.countDocuments({ $or: [{ companyId }, { orgId: companyId }], role: UserRole.COMPANY_ADMIN }).exec(),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      managers,
      users,
      admins,
    };
  }
}