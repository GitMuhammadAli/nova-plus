import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Department, DepartmentDocument } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { User, UserDocument } from '../user/entities/user.entity';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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

    return department.save();
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

    Object.assign(department, updateDepartmentDto);
    return department.save();
  }

  async remove(id: string, companyId: string): Promise<void> {
    const result = await this.departmentModel.deleteOne({
      _id: id,
      companyId: new Types.ObjectId(companyId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Department not found');
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
}

