import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from "src/modules/user/entities/user.entity";
import { UsersService } from './user.service';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { CreateUserByManagerDto } from './dto/create-user-by-manager.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Types } from 'mongoose';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly usersService: UsersService) {}

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
  ) {
    const currentUser = req.user;
    const params = {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
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
}
