import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { ManagerProjectsService } from './projects/manager-projects.service';
import { ManagerTasksService } from './tasks/manager-tasks.service';
import { ManagerTeamService } from './team/manager-team.service';
import { ManagerStatsService } from './stats/manager-stats.service';
import { ManagerService } from './manager.service';
import { CreateTaskDto } from '../task/dto/create-task.dto';
import { UpdateTaskDto } from '../task/dto/update-task.dto';

@Controller('manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
export class ManagerController {
  constructor(
    private readonly projectsService: ManagerProjectsService,
    private readonly tasksService: ManagerTasksService,
    private readonly teamService: ManagerTeamService,
    private readonly statsService: ManagerStatsService,
    private readonly managerService: ManagerService,
  ) {}

  // ========== PROJECTS ==========
  @Get('projects')
  async getProjects(@Req() req) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    
    return {
      success: true,
      data: await this.projectsService.getDepartmentProjects(companyId, departmentId),
    };
  }

  @Get('projects/:id')
  async getProject(@Param('id') id: string, @Req() req) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    
    return {
      success: true,
      data: await this.projectsService.getProjectDetails(id, companyId, departmentId),
    };
  }

  @Get('projects/:id/tasks')
  async getProjectTasks(@Param('id') id: string, @Req() req) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    
    return {
      success: true,
      data: await this.projectsService.getProjectTasks(id, companyId, departmentId),
    };
  }

  // ========== TASKS ==========
  @Post('tasks')
  async createTask(@Body() createTaskDto: CreateTaskDto, @Req() req) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    
    return {
      success: true,
      data: await this.tasksService.createTask(createTaskDto, manager, companyId, departmentId),
    };
  }

  @Get('tasks')
  async getTasks(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
    @Req() req?,
  ) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    
    return {
      success: true,
      data: await this.tasksService.getTasks(companyId, departmentId, {
        projectId,
        status,
        assignedTo,
      }),
    };
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string, @Req() req) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    
    return {
      success: true,
      data: await this.tasksService.getTaskDetails(id, companyId, departmentId),
    };
  }

  @Patch('tasks/:id')
  async updateTask(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Req() req) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    
    return {
      success: true,
      data: await this.tasksService.updateTask(id, updateTaskDto, companyId, departmentId, manager),
    };
  }

  @Delete('tasks/:id')
  async deleteTask(@Param('id') id: string, @Req() req) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    
    await this.tasksService.deleteTask(id, companyId, departmentId, manager);
    return {
      success: true,
      message: 'Task deleted successfully',
    };
  }

  @Post('tasks/:id/assign')
  async assignTask(
    @Param('id') id: string,
    @Body() body: { userId: string },
    @Req() req,
  ) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    
    return {
      success: true,
      data: await this.tasksService.assignTask(id, body.userId, companyId, departmentId, manager),
    };
  }

  @Post('tasks/:id/status')
  async updateTaskStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req,
  ) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    
    return {
      success: true,
      data: await this.tasksService.updateTaskStatus(id, body.status, companyId, departmentId, manager),
    };
  }

  @Post('tasks/:id/comment')
  async addComment(
    @Param('id') id: string,
    @Body() body: { comment: string },
    @Req() req,
  ) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    const userId = manager._id || manager.id;
    
    return {
      success: true,
      data: await this.tasksService.addComment(id, userId, body.comment, companyId, departmentId),
    };
  }

  @Post('tasks/:id/attachment')
  async addAttachment(
    @Param('id') id: string,
    @Body() body: { filename: string; url: string; size?: number; mimeType?: string },
    @Req() req,
  ) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    const userId = manager._id || manager.id;
    
    return {
      success: true,
      data: await this.tasksService.addAttachment(id, userId, body, companyId, departmentId),
    };
  }

  // ========== TEAM ==========
  @Get('team')
  async getTeam(@Req() req) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    
    return {
      success: true,
      data: await this.teamService.getTeamMembers(companyId, departmentId),
    };
  }

  @Get('team/:userId')
  async getTeamMember(@Param('userId') userId: string, @Req() req) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    
    return {
      success: true,
      data: await this.teamService.getTeamMemberDetails(userId, companyId, departmentId),
    };
  }

  // ========== STATS ==========
  @Get('stats/overview')
  async getStatsOverview(@Req() req) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    
    return {
      success: true,
      data: await this.statsService.getOverview(companyId, departmentId),
    };
  }

  @Get('stats/tasks')
  async getTaskStats(@Req() req) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    
    return {
      success: true,
      data: await this.statsService.getTaskStats(companyId, departmentId),
    };
  }

  @Get('stats/team')
  async getTeamStats(@Req() req) {
    const manager = req.user;
    const companyId = manager.companyId?.toString() || manager.companyId;
    const departmentId = await this.getManagerDepartmentId(manager._id || manager.id, companyId);
    
    return {
      success: true,
      data: await this.statsService.getTeamStats(companyId, departmentId),
    };
  }

  // Helper method to get manager's department ID
  private async getManagerDepartmentId(managerId: string, companyId: string): Promise<string | undefined> {
    return this.managerService.getManagerDepartmentId(managerId, companyId);
  }
}

