import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import * as nodemailer from 'nodemailer';
import logger from '../../../common/logger';

@Injectable()
export class EmailService {
  private sesClient: SESClient | null = null;
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  private initialize() {
    const provider = this.configService.get<string>('email.provider', 'ses');

    if (provider === 'ses') {
      const region = this.configService.get<string>('aws.ses.region', 'us-east-1');
      this.sesClient = new SESClient({ region });
    } else if (provider === 'mailtrap' || provider === 'smtp') {
      const mailtrap = this.configService.get('email.mailtrap');
      this.transporter = nodemailer.createTransport({
        host: mailtrap.host,
        port: mailtrap.port,
        auth: {
          user: mailtrap.user,
          pass: mailtrap.pass,
        },
      });
    }
  }

  async send(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ messageId: string }> {
    const provider = this.configService.get<string>('email.provider', 'ses');
    const from = this.configService.get<string>('email.from', 'noreply@novapulse.com');
    const fromName = this.configService.get<string>('email.fromName', 'NovaPulse');

    try {
      if (provider === 'ses' && this.sesClient) {
        const command = new SendEmailCommand({
          Source: `${fromName} <${from}>`,
          Destination: {
            ToAddresses: [options.to],
          },
          Message: {
            Subject: {
              Data: options.subject,
              Charset: 'UTF-8',
            },
            Body: {
              Html: {
                Data: options.html,
                Charset: 'UTF-8',
              },
              ...(options.text && {
                Text: {
                  Data: options.text,
                  Charset: 'UTF-8',
                },
              }),
            },
          },
        });

        const response = await this.sesClient.send(command);
        return { messageId: response.MessageId || '' };
      } else if (this.transporter) {
        const info = await this.transporter.sendMail({
          from: `${fromName} <${from}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });

        return { messageId: info.messageId };
      } else {
        throw new Error('Email provider not configured');
      }
    } catch (error) {
      logger.error('Email send failed', { error: error.message, to: options.to });
      throw error;
    }
  }
}

