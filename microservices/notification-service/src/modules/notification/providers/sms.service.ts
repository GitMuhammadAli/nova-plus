import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import logger from '../../../common/logger';

@Injectable()
export class SmsService {
  private snsClient: SNSClient | null = null;

  constructor(private readonly configService: ConfigService) {
    const provider = this.configService.get<string>('sms.provider', 'sns');
    if (provider === 'sns') {
      const region = this.configService.get<string>('aws.sns.region', 'us-east-1');
      this.snsClient = new SNSClient({ region });
    }
  }

  async send(options: { to: string; message: string }): Promise<{ messageId: string }> {
    try {
      if (this.snsClient) {
        const command = new PublishCommand({
          PhoneNumber: options.to,
          Message: options.message,
        });

        const response = await this.snsClient.send(command);
        return { messageId: response.MessageId || '' };
      } else {
        // Fallback: log SMS (for development)
        logger.info('SMS would be sent', { to: options.to, message: options.message });
        return { messageId: `dev_${Date.now()}` };
      }
    } catch (error) {
      logger.error('SMS send failed', { error: error.message, to: options.to });
      throw error;
    }
  }
}

