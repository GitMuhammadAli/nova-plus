import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../user/entities/user.entity';
import { Task, TaskDocument, TaskStatus } from '../../task/entities/task.entity';
import { Department, DepartmentDocument } from '../../department/entities/department.entity';

@Injectable()
export class ManagerTeamService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
  ) {}

  /**
   * Get all users in manager's department
   */
  async getTeamMembers(companyId: string, departmentId?: string): Promise<any[]> {
    let userIds: Types.ObjectId[] = [];

    if (departmentId) {
      const department = await this.departmentModel.findById(departmentId).exec();
      if (department) {
        userIds = department.members;
      }
    } else {
      // If no department, return empty (manager has no team)
      return [];
    }

    if (userIds.length === 0) {
      return [];
    }

    const users = await this.userModel
      .find({
        _id: { $in: userIds },
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .select('-password')
      .lean()
      .exec();

    // Get task statistics for each user
    const teamMembersWithStats = await Promise.all(
      users.map(async (user) => {
        const tasks = await this.taskModel.find({
          assignedTo: user._id,
          companyId: new Types.ObjectId(companyId),
          isActive: true,
        }).exec();

        const numberOfTasksAssigned = tasks.length;
        const numberOfTasksCompleted = tasks.filter(t => t.status === TaskStatus.DONE).length;
        const activeTasks = tasks.filter(t => 
          t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.TODO || t.status === TaskStatus.REVIEW
        ).length;
        
        const now = new Date();
        const overdueTasks = tasks.filter(t => 
          t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.DONE
        ).length;

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          numberOfTasksAssigned,
          numberOfTasksCompleted,
          activeTasks,
          overdueTasks,
          completionRate: numberOfTasksAssigned > 0 
            ? Math.round((numberOfTasksCompleted / numberOfTasksAssigned) * 100) 
            : 0,
        };
      }),
    );

    return teamMembersWithStats;
  }

  /**
   * Get detailed information about a team member
   */
  async getTeamMemberDetails(userId: string, companyId: string, departmentId?: string): Promise<any> {
    const user = await this.userModel
      .findOne({
        _id: userId,
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify user is in manager's department
    if (departmentId) {
      const department = await this.departmentModel.findById(departmentId).exec();
      if (department) {
        const isMember = department.members.some(memberId => memberId.toString() === userId);
        if (!isMember) {
          throw new ForbiddenException('User is not in your department');
        }
      }
    }

    // Get all tasks for this user
    const tasks = await this.taskModel
      .find({
        assignedTo: new Types.ObjectId(userId),
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const numberOfTasksAssigned = tasks.length;
    const numberOfTasksCompleted = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const activeTasks = tasks.filter(t => 
      t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.TODO || t.status === TaskStatus.REVIEW
    ).length;
    
    const now = new Date();
    const overdueTasks = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.DONE
    ).length;

    // Tasks by status
    const tasksByStatus = {
      todo: tasks.filter(t => t.status === TaskStatus.TODO).length,
      in_progress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      review: tasks.filter(t => t.status === TaskStatus.REVIEW).length,
      done: numberOfTasksCompleted,
    };

    // Tasks by priority
    const tasksByPriority = {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
    };

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      location: user.location,
      numberOfTasksAssigned,
      numberOfTasksCompleted,
      activeTasks,
      overdueTasks,
      completionRate: numberOfTasksAssigned > 0 
        ? Math.round((numberOfTasksCompleted / numberOfTasksAssigned) * 100) 
        : 0,
      tasksByStatus,
      tasksByPriority,
      recentTasks: tasks.slice(0, 10).map(task => ({
        _id: task._id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        project: task.projectId,
      })),
    };
  }
}

