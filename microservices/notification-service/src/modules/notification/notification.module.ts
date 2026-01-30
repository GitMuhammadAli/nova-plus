import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EmailService } from './providers/email.service';
import { SmsService } from './providers/sms.service';
import { PushService } from './providers/push.service';
import { TemplateService } from './template.service';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    EmailService,
    SmsService,
    PushService,
    TemplateService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}

