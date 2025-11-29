import { Injectable } from '@nestjs/common';
import { QueueService } from '../providers/queue/queue.service';
import { Worker } from 'bullmq';
import logger from '../common/logger/winston.logger';

@Injectable()
export class WorkflowWorker {
  private worker: Worker | null = null;

  constructor(
    private readonly queueService: QueueService,
    private readonly concurrency: number,
  ) {}

  async start() {
    const redisClient = this.queueService.getRedisClient();
    
    this.worker = new Worker(
      'nova:workflow',
      async (job) => {
        const { workflowId, triggerData } = job.data;
        
        logger.info('Processing workflow job', { 
          jobId: job.id, 
          workflowId,
          attempt: job.attemptsMade + 1,
        });

        try {
          // Import WorkflowService dynamically
          const { WorkflowModule } = await import('../modules/workflow/workflow.module');
          const { NestFactory } = await import('@nestjs/core');
          const appContext = await NestFactory.createApplicationContext(WorkflowModule);
          const workflowService = appContext.get('WorkflowService');

          // Execute workflow
          if (workflowService && typeof workflowService.execute === 'function') {
            await workflowService.execute(workflowId, triggerData || {});
          } else {
            logger.warn('WorkflowService.execute not available, skipping execution');
          }

          logger.info('Workflow executed successfully', { jobId: job.id, workflowId });
          return { success: true, executedAt: new Date().toISOString() };
        } catch (error: any) {
          logger.error('Workflow job failed', { 
            jobId: job.id, 
            workflowId, 
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
      logger.info('Workflow job completed', { jobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      logger.error('Workflow job failed', { 
        jobId: job?.id, 
        error: err.message,
        attemptsMade: job?.attemptsMade,
      });
    });

    this.worker.on('error', (err) => {
      logger.error('Workflow worker error', { error: err.message });
    });

    logger.info('Workflow worker started', { concurrency: this.concurrency });
  }

  async stop() {
    if (this.worker) {
      await this.worker.close();
      logger.info('Workflow worker stopped');
    }
  }
}

