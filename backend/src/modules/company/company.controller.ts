import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, ForbiddenException, Res } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/modules/user/entities/user.entity';
import type { Response } from 'express';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

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
      message: 'Company registered successfully',
      company: result.company,
      admin: result.admin,
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
    return this.companyService.getCompanyUsers(id, requestUserId, requestUserRole);
  }

  /**
   * Get company by ID (Super Admin or Company Admin)
   * GET /company/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getCompany(@Param('id') id: string, @Req() req) {
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
    return this.companyService.update(id, updateData, requestUserId, requestUserRole);
  }
}

