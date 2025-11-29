import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../modules/user/entities/user.entity';
import { QueueService } from './queue.service';

@Controller('queue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('stats')
  async getStats() {
    const stats = await this.queueService.getQueueStats();
    return {
      success: true,
      stats,
    };
  }
}

