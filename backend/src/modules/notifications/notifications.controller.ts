import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Req() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.findByUser(
      req.user._id.toString(),
      page || 1,
      limit || 20,
    );
  }

  @Get('unread-count')
  getUnreadCount(@Req() req) {
    return this.notificationsService
      .getUnreadCount(req.user._id.toString())
      .then((count) => ({ count }));
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req) {
    return this.notificationsService.markAsRead(id, req.user._id.toString());
  }

  @Patch('read-all')
  markAllAsRead(@Req() req) {
    return this.notificationsService.markAllAsRead(req.user._id.toString());
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req) {
    return this.notificationsService.delete(id, req.user._id.toString());
  }
}
