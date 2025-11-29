import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() createWebhookDto: CreateWebhookDto, @Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new Error('User must belong to a company');
    }

    const webhook = await this.webhookService.create(
      createWebhookDto,
      companyId,
      user._id || user.id,
    );

    return {
      success: true,
      webhook,
    };
  }

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async findAll(@Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new Error('User must belong to a company');
    }

    const webhooks = await this.webhookService.findAll(companyId);

    return {
      success: true,
      webhooks,
    };
  }

  @Get(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async findOne(@Param('id') id: string, @Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new Error('User must belong to a company');
    }

    const webhook = await this.webhookService.findOne(id, companyId);

    return {
      success: true,
      webhook,
    };
  }

  @Patch(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
    @Req() req,
  ) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new Error('User must belong to a company');
    }

    const webhook = await this.webhookService.update(id, updateWebhookDto, companyId);

    return {
      success: true,
      webhook,
    };
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async remove(@Param('id') id: string, @Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new Error('User must belong to a company');
    }

    await this.webhookService.remove(id, companyId);

    return {
      success: true,
      message: 'Webhook deleted successfully',
    };
  }

  @Post(':id/test')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async testWebhook(@Param('id') id: string, @Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new Error('User must belong to a company');
    }

    const result = await this.webhookService.testWebhook(id, companyId);

    return result;
  }

  @Get(':id/logs')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getLogs(@Param('id') id: string, @Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    if (!companyId) {
      throw new Error('User must belong to a company');
    }

    const logs = await this.webhookService.getLogs(id, companyId);

    return {
      success: true,
      logs,
    };
  }
}

