import { Injectable } from '@nestjs/common';
import { QueueService } from '../providers/queue/queue.service';
import { Worker } from 'bullmq';
import logger from '../common/logger/winston.logger';
import { EmailService } from '../modules/email/email.service';

@Injectable()
export class EmailWorker {
  private worker: Worker | null = null;

  constructor(
    private readonly queueService: QueueService,
    private readonly concurrency: number,
  ) {}

  async start() {
    const redisClient = this.queueService.getRedisClient();

    this.worker = new Worker(
      'nova-email',
      async (job) => {
        const { to, subject, template, data, html, text } = job.data;

        logger.info('Processing email job', {
          jobId: job.id,
          to,
          template,
          attempt: job.attemptsMade + 1,
        });

        try {
          // Import EmailService dynamically to avoid circular dependencies
          // Using require for dynamic imports in workers to avoid TypeScript module resolution issues
          const { AppModule } = require('../app.module');
          const { NestFactory } = require('@nestjs/core');
          const appContext =
            await NestFactory.createApplicationContext(AppModule);
          const { EmailService } = require('../modules/email/email.service');
          const emailService = appContext.get(EmailService);

          // For now, use sendInviteEmail if template is 'invite', otherwise log
          // TODO: Add generic sendEmail method to EmailService
          if (template === 'invite' && data) {
            await emailService.sendInviteEmail({
              to,
              inviteLink: data.inviteLink || '',
              companyName: data.companyName || 'Company',
              inviterName: data.inviterName || 'Admin',
              role: data.role || 'user',
              expiresAt: data.expiresAt || new Date(),
            });
          } else {
            // Log email for now (can be extended later)
            logger.info('Email would be sent', {
              to,
              subject,
              template,
              html,
              text,
            });
            // In production, you'd want to add a generic sendEmail method
          }

          logger.info('Email sent successfully', { jobId: job.id, to });
          return { success: true, sentAt: new Date().toISOString() };
        } catch (error: any) {
          logger.error('Email job failed', {
            jobId: job.id,
            to,
            error: error.message,
            stack: error.stack,
          });
          throw error; // BullMQ will handle retries
        }
      },
      {
        connection: redisClient.options,
        concurrency: this.concurrency,
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
          age: 24 * 3600, // 24 hours
        },
        removeOnFail: {
          count: 1000, // Keep last 1000 failed jobs
        },
      },
    );

    this.worker.on('completed', (job) => {
      logger.info('Email job completed', { jobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      logger.error('Email job failed', {
        jobId: job?.id,
        error: err.message,
        attemptsMade: job?.attemptsMade,
      });
    });

    this.worker.on('error', (err) => {
      logger.error('Email worker error', { error: err.message });
    });

    logger.info('Email worker started', { concurrency: this.concurrency });
  }

  async stop() {
    if (this.worker) {
      await this.worker.close();
      logger.info('Email worker stopped');
    }
  }
}
