import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Department, DepartmentDocument } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { User, UserDocument } from '../user/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditResource } from '../audit/entities/audit-log.entity';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => AuditService))
    private auditService: AuditService,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto, companyId: string, userId: string): Promise<DepartmentDocument> {
    // Check if department name already exists for this company
    const existing = await this.departmentModel.findOne({
      companyId: new Types.ObjectId(companyId),
      name: createDepartmentDto.name,
    });

    if (existing) {
      throw new ForbiddenException('Department with this name already exists');
    }

    // Validate manager if provided
    if (createDepartmentDto.managerId) {
      const manager = await this.userModel.findById(createDepartmentDto.managerId);
      if (!manager || manager.companyId?.toString() !== companyId) {
        throw new NotFoundException('Manager not found or does not belong to company');
      }
    }

    const department = new this.departmentModel({
      ...createDepartmentDto,
      companyId: new Types.ObjectId(companyId),
      createdBy: new Types.ObjectId(userId),
      members: createDepartmentDto.memberIds?.map(id => new Types.ObjectId(id)) || [],
    });

    const saved = await department.save();

    // Audit log
    try {
      await this.auditService.createLog({
        action: AuditAction.DEPARTMENT_CREATED,
        resource: AuditResource.DEPARTMENT,
        userId: userId,
        companyId: companyId,
        resourceId: saved._id,
        metadata: { name: saved.name, managerId: saved.managerId?.toString() },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }

    return saved;
  }

  async findAll(companyId: string): Promise<DepartmentDocument[]> {
    return this.departmentModel.find({
      companyId: new Types.ObjectId(companyId),
    }).populate('managerId', 'name email').populate('members', 'name email').exec();
  }

  async findOne(id: string, companyId: string): Promise<DepartmentDocument> {
    const department = await this.departmentModel.findOne({
      _id: id,
      companyId: new Types.ObjectId(companyId),
    }).populate('managerId', 'name email').populate('members', 'name email').exec();

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto, companyId: string): Promise<DepartmentDocument> {
    const department = await this.departmentModel.findOne({
      _id: id,
      companyId: new Types.ObjectId(companyId),
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Validate manager if being updated
    if (updateDepartmentDto.managerId) {
      const manager = await this.userModel.findById(updateDepartmentDto.managerId);
      if (!manager || manager.companyId?.toString() !== companyId) {
        throw new NotFoundException('Manager not found or does not belong to company');
      }
    }

    // Update members if provided
    if (updateDepartmentDto.memberIds) {
      department.members = updateDepartmentDto.memberIds.map(id => new Types.ObjectId(id));
    }

    const oldData = { ...department.toObject() };
    Object.assign(department, updateDepartmentDto);
    const saved = await department.save();

    // Audit log
    try {
      await this.auditService.createLog({
        action: AuditAction.DEPARTMENT_UPDATED,
        resource: AuditResource.DEPARTMENT,
        userId: companyId, // Will be set from request context
        companyId: companyId,
        resourceId: saved._id,
        metadata: { 
          changes: updateDepartmentDto,
          previous: oldData,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }

    return saved;
  }

  async remove(id: string, companyId: string, userId?: string): Promise<void> {
    const department = await this.departmentModel.findOne({
      _id: id,
      companyId: new Types.ObjectId(companyId),
    }).exec();

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const result = await this.departmentModel.deleteOne({
      _id: id,
      companyId: new Types.ObjectId(companyId),
    }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Department not found');
    }

    // Audit log
    try {
      await this.auditService.createLog({
        action: AuditAction.DEPARTMENT_DELETED,
        resource: AuditResource.DEPARTMENT,
        userId: userId,
        companyId: companyId,
        resourceId: id,
        metadata: { name: department.name },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  async assignManager(departmentId: string, managerId: string, companyId: string): Promise<DepartmentDocument> {
    const department = await this.departmentModel.findOne({
      _id: departmentId,
      companyId: new Types.ObjectId(companyId),
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const manager = await this.userModel.findById(managerId);
    if (!manager || manager.companyId?.toString() !== companyId) {
      throw new NotFoundException('Manager not found');
    }

    department.managerId = new Types.ObjectId(managerId);
    return department.save();
  }

  async addMember(departmentId: string, userId: string, companyId: string): Promise<DepartmentDocument> {
    const department = await this.departmentModel.findOne({
      _id: departmentId,
      companyId: new Types.ObjectId(companyId),
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const user = await this.userModel.findById(userId);
    if (!user || user.companyId?.toString() !== companyId) {
      throw new NotFoundException('User not found');
    }

    if (!department.members.some(m => m.toString() === userId)) {
      department.members.push(new Types.ObjectId(userId));
    }

    return department.save();
  }

  async removeMember(departmentId: string, userId: string, companyId: string): Promise<DepartmentDocument> {
    const department = await this.departmentModel.findOne({
      _id: departmentId,
      companyId: new Types.ObjectId(companyId),
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    department.members = department.members.filter(m => m.toString() !== userId);
    return department.save();
  }

  async getMembers(departmentId: string, companyId: string): Promise<any[]> {
    const department = await this.departmentModel.findOne({
      _id: departmentId,
      companyId: new Types.ObjectId(companyId),
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const members = await this.userModel.find({
      _id: { $in: department.members },
      companyId: new Types.ObjectId(companyId),
    }).select('name email role isActive').exec();

    return members;
  }

  async getStats(departmentId: string, companyId: string): Promise<any> {
    const department = await this.departmentModel.findOne({
      _id: departmentId,
      companyId: new Types.ObjectId(companyId),
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const members = await this.userModel.find({
      _id: { $in: department.members },
      companyId: new Types.ObjectId(companyId),
    });

    const activeUsers = members.filter(m => m.isActive).length;
    const totalUsers = members.length;

    // Count by role
    const roleCounts = members.reduce((acc, member) => {
      const role = member.role || 'USER';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      departmentId: department._id,
      departmentName: department.name,
      teamSize: totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      hasManager: !!department.managerId,
      roleBreakdown: roleCounts,
      memberCount: department.members.length,
    };
  }
}

