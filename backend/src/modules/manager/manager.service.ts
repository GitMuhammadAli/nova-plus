import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Department, DepartmentDocument } from '../department/entities/department.entity';

@Injectable()
export class ManagerService {
  constructor(
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
  ) {}

  /**
   * Get the department ID for a manager
   * Managers are assigned to departments via department.managerId
   */
  async getManagerDepartmentId(managerId: string, companyId: string): Promise<string | undefined> {
    const department = await this.departmentModel.findOne({
      managerId: new Types.ObjectId(managerId),
      companyId: new Types.ObjectId(companyId),
      isActive: true,
    }).exec();

    return department?._id?.toString();
  }

  /**
   * Verify that a user belongs to the manager's department
   */
  async verifyUserInDepartment(userId: string, departmentId: string | undefined, companyId: string): Promise<boolean> {
    if (!departmentId) {
      // If manager has no department, they can only manage users they created
      return false;
    }

    const department = await this.departmentModel.findById(departmentId).exec();
    if (!department || department.companyId?.toString() !== companyId) {
      return false;
    }

    // Check if user is in department members
    return department.members.some(memberId => memberId.toString() === userId);
  }
}

