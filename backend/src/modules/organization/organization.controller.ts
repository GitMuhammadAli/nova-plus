import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  /**
   * Create organization (public - initial setup)
   * Creates org + admin user
   */
  @Post('create')
  async createOrganization(@Body() createOrgDto: CreateOrganizationDto) {
    return this.orgService.create(createOrgDto);
  }

  /**
   * Get current user's organization
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyOrganization(@Req() req) {
    const orgId = req.user.orgId;
    if (!orgId) {
      throw new Error('User does not belong to an organization');
    }
    return this.orgService.getMyOrganization(orgId);
  }

  /**
   * Get organization by ID (admin only)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getOrganization(@Param('id') id: string, @Req() req) {
    // Ensure admin can only view their own org
    if (req.user.orgId?.toString() !== id) {
      throw new Error('You can only view your own organization');
    }
    return this.orgService.findById(id);
  }

  /**
   * Update organization (admin only)
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateOrganization(@Req() req, @Body() updateData: any) {
    const orgId = req.user.orgId;
    if (!orgId) {
      throw new Error('User does not belong to an organization');
    }
    return this.orgService.update(orgId.toString(), updateData);
  }

  /**
   * Add member to organization (admin only)
   */
  @Post(':id/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async addMember(@Param('id') orgId: string, @Body() body: { userId: string }, @Req() req) {
    // Ensure admin can only add members to their own org
    if (req.user.orgId?.toString() !== orgId) {
      throw new Error('You can only add members to your own organization');
    }
    return this.orgService.addMember(orgId, body.userId);
  }
}

