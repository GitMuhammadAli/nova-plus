import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
  Res,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { InviteService } from '../invite/invite.service';
import { JwtService } from '@nestjs/jwt';
import { CreateInviteDto } from '../invite/dto/create-invite.dto';
import { AcceptInviteDto } from '../invite/dto/accept-invite.dto';
import type { Response } from 'express';

@Controller('company')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    @Inject(forwardRef(() => InviteService))
    private readonly inviteService: InviteService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Public company registration - creates company + admin user (CEO)
   * POST /company/register
   */
  @Post('register')
  async registerCompany(
    @Body() registerCompanyDto: RegisterCompanyDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.companyService.register(registerCompanyDto);
    // Set auth cookies for the newly created admin user
    if (result.tokens) {
      res.cookie('access_token', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
      res.cookie('refresh_token', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }
    return {
      success: true,
      message: 'Company and Admin created successfully',
      token: result.tokens?.accessToken,
      data: {
        company: {
          _id: result.company._id,
          name: result.company.name,
        },
        user: {
          _id: result.admin._id,
          email: result.admin.email,
          role: result.admin.role,
        },
      },
    };
  }

  /**
   * Create company (Super Admin only)
   * POST /company/create
   */
  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async createCompany(@Body() createCompanyDto: CreateCompanyDto, @Req() req) {
    const createdBy = req.user._id || req.user.id;
    return this.companyService.create(createCompanyDto, createdBy);
  }

  /**
   * Get all companies (Super Admin only)
   * GET /company/all
   */
  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async getAllCompanies() {
    return this.companyService.findAll();
  }

  /**
   * Create invite for a company (Company Admin or Manager)
   * POST /company/invite
   * NOTE: Must come before /company/:id routes to avoid route conflicts
   */
  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  async createInvite(@Body() createInviteDto: CreateInviteDto, @Req() req) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }
    const creatorId = req.user._id || req.user.id;
    const creatorRole = req.user.role;

    const result = await this.inviteService.createInvite(
      companyId,
      creatorId,
      creatorRole,
      createInviteDto,
    );
    return {
      success: true,
      inviteToken: result.token || result.invite.token,
      inviteLink: result.inviteLink || result.invite.inviteLink,
      invite: {
        _id: result.invite._id,
        email: result.invite.email,
        role: result.invite.role,
        expiresAt: result.invite.expiresAt,
      },
    };
  }

  /**
   * Join company via invite token (Public)
   * POST /company/join
   * NOTE: Must come before /company/:id routes to avoid route conflicts
   */
  @Post('join')
  async joinCompany(
    @Body()
    joinDto: {
      email: string;
      password: string;
      name?: string;
      inviteToken: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const acceptInviteDto: AcceptInviteDto = {
      email: joinDto.email,
      name: joinDto.name || joinDto.email.split('@')[0],
      password: joinDto.password,
    };

    const result = await this.inviteService.acceptInvite(
      joinDto.inviteToken,
      acceptInviteDto,
    );

    // Generate JWT tokens
    const userId = result.user._id?.toString() || result.user._id;
    const payload = {
      sub: userId,
      email: result.user.email,
      role: result.user.role,
      companyId: result.user.companyId,
      orgId: result.user.companyId,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Set auth cookies
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'User joined company successfully',
      data: {
        companyId: result.user.companyId,
        role: result.user.role,
      },
    };
  }

  /**
   * Get all users in a company (Company Admin only)
   * GET /company/:id/users
   * Note: This route must come before /company/:id to avoid route conflicts
   */
  @Get(':id/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async getCompanyUsers(@Param('id') id: string, @Req() req) {
    const requestUserId = req.user._id || req.user.id;
    const requestUserRole = req.user.role;
    return this.companyService.getCompanyUsers(
      id,
      requestUserId,
      requestUserRole,
    );
  }

  /**
   * Get company by ID (Super Admin or Company Admin)
   * GET /company/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getCompany(@Param('id') id: string, @Req() req) {
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔵 Company Controller - getCompany:', {
        companyId: id,
        userId: req.user?._id || req.user?.id,
        userRole: req.user?.role,
        hasUser: !!req.user,
      });
    }

    const requestUserId = req.user._id || req.user.id;
    const requestUserRole = req.user.role;
    return this.companyService.findById(id, requestUserId, requestUserRole);
  }

  /**
   * Update company info
   * PATCH /company/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async updateCompany(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateCompanyDto>,
    @Req() req,
  ) {
    const requestUserId = req.user._id || req.user.id;
    const requestUserRole = req.user.role;
    return this.companyService.update(
      id,
      updateData,
      requestUserId,
      requestUserRole,
    );
  }

  /**
   * Get company statistics
   * GET /company/:id/stats
   */
  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getCompanyStats(@Param('id') id: string, @Req() req) {
    const requestUserId = req.user._id || req.user.id;
    const requestUserRole = req.user.role;
    const stats = await this.companyService.getCompanyStats(
      id,
      requestUserId,
      requestUserRole,
    );
    return {
      success: true,
      stats,
    };
  }

  /**
   * Get company activity (last 30 actions)
   * GET /company/:id/activity
   */
  @Get(':id/activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getCompanyActivity(@Param('id') id: string, @Req() req) {
    const requestUserId = req.user._id || req.user.id;
    const requestUserRole = req.user.role;
    const activity = await this.companyService.getCompanyActivity(
      id,
      requestUserId,
      requestUserRole,
    );
    return {
      success: true,
      activity,
    };
  }

  /**
   * Get company profile with details
   * GET /company/:id/profile
   */
  @Get(':id/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getCompanyProfile(@Param('id') id: string, @Req() req) {
    const requestUserId = req.user._id || req.user.id;
    const requestUserRole = req.user.role;
    const profile = await this.companyService.getCompanyProfile(
      id,
      requestUserId,
      requestUserRole,
    );
    return {
      success: true,
      profile,
    };
  }
}
