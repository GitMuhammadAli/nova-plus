import { Injectable } from '@nestjs/common';
import { Worker } from 'bullmq';
import { QueueService } from '../providers/queue/queue.service';
import logger from '../common/logger/winston.logger';

@Injectable()
export class UploadCleanerWorker {
  private worker: Worker | null = null;

  constructor(private readonly queueService: QueueService) {}

  async start() {
    const redisClient = this.queueService.getRedisClient();

    this.worker = new Worker(
      'nova-upload-cleanup',
      async (job) => {
        logger.info('Processing upload cleanup job', { jobId: job.id });

        try {
          // Using require for dynamic imports in workers
          const { AppModule } = require('../app.module');
          const { NestFactory } = require('@nestjs/core');
          const appContext = await NestFactory.createApplicationContext(AppModule);
          const { UploadsService } = require('../modules/uploads/uploads.service');
          const uploadsService = appContext.get('UploadsService');

          if (uploadsService && typeof uploadsService.cleanupExpiredUploads === 'function') {
            const deletedCount = await uploadsService.cleanupExpiredUploads();
            logger.info('Upload cleanup completed', { jobId: job.id, deletedCount });
            return { success: true, deletedCount };
          } else {
            throw new Error('UploadsService not available');
          }
        } catch (error: any) {
          logger.error('Upload cleanup job failed', {
            jobId: job.id,
            error: error.message,
          });
          throw error;
        }
      },
      {
        connection: redisClient.options,
        concurrency: 1, // Run one at a time
      },
    );

    this.worker.on('completed', (job) => {
      logger.info('Upload cleanup job completed', { jobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      logger.error('Upload cleanup job failed', {
        jobId: job?.id,
        error: err.message,
      });
    });

    logger.info('Upload cleanup worker started');
  }

  async stop() {
    if (this.worker) {
      await this.worker.close();
      logger.info('Upload cleanup worker stopped');
    }
  }
}

