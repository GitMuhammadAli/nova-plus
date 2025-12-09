import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { UsersService } from './user.service';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';

/**
 * Users Controller - Handles /users/* routes
 * This is a separate controller to avoid conflicts with /user/* routes
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Company Admin: Create Managers or Users
   * POST /users/create
   */
  @Post('create')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN)
  async createUser(@Req() req, @Body() createUserDto: CreateUserByAdminDto) {
    const creatorId = req.user._id || req.user.id;
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }
    const savedUser = await this.usersService.createByAdmin(creatorId, companyId, {
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password,
      role: createUserDto.role,
      managerId: createUserDto.managerId,
      companyId: companyId,
    });
    // Return without password
    const userObj = (savedUser as any).toObject ? (savedUser as any).toObject() : savedUser;
    const { password, ...userWithoutPassword } = userObj;
    return {
      success: true,
      user: userWithoutPassword,
    };
  }

  /**
   * Company Admin / Manager: Get all users in the company
   * GET /users/all
   */
  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getAllUsers(
    @Req() req,
  ) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }
    const result = await this.usersService.findAllForCompany(companyId, {});
    // Format response to match expected format - return array of users
    let users: any[] = [];
    if (Array.isArray(result)) {
      users = result;
    } else if (result && (result as any).data) {
      users = (result as any).data;
    }
    
    return users.map((user: any) => ({
      email: user.email,
      role: user.role,
      name: user.name,
      _id: user._id,
    }));
  }

  /**
   * Company Admin: Bulk upload users
   * POST /users/bulk-upload
   */
  @Post('bulk-upload')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN)
  async bulkUpload(@Req() req, @Body() body: { users: Array<{ name: string; email: string; password: string; role?: UserRole; departmentId?: string }> }) {
    const creatorId = req.user._id || req.user.id;
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }
    const result = await this.usersService.bulkCreate(creatorId, companyId, body.users);
    return {
      success: true,
      created: result.created,
      failed: result.failed,
      total: body.users.length,
    };
  }

  /**
   * Company Admin: Assign user to department
   * PATCH /users/:id/assign-department
   */
  @Patch(':id/assign-department')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN)
  async assignDepartment(@Req() req, @Param('id') id: string, @Body() body: { departmentId?: string }) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }
    const user = await this.usersService.assignDepartment(id, body.departmentId, companyId);
    const userObj = (user as any).toObject ? (user as any).toObject() : user;
    const { password, ...userWithoutPassword } = userObj;
    return {
      success: true,
      user: userWithoutPassword,
    };
  }

  /**
   * Company Admin: Assign manager to user
   * PATCH /users/:id/assign-manager
   */
  @Patch(':id/assign-manager')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN)
  async assignManager(@Req() req, @Param('id') id: string, @Body() body: { managerId?: string }) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }
    const user = await this.usersService.assignManager(id, body.managerId, companyId);
    const userObj = (user as any).toObject ? (user as any).toObject() : user;
    const { password, ...userWithoutPassword } = userObj;
    return {
      success: true,
      user: userWithoutPassword,
    };
  }

  /**
   * Company Admin / Manager: Get user statistics
   * GET /users/stats
   */
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getStats(@Req() req) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }
    const stats = await this.usersService.getStats(companyId);
    return {
      success: true,
      stats,
    };
  }
}

