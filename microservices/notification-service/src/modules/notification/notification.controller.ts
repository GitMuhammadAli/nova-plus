import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationService, NotificationRequest } from './notification.service';

@ApiTags('Notifications')
@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a notification' })
  async send(@Body() request: NotificationRequest) {
    return this.notificationService.send(request);
  }

  @Post('send-bulk')
  @ApiOperation({ summary: 'Send bulk notifications' })
  async sendBulk(@Body() requests: NotificationRequest[]) {
    return this.notificationService.sendBulk(requests);
  }
}

