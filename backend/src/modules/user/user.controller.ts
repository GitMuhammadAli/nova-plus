import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from "src/modules/user/entities/user.entity";
import { UsersService } from './user.service';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { CreateUserByManagerDto } from './dto/create-user-by-manager.dto';

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
   * Admin: Get all users in the system
   */
  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const params = {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    };
    return this.usersService.findAllForAdmin(params);
  }

  /**
   * Manager: Get all users created by the logged-in manager
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
    const params = {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    };
    return this.usersService.findUsersByManager(managerId, params);
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

    // Admin sees all users
    if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPERADMIN) {
      return this.usersService.findAllForAdmin(params);
    }

    // Manager sees only their users
    if (currentUser.role === UserRole.MANAGER) {
      const managerId = currentUser._id || currentUser.id;
      return this.usersService.findUsersByManager(managerId, params);
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
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * Admin: Create Managers or Users
   */
  @Post('create-by-admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createUserByAdmin(@Req() req, @Body() createUserDto: CreateUserByAdminDto) {
    const creatorId = req.user._id || req.user.id;
    const savedUser = await this.usersService.createByAdmin(creatorId, {
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password,
      role: createUserDto.role,
      managerId: createUserDto.managerId,
    });
    // Return without password
    const { password, ...userWithoutPassword } = savedUser.toObject();
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
    const savedUser = await this.usersService.createByManager(creatorId, {
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password,
      department: createUserDto.department,
      location: createUserDto.location,
    });
    // Return without password
    const { password, ...userWithoutPassword } = savedUser.toObject();
    return userWithoutPassword;
  }

  /**
   * Legacy endpoint - kept for backward compatibility
   * Admin only
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createUser(@Body() createUserDto: any) {
    const savedUser = await this.usersService.create(
      createUserDto.email,
      createUserDto.password,
      createUserDto.name,
    );
    // Return without password
    const { password, ...userWithoutPassword } = savedUser.toObject();
    return userWithoutPassword;
  }

  /**
   * Update user
   * Admin can update any user
   * Manager can update users they created
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateUser(@Req() req, @Param('id') id: string, @Body() updateUserDto: any) {
    const currentUser = req.user;
    const userToUpdate = await this.usersService.findById(id);

    // Manager can only update users they created
    if (currentUser.role === UserRole.MANAGER) {
      if (userToUpdate.createdBy?.toString() !== (currentUser._id || currentUser.id)?.toString()) {
        throw new ForbiddenException('You can only update users you created');
      }
    }

    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Delete user
   * Admin can delete any user
   * Manager can delete users they created
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async deleteUser(@Req() req, @Param('id') id: string) {
    const currentUser = req.user;
    const userToDelete = await this.usersService.findById(id);

    // Manager can only delete users they created
    if (currentUser.role === UserRole.MANAGER) {
      if (userToDelete.createdBy?.toString() !== (currentUser._id || currentUser.id)?.toString()) {
        throw new ForbiddenException('You can only delete users you created');
      }
    }

    return this.usersService.delete(id);
  }
}
