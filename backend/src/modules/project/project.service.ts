import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument, ProjectStatus } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User, UserRole, UserDocument } from '../user/entities/user.entity';
import { Company } from '../company/entities/company.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
  ) {}

  /**
   * Create a new project (Manager/Admin only)
   */
  async create(createProjectDto: CreateProjectDto, user: UserDocument) {
    // Only managers and admins can create projects
    if (user.role !== UserRole.MANAGER && user.role !== UserRole.COMPANY_ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only managers and admins can create projects');
    }

    if (!user.companyId) {
      throw new BadRequestException('User must belong to a company');
    }

    // Verify company exists
    const company = await this.companyModel.findById(user.companyId).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Verify assigned users belong to the same company
    if (createProjectDto.assignedUserIds && createProjectDto.assignedUserIds.length > 0) {
      const assignedUsers = await this.userModel.find({
        _id: { $in: createProjectDto.assignedUserIds },
        companyId: user.companyId,
      }).exec();

      if (assignedUsers.length !== createProjectDto.assignedUserIds.length) {
        throw new BadRequestException('Some assigned users do not belong to your company');
      }
    }

    const project = new this.projectModel({
      name: createProjectDto.name,
      description: createProjectDto.description,
      companyId: user.companyId,
      createdBy: user._id,
      assignedUsers: createProjectDto.assignedUserIds || [],
      status: createProjectDto.status || ProjectStatus.ACTIVE,
      startDate: createProjectDto.startDate ? new Date(createProjectDto.startDate) : undefined,
      endDate: createProjectDto.endDate ? new Date(createProjectDto.endDate) : undefined,
      isActive: true,
    });

    return project.save();
  }

  /**
   * Get all projects for a company (scoped by user's company)
   */
  async findAll(user: UserDocument, filters?: { status?: ProjectStatus; assignedTo?: string }) {
    if (!user.companyId) {
      throw new BadRequestException('User must belong to a company');
    }

    const query: any = { companyId: user.companyId, isActive: true };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.assignedTo) {
      query.assignedUsers = filters.assignedTo;
    }

    return this.projectModel
      .find(query)
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get project by ID
   */
  async findOne(id: string, user: UserDocument) {
    const project = await this.projectModel
      .findById(id)
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name email role')
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify user belongs to the same company
    if (user.companyId?.toString() !== project.companyId.toString()) {
      throw new ForbiddenException('You can only access projects from your company');
    }

    return project;
  }

  /**
   * Update project (Manager/Admin only, or assigned user for status updates)
   */
  async update(id: string, updateProjectDto: UpdateProjectDto, user: UserDocument) {
    const project = await this.projectModel.findById(id).exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify user belongs to the same company
    if (user.companyId?.toString() !== project.companyId.toString()) {
      throw new ForbiddenException('You can only update projects from your company');
    }

    // Only managers/admins can update most fields, but assigned users can update their own status
    const isAssignedUser = project.assignedUsers.some(
      (userId) => userId.toString() === user._id?.toString()
    );
    const isManagerOrAdmin = 
      user.role === UserRole.MANAGER || 
      user.role === UserRole.COMPANY_ADMIN || 
      user.role === UserRole.SUPER_ADMIN;

    // If updating more than just status, require manager/admin
    const updatingMoreThanStatus = Object.keys(updateProjectDto).some(
      key => key !== 'status'
    );

    if (updatingMoreThanStatus && !isManagerOrAdmin) {
      throw new ForbiddenException('Only managers and admins can update project details');
    }

    // If updating status and not manager/admin, verify user is assigned
    if (updateProjectDto.status && !isManagerOrAdmin && !isAssignedUser) {
      throw new ForbiddenException('You can only update projects assigned to you');
    }

    // Verify assigned users belong to the same company
    if (updateProjectDto.assignedUserIds && updateProjectDto.assignedUserIds.length > 0) {
      const assignedUsers = await this.userModel.find({
        _id: { $in: updateProjectDto.assignedUserIds },
        companyId: user.companyId,
      }).exec();

      if (assignedUsers.length !== updateProjectDto.assignedUserIds.length) {
        throw new BadRequestException('Some assigned users do not belong to your company');
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (updateProjectDto.name) updateData.name = updateProjectDto.name;
    if (updateProjectDto.description !== undefined) updateData.description = updateProjectDto.description;
    if (updateProjectDto.assignedUserIds) updateData.assignedUsers = updateProjectDto.assignedUserIds;
    if (updateProjectDto.status) updateData.status = updateProjectDto.status;
    if (updateProjectDto.startDate) updateData.startDate = new Date(updateProjectDto.startDate);
    if (updateProjectDto.endDate) updateData.endDate = new Date(updateProjectDto.endDate);
    if (updateProjectDto.isActive !== undefined) updateData.isActive = updateProjectDto.isActive;

    return this.projectModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name email role')
      .exec();
  }

  /**
   * Delete project (Manager/Admin only)
   */
  async remove(id: string, user: UserDocument) {
    if (user.role !== UserRole.MANAGER && user.role !== UserRole.COMPANY_ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only managers and admins can delete projects');
    }

    const project = await this.projectModel.findById(id).exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify user belongs to the same company
    if (user.companyId?.toString() !== project.companyId.toString()) {
      throw new ForbiddenException('You can only delete projects from your company');
    }

    // Soft delete
    project.isActive = false;
    return project.save();
  }

  /**
   * Get projects assigned to a specific user
   */
  async findUserProjects(userId: string, user: UserDocument) {
    if (user._id?.toString() !== userId && 
        user.role !== UserRole.MANAGER && 
        user.role !== UserRole.COMPANY_ADMIN && 
        user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You can only view your own projects');
    }

    return this.projectModel
      .find({ 
        assignedUsers: userId,
        isActive: true,
        companyId: user.companyId,
      })
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name email role')
      .sort({ createdAt: -1 })
      .exec();
  }
}

