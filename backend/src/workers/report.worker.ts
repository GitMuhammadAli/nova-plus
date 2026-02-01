import { Injectable } from '@nestjs/common';
import { QueueService } from '../providers/queue/queue.service';
import { Worker } from 'bullmq';
import logger from '../common/logger/winston.logger';

@Injectable()
export class ReportWorker {
  private worker: Worker | null = null;

  constructor(
    private readonly queueService: QueueService,
    private readonly concurrency: number,
  ) {}

  async start() {
    const redisClient = this.queueService.getRedisClient();

    this.worker = new Worker(
      'nova-report',
      async (job) => {
        const { reportType, companyId, userId, params } = job.data;

        logger.info('Processing report job', {
          jobId: job.id,
          reportType,
          companyId,
          attempt: job.attemptsMade + 1,
        });

        try {
          // Report generation logic would go here
          // For now, just log and return success
          logger.info('Report generated', {
            jobId: job.id,
            reportType,
            companyId,
          });

          return {
            success: true,
            reportType,
            generatedAt: new Date().toISOString(),
          };
        } catch (error: any) {
          logger.error('Report job failed', {
            jobId: job.id,
            reportType,
            error: error.message,
            stack: error.stack,
          });
          throw error;
        }
      },
      {
        connection: redisClient.options,
        concurrency: this.concurrency,
        removeOnComplete: {
          count: 100,
          age: 24 * 3600,
        },
        removeOnFail: {
          count: 1000,
        },
      },
    );

    this.worker.on('completed', (job) => {
      logger.info('Report job completed', { jobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      logger.error('Report job failed', {
        jobId: job?.id,
        error: err.message,
        attemptsMade: job?.attemptsMade,
      });
    });

    this.worker.on('error', (err) => {
      logger.error('Report worker error', { error: err.message });
    });

    logger.info('Report worker started', { concurrency: this.concurrency });
  }

  async stop() {
    if (this.worker) {
      await this.worker.close();
      logger.info('Report worker stopped');
    }
  }
}
