import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { QueueService } from './providers/queue/queue.service';
import { EmailWorker } from './workers/email.worker';
import { WebhookWorker } from './workers/webhook.worker';
import { WorkflowWorker } from './workers/workflow.worker';
import { ReportWorker } from './workers/report.worker';
import logger from './common/logger/winston.logger';
import { ConfigService } from '@nestjs/config';

async function bootstrapWorker() {
  try {
    logger.info('Starting worker process...');
    
    // Create application context (no HTTP server)
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    const configService = app.get(ConfigService);
    const queueService = app.get(QueueService);
    const concurrency = configService.get<number>('queue.concurrency') || 5;

    logger.info(`Worker concurrency: ${concurrency}`);

    // Initialize workers
    const emailWorker = new EmailWorker(queueService, concurrency);
    const webhookWorker = new WebhookWorker(queueService, concurrency);
    const workflowWorker = new WorkflowWorker(queueService, concurrency);
    const reportWorker = new ReportWorker(queueService, concurrency);

    // Start all workers
    await Promise.all([
      emailWorker.start(),
      webhookWorker.start(),
      workflowWorker.start(),
      reportWorker.start(),
    ]);

    logger.info('All workers started successfully');

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down workers gracefully...`);
      
      await Promise.all([
        emailWorker.stop(),
        webhookWorker.stop(),
        workflowWorker.stop(),
        reportWorker.stop(),
      ]);

      await app.close();
      logger.info('Workers stopped, exiting...');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start worker process', { error });
    process.exit(1);
  }
}

bootstrapWorker();

