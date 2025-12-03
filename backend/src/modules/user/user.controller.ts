import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from "src/modules/user/entities/user.entity";
import { UsersService } from './user.service';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { CreateUserByManagerDto } from './dto/create-user-by-manager.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserTasksService } from './tasks/user-tasks.service';
import { UserProjectsService } from './projects/user-projects.service';
import { UserStatsService } from './stats/user-stats.service';
import { Types } from 'mongoose';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userTasksService: UserTasksService,
    private readonly userProjectsService: UserProjectsService,
    private readonly userStatsService: UserStatsService,
  ) {}

  /**
   * Get current logged-in user profile
   */
  @Get('me')
  getProfile(@Req() req) {
    return {
      message: 'Your profile info',
      user: req.user, // comes from token
    };
  }


  /**
   * Manager: Get all users created by the logged-in manager
   * GET /user/my-users (alias for backward compatibility)
   */
  @Get('my-users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  async getMyUsers(
    @Req() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const managerId = req.user._id || req.user.id;
    const orgId = req.user.orgId?.toString() || req.user.orgId;
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!orgId && !companyId) {
      throw new ForbiddenException('User must belong to an organization or company');
    }
    const params = {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    };
    return this.usersService.findUsersByManager(managerId, orgId || companyId, params);
  }

  /**
   * Manager: Get my team (users under the manager)
   * GET /user/my-team
   */
  @Get('my-team')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  async getMyTeam(
    @Req() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const managerId = req.user._id || req.user.id;
    const orgId = req.user.orgId?.toString() || req.user.orgId;
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!orgId && !companyId) {
      throw new ForbiddenException('User must belong to an organization or company');
    }
    const params = {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    };
    return this.usersService.findUsersByManager(managerId, orgId || companyId, params);
  }

  /**
   * Company Admin / Manager: Get all users in the company
   * GET /users/all (alias for /user/company)
   */
  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getAllUsers(
    @Req() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }
    const params = {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    };
    const result = await this.usersService.findAllForCompany(companyId, params);
    // Format response to match expected format
    if (Array.isArray(result)) {
      return result.map((user: any) => ({
        email: user.email,
        role: user.role,
        name: user.name,
        _id: user._id,
      }));
    }
    return result;
  }

  /**
   * Company Admin: Get all users in the company
   * GET /user/company
   */
  @Get('company')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async getCompanyUsers(
    @Req() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }
    const params = {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    };
    return this.usersService.findAllForCompany(companyId, params);
  }

  /**
   * Get users based on role:
   * - Admin: Gets all users
   * - Manager: Gets only their users
   * - User: Gets own profile
   */
  @Get()
  async getUsers(
    @Req() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('department') department?: string,
    @Query('status') status?: 'active' | 'inactive' | 'all',
  ) {
    const currentUser = req.user;
    const params = {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      role: role as UserRole,
      department,
      status: status || 'all',
    };

    // Company admin sees all users in their company
    if (currentUser.role === UserRole.COMPANY_ADMIN) {
      const companyId = currentUser.companyId?.toString() || currentUser.companyId;
      if (!companyId) {
        throw new ForbiddenException('Company admin must belong to a company');
      }
      return this.usersService.findAllForCompany(companyId, params);
    }

    // Admin sees all users in their org
    if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPERADMIN) {
      const orgId = currentUser.orgId?.toString() || currentUser.orgId;
      if (!orgId) {
        throw new ForbiddenException('User must belong to an organization');
      }
      return this.usersService.findAllForAdmin(orgId, params);
    }

    // Manager sees only their users in same org
    if (currentUser.role === UserRole.MANAGER) {
      const managerId = currentUser._id || currentUser.id;
      const orgId = currentUser.orgId?.toString() || currentUser.orgId;
      if (!orgId) {
        throw new ForbiddenException('User must belong to an organization');
      }
      return this.usersService.findUsersByManager(managerId, orgId, params);
    }

    // Regular users see nothing (or return empty)
    return {
      data: [],
      pagination: {
        page: params.page || 1,
        limit: params.limit || 10,
        total: 0,
        pages: 0,
      },
    };
  }

  /**
   * Get user by ID
   */
  @Get(':id')
  async getUserById(@Req() req, @Param('id') id: string) {
    const orgId = req.user?.orgId?.toString() || req.user?.orgId;
    // If user is authenticated, scope by orgId for security
    return this.usersService.findById(id, orgId);
  }


  /**
   * Company Admin / Manager: Create Managers or Users
   */
  @Post('create-by-admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  async createUserByAdmin(@Req() req, @Body() createUserDto: CreateUserByAdminDto) {
    const creatorId = req.user._id || req.user.id;
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const orgId = req.user.orgId?.toString() || req.user.orgId || companyId;
    if (!orgId && !companyId) {
      throw new ForbiddenException('User must belong to an organization or company');
    }
    const savedUser = await this.usersService.createByAdmin(creatorId, companyId || orgId, {
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password,
      role: createUserDto.role,
      managerId: createUserDto.managerId,
      companyId: companyId,
      department: createUserDto.department,
      location: createUserDto.location,
    });
    // Return without password - Mongoose documents have toObject() method
    const userObj = (savedUser as any).toObject ? (savedUser as any).toObject() : savedUser;
    const { password, ...userWithoutPassword } = userObj;
    return userWithoutPassword;
  }

  /**
   * Manager: Create Users under them
   */
  @Post('create-by-manager')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  async createUserByManager(@Req() req, @Body() createUserDto: CreateUserByManagerDto) {
    const creatorId = req.user._id || req.user.id;
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const orgId = req.user.orgId?.toString() || req.user.orgId || companyId;
    if (!orgId && !companyId) {
      throw new ForbiddenException('User must belong to an organization or company');
    }
    const savedUser = await this.usersService.createByManager(creatorId, companyId || orgId, {
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password,
      department: createUserDto.department,
      location: createUserDto.location,
      companyId: companyId,
    });
    // Return without password - Mongoose documents have toObject() method
    const userObj = (savedUser as any).toObject ? (savedUser as any).toObject() : savedUser;
    const { password, ...userWithoutPassword } = userObj;
    return userWithoutPassword;
  }

  /**
   * Legacy endpoint - kept for backward compatibility
   * Admin only
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createUser(@Req() req, @Body() createUserDto: any) {
    const orgId = req.user.orgId?.toString() || req.user.orgId;
    if (!orgId) {
      throw new ForbiddenException('User must belong to an organization');
    }
    const savedUser = await this.usersService.create({
      email: createUserDto.email,
      password: createUserDto.password,
      name: createUserDto.name,
      orgId: orgId,
      role: createUserDto.role || UserRole.USER,
    });
    // Return without password - Mongoose documents have toObject() method
    const userObj = (savedUser as any).toObject ? (savedUser as any).toObject() : savedUser;
    const { password, ...userWithoutPassword } = userObj;
    return userWithoutPassword;
  }

  /**
   * Update user
   * Admin can update any user
   * Manager can update users they created
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.COMPANY_ADMIN)
  async updateUser(@Req() req, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const currentUser = req.user;
    const orgId = currentUser.orgId?.toString() || currentUser.orgId;
    const companyId = currentUser.companyId?.toString() || currentUser.companyId;
    const currentUserId = currentUser._id || currentUser.id;

    // Company admin path
    if (currentUser.role === UserRole.COMPANY_ADMIN) {
      if (!companyId) {
        throw new ForbiddenException('Company admin must belong to a company');
      }

      const userToUpdate = await this.usersService.findById(id);
      const targetCompanyId =
        userToUpdate.companyId?.toString() || userToUpdate.orgId?.toString();

      if (targetCompanyId !== companyId) {
        throw new ForbiddenException('You can only update users in your company');
      }

      if (
        userToUpdate.role === UserRole.COMPANY_ADMIN ||
        userToUpdate.role === UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException('You cannot modify other administrators');
      }

      if (
        updateUserDto.role &&
        ![UserRole.MANAGER, UserRole.USER].includes(updateUserDto.role as UserRole)
      ) {
        throw new ForbiddenException('Invalid role assignment');
      }

      const sanitizedUpdate: any = { ...updateUserDto };
      if (sanitizedUpdate.managerId) {
        sanitizedUpdate.managerId = new Types.ObjectId(sanitizedUpdate.managerId);
      }
      return this.usersService.update(id, sanitizedUpdate);
    }

    if (!orgId) {
      throw new ForbiddenException('User must belong to an organization');
    }

    // Ensure user is in same org
    const userToUpdate = await this.usersService.findById(id, orgId);

    // Manager can only update users they created
    if (currentUser.role === UserRole.MANAGER) {
      if (userToUpdate.createdBy?.toString() !== currentUserId?.toString()) {
        throw new ForbiddenException('You can only update users you created');
      }
      // Managers cannot change roles
      updateUserDto.role = undefined;
    }

    const sanitizedUpdate: any = { ...updateUserDto };
    if (sanitizedUpdate.managerId) {
      sanitizedUpdate.managerId = new Types.ObjectId(sanitizedUpdate.managerId);
    }

    return this.usersService.update(id, sanitizedUpdate);
  }

  /**
   * Delete user
   * Admin can delete any user
   * Manager can delete users they created
   * Company Admin can delete users within their company
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.COMPANY_ADMIN)
  async deleteUser(@Req() req, @Param('id') id: string) {
    const currentUser = req.user;
    const orgId = currentUser.orgId?.toString() || currentUser.orgId;
    const companyId = currentUser.companyId?.toString() || currentUser.companyId;

    if ((currentUser._id || currentUser.id)?.toString() === id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    // Company Admin path
    if (currentUser.role === UserRole.COMPANY_ADMIN) {
      if (!companyId) {
        throw new ForbiddenException('Company admin must belong to a company');
      }

      const userToDelete = await this.usersService.findById(id);
      const targetCompanyId =
        userToDelete.companyId?.toString() || userToDelete.orgId?.toString();

      if (targetCompanyId !== companyId) {
        throw new ForbiddenException('You can only delete users in your company');
      }

      if (
        userToDelete.role === UserRole.COMPANY_ADMIN ||
        userToDelete.role === UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException('You cannot delete other administrators');
      }

      return this.usersService.delete(id);
    }

    if (!orgId) {
      throw new ForbiddenException('User must belong to an organization');
    }

    // Ensure user is in same org
    const userToDelete = await this.usersService.findById(id, orgId);

    // Manager can only delete users they created
    if (currentUser.role === UserRole.MANAGER) {
      if (userToDelete.createdBy?.toString() !== (currentUser._id || currentUser.id)?.toString()) {
        throw new ForbiddenException('You can only delete users you created');
      }
    }

    return this.usersService.delete(id);
  }

  /**
   * Bulk create users (CSV/JSON upload)
   * POST /user/bulk
   */
  @Post('bulk')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async bulkCreateUsers(@Req() req, @Body() body: { users: Array<{ name: string; email: string; password: string; role?: UserRole; departmentId?: string }> }) {
    const creatorId = req.user._id || req.user.id;
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }
    const result = await this.usersService.bulkCreate(creatorId, companyId, body.users);
    return {
      success: true,
      created: result.created.length,
      failed: result.failed.length,
      results: result,
    };
  }

  /**
   * Get user statistics
   * GET /user/stats
   */
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getUserStats(
    @Req() req,
    @Query('role') role?: UserRole,
    @Query('department') department?: string,
    @Query('status') status?: 'active' | 'inactive',
  ) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }
    const stats = await this.usersService.getStats(companyId, { role, department, status });
    return {
      success: true,
      stats,
    };
  }

  /**
   * Disable user
   * PATCH /user/:id/disable
   */
  @Patch(':id/disable')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async disableUser(@Req() req, @Param('id') id: string) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }

    if ((req.user._id || req.user.id)?.toString() === id) {
      throw new ForbiddenException('You cannot disable your own account');
    }

    const user = await this.usersService.disableUser(id, companyId);
    const userObj: any = user.toObject ? user.toObject() : user;
    delete userObj.password;
    return {
      success: true,
      user: userObj,
    };
  }

  /**
   * Enable user
   * PATCH /user/:id/enable
   */
  @Patch(':id/enable')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async enableUser(@Req() req, @Param('id') id: string) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }

    const user = await this.usersService.enableUser(id, companyId);
    const userObj: any = user.toObject ? user.toObject() : user;
    delete userObj.password;
    return {
      success: true,
      user: userObj,
    };
  }

  /**
   * Assign department to user
   * PATCH /user/:id/assign-department
   */
  @Patch(':id/assign-department')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async assignDepartment(@Req() req, @Param('id') id: string, @Body() body: { departmentId?: string }) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }

    const user = await this.usersService.assignDepartment(id, body.departmentId, companyId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const userObj: any = user.toObject ? user.toObject() : user;
    delete userObj.password;
    return {
      success: true,
      user: userObj,
    };
  }

  /**
   * Assign manager to user
   * PATCH /user/:id/assign-manager
   */
  @Patch(':id/assign-manager')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async assignManager(@Req() req, @Param('id') id: string, @Body() body: { managerId?: string }) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }

    const user = await this.usersService.assignManager(id, body.managerId, companyId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const userObj: any = user.toObject ? user.toObject() : user;
    delete userObj.password;
    return {
      success: true,
      user: userObj,
    };
  }

  // ========== USER TASKS ==========
  /**
   * Get tasks assigned to the current user
   * GET /user/tasks
   */
  @Get('tasks')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER, UserRole.EDITOR, UserRole.VIEWER)
  async getMyTasks(
    @Req() req,
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
  ) {
    const user = req.user;
    const userId = user._id || user.id;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }

    return {
      success: true,
      data: await this.userTasksService.getMyTasks(userId, companyId, { status, projectId }),
    };
  }

  /**
   * Get task details
   * GET /user/tasks/:id
   */
  @Get('tasks/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER, UserRole.EDITOR, UserRole.VIEWER)
  async getMyTask(@Param('id') id: string, @Req() req) {
    const user = req.user;
    const userId = user._id || user.id;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }

    return {
      success: true,
      data: await this.userTasksService.getTaskDetails(id, userId, companyId),
    };
  }

  /**
   * Update task status (user can only update their own tasks)
   * PATCH /user/tasks/:id/status
   */
  @Patch('tasks/:id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER, UserRole.EDITOR)
  async updateTaskStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req,
  ) {
    const user = req.user;
    const userId = user._id || user.id;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }

    return {
      success: true,
      data: await this.userTasksService.updateTaskStatus(id, body.status, userId, companyId),
    };
  }

  /**
   * Add comment to task
   * POST /user/tasks/:id/comment
   */
  @Post('tasks/:id/comment')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER, UserRole.EDITOR, UserRole.VIEWER)
  async addTaskComment(
    @Param('id') id: string,
    @Body() body: { comment: string },
    @Req() req,
  ) {
    const user = req.user;
    const userId = user._id || user.id;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }

    return {
      success: true,
      data: await this.userTasksService.addComment(id, userId, body.comment, companyId),
    };
  }

  /**
   * Add attachment to task
   * POST /user/tasks/:id/attachment
   */
  @Post('tasks/:id/attachment')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER, UserRole.EDITOR)
  async addTaskAttachment(
    @Param('id') id: string,
    @Body() body: { filename: string; url: string; size?: number; mimeType?: string },
    @Req() req,
  ) {
    const user = req.user;
    const userId = user._id || user.id;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }

    return {
      success: true,
      data: await this.userTasksService.addAttachment(id, userId, body, companyId),
    };
  }

  // ========== USER PROJECTS ==========
  /**
   * Get projects user is involved in
   * GET /user/projects
   */
  @Get('projects')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER, UserRole.EDITOR, UserRole.VIEWER)
  async getMyProjects(@Req() req) {
    const user = req.user;
    const userId = user._id || user.id;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }

    return {
      success: true,
      data: await this.userProjectsService.getMyProjects(userId, companyId),
    };
  }

  /**
   * Get project details
   * GET /user/projects/:id
   */
  @Get('projects/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER, UserRole.EDITOR, UserRole.VIEWER)
  async getMyProject(@Param('id') id: string, @Req() req) {
    const user = req.user;
    const userId = user._id || user.id;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }

    return {
      success: true,
      data: await this.userProjectsService.getProjectDetails(id, userId, companyId),
    };
  }

  // ========== USER STATS ==========
  /**
   * Get user stats overview
   * GET /user/stats/overview
   */
  @Get('stats/overview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER, UserRole.EDITOR, UserRole.VIEWER)
  async getMyStatsOverview(@Req() req) {
    const user = req.user;
    const userId = user._id || user.id;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }

    return {
      success: true,
      data: await this.userStatsService.getOverview(userId, companyId),
    };
  }

  /**
   * Get user productivity stats
   * GET /user/stats/productivity
   */
  @Get('stats/productivity')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER, UserRole.EDITOR, UserRole.VIEWER)
  async getMyProductivity(@Req() req) {
    const user = req.user;
    const userId = user._id || user.id;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }

    return {
      success: true,
      data: await this.userStatsService.getProductivity(userId, companyId),
    };
  }
}
