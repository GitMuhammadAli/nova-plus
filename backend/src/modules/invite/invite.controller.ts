import { Controller, Get, Post, Param, Body, Delete, UseGuards, Req, Res } from '@nestjs/common';
import { InviteService } from './invite.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';

@Controller('invite')
export class InviteController {
  constructor(
    private readonly inviteService: InviteService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Create invite for a company (Company Admin or Manager)
   * POST /company/:companyId/invite
   */
  @Post('company/:companyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER)
  async createInvite(
    @Param('companyId') companyId: string,
    @Body() createInviteDto: CreateInviteDto,
    @Req() req,
  ) {
    const creatorId = req.user._id || req.user.id;
    const creatorRole = req.user.role;
    // Use companyId from user session if available, otherwise use param
    const userCompanyId = req.user.companyId?.toString() || companyId;
    const result = await this.inviteService.createInvite(userCompanyId, creatorId, creatorRole, createInviteDto);
    // Return in format that TransformInterceptor will wrap
    return result;
  }

  /**
   * Get invite details by token (public - for validation)
   * GET /invite/:token
   */
  @Get(':token')
  async getInvite(@Param('token') token: string) {
    const invite = await this.inviteService.getInviteByToken(token);
    return {
      invite: {
        _id: invite._id,
        email: invite.email,
        role: invite.role,
        company: invite.companyId,
        createdBy: invite.createdBy,
        expiresAt: invite.expiresAt,
      },
    };
  }

  /**
   * Accept invite and create user account (public)
   * POST /invite/:token/accept
   */
  @Post(':token/accept')
  async acceptInvite(
    @Param('token') token: string,
    @Body() acceptInviteDto: AcceptInviteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.inviteService.acceptInvite(token, acceptInviteDto);

    // Generate JWT tokens for the user (new or existing)
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

    // Set auth cookies (always set, even for existing users)
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      success: true,
      message: result.alreadyExists 
        ? 'You are already registered. Logging you in...' 
        : 'Invite accepted successfully',
      user: result.user,
      company: result.company,
    };
  }

  /**
   * Get all invites for a company (Company Admin only)
   * GET /invite/company/:companyId
   */
  @Get('company/:companyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async getCompanyInvites(@Param('companyId') companyId: string, @Req() req) {
    const requestUserId = req.user._id || req.user.id;
    const requestUserRole = req.user.role;
    const invites = await this.inviteService.getCompanyInvites(companyId, requestUserId, requestUserRole);
    // Return invites array directly - TransformInterceptor will wrap it in { success: true, data: invites }
    return invites;
  }

  /**
   * Revoke an invite (Company Admin only)
   * DELETE /invite/:inviteId/company/:companyId
   */
  @Delete(':inviteId/company/:companyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async revokeInvite(
    @Param('inviteId') inviteId: string,
    @Param('companyId') companyId: string,
    @Req() req,
  ) {
    const requestUserId = req.user._id || req.user.id;
    const requestUserRole = req.user.role;
    return this.inviteService.revokeInvite(inviteId, companyId, requestUserId, requestUserRole);
  }

  /**
   * Resend an invite (Company Admin only)
   * POST /invite/:inviteId/resend
   */
  @Post(':inviteId/resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async resendInvite(
    @Param('inviteId') inviteId: string,
    @Req() req,
  ) {
    const requestUserId = req.user._id || req.user.id;
    const requestUserRole = req.user.role;
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    return this.inviteService.resendInvite(inviteId, companyId, requestUserId, requestUserRole);
  }

  /**
   * Cancel an invite (Company Admin only)
   * POST /invite/:inviteId/cancel
   */
  @Post(':inviteId/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async cancelInvite(
    @Param('inviteId') inviteId: string,
    @Req() req,
  ) {
    const requestUserId = req.user._id || req.user.id;
    const requestUserRole = req.user.role;
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    return this.inviteService.cancelInvite(inviteId, companyId, requestUserId, requestUserRole);
  }

  /**
   * Bulk create invites (Company Admin only)
   * POST /invite/bulk
   */
  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async bulkCreateInvites(
    @Body() body: { companyId: string; invites: Array<{ email?: string; role: string; expiresInDays?: number }> },
    @Req() req,
  ) {
    const creatorId = req.user._id || req.user.id;
    const creatorRole = req.user.role;
    return this.inviteService.bulkCreateInvites(body.companyId, creatorId, creatorRole, body.invites);
  }
}

