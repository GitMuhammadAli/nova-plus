import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './providers/email.service';
import { SmsService } from './providers/sms.service';
import { PushService } from './providers/push.service';
import { TemplateService } from './template.service';
import logger from '../../common/logger';

export interface NotificationRequest {
  type: 'email' | 'sms' | 'push' | 'in-app';
  recipient: string;
  template: string;
  data: Record<string, any>;
  tenantId?: string;
  userId?: string;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushService: PushService,
    private readonly templateService: TemplateService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send notification via specified channel
   */
  async send(notification: NotificationRequest): Promise<{ success: boolean; messageId?: string }> {
    try {
      logger.info('Sending notification', {
        type: notification.type,
        recipient: notification.recipient,
        template: notification.template,
      });

      // Render template
      const content = await this.templateService.render(
        notification.template,
        notification.data,
      );

      let result;

      switch (notification.type) {
        case 'email':
          result = await this.emailService.send({
            to: notification.recipient,
            subject: content.subject,
            html: content.html,
            text: content.text,
          });
          break;

        case 'sms':
          result = await this.smsService.send({
            to: notification.recipient,
            message: content.text || content.message,
          });
          break;

        case 'push':
          result = await this.pushService.send({
            to: notification.recipient,
            title: content.title,
            body: content.body,
            data: notification.data,
          });
          break;

        default:
          throw new Error(`Unsupported notification type: ${notification.type}`);
      }

      logger.info('Notification sent successfully', {
        type: notification.type,
        recipient: notification.recipient,
        messageId: result.messageId,
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send notification', {
        error: error.message,
        notification,
      });

      return { success: false };
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulk(notifications: NotificationRequest[]): Promise<{
    success: number;
    failed: number;
    results: Array<{ success: boolean; recipient: string }>;
  }> {
    const results = await Promise.allSettled(
      notifications.map((n) => this.send(n)),
    );

    const success = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - success;

    return {
      success,
      failed,
      results: notifications.map((n, i) => ({
        success: results[i].status === 'fulfilled' && results[i].value.success,
        recipient: n.recipient,
      })),
    };
  }
}

