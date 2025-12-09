import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationType } from './entities/integration.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  /**
   * Test email integration
   * POST /integrations/email/test
   */
  @Post('email/test')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async testEmail(
    @Body() body: { smtpHost: string; smtpPort: number; username: string; password: string; to: string },
    @Req() req: any,
  ) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const userId = req.user._id?.toString() || req.user.id;

    return this.integrationsService.testEmail(companyId, userId, body);
  }

  /**
   * Test Slack integration
   * POST /integrations/slack/test
   */
  @Post('slack/test')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async testSlack(
    @Body() body: { webhookUrl: string },
    @Req() req: any,
  ) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const userId = req.user._id?.toString() || req.user.id;

    return this.integrationsService.testSlack(companyId, userId, body);
  }

  /**
   * Start Google OAuth flow
   * GET /integrations/oauth/google/start
   */
  @Get('oauth/google/start')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async startGoogleOAuth(@Req() req: any) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const userId = req.user._id?.toString() || req.user.id;

    return this.integrationsService.startGoogleOAuth(companyId, userId);
  }

  /**
   * Handle Google OAuth callback
   * GET /integrations/oauth/google/callback
   */
  @Get('oauth/google/callback')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async handleGoogleOAuthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: any,
  ) {
    // Decode state to get companyId and userId
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const companyId = stateData.companyId || req.user.companyId?.toString() || req.user.companyId;
    const userId = stateData.userId || req.user._id?.toString() || req.user.id;

    return this.integrationsService.handleGoogleOAuthCallback(companyId, userId, code);
  }

  /**
   * Get all integrations
   * GET /integrations
   */
  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async findAll(@Req() req: any) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const integrations = await this.integrationsService.findAll(companyId);
    return {
      success: true,
      data: integrations,
    };
  }

  /**
   * Delete integration
   * DELETE /integrations/:id
   */
  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async remove(@Param('id') id: string, @Req() req: any) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const userId = req.user._id?.toString() || req.user.id;

    await this.integrationsService.remove(companyId, id, userId);
    return {
      success: true,
      message: 'Integration deleted successfully',
    };
  }
}

