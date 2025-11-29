import { Injectable } from '@nestjs/common';
import { QueueService } from '../providers/queue/queue.service';
import { Worker } from 'bullmq';
import logger from '../common/logger/winston.logger';
import { createHmac } from 'crypto';
import axios from 'axios';

@Injectable()
export class WebhookWorker {
  private worker: Worker | null = null;

  constructor(
    private readonly queueService: QueueService,
    private readonly concurrency: number,
  ) {}

  async start() {
    const redisClient = this.queueService.getRedisClient();
    
    this.worker = new Worker(
      'nova-webhook',
      async (job) => {
        const { webhookId, url, secret, event, data } = job.data;
        const startTime = Date.now();
        
        logger.info('Processing webhook job', { 
          jobId: job.id, 
          webhookId,
          url,
          event,
          attempt: job.attemptsMade + 1,
        });

        try {
          // Sign payload with HMAC
          const payloadObj = {
            event,
            data,
            timestamp: new Date().toISOString(),
            webhookId,
          };
          const payload = JSON.stringify(payloadObj);

          const signature = this.signPayload(secret, payload);

          // Send webhook
          const response = await axios.post(url, payloadObj, {
            headers: {
              'Content-Type': 'application/json',
              'X-NovaPulse-Signature': signature,
              'X-NovaPulse-Event': event,
              'X-NovaPulse-Webhook-Id': webhookId,
              'User-Agent': 'NovaPulse-Webhooks/1.0',
            },
            timeout: 10000, // 10 second timeout
            validateStatus: (status) => status >= 200 && status < 500,
          });

          const duration = Date.now() - startTime;
          
          if (response.status >= 200 && response.status < 300) {
            logger.info('Webhook delivered successfully', { 
              jobId: job.id, 
              webhookId,
              url,
              status: response.status,
            });
            
            // Log successful delivery
            await this.logDelivery(webhookId, event, data, 'success', response.status, JSON.stringify(response.data), undefined, job.attemptsMade + 1, duration);
            
            return { 
              success: true, 
              status: response.status,
              deliveredAt: new Date().toISOString(),
            };
          } else {
            const errorMsg = `Webhook returned status ${response.status}`;
            await this.logDelivery(webhookId, event, data, 'failed', response.status, JSON.stringify(response.data), errorMsg, job.attemptsMade + 1, duration);
            throw new Error(errorMsg);
          }
        } catch (error: any) {
          const duration = Date.now() - startTime;
          logger.error('Webhook job failed', { 
            jobId: job.id, 
            webhookId,
            url,
            error: error.message,
            attempt: job.attemptsMade + 1,
          });
          
          // Log failed delivery
          await this.logDelivery(webhookId, event, data, 'failed', error.response?.status, error.response?.data ? JSON.stringify(error.response.data) : undefined, error.message, job.attemptsMade + 1, duration);
          
          throw error; // BullMQ will handle retries
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
      logger.info('Webhook job completed', { jobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      logger.error('Webhook job failed', { 
        jobId: job?.id, 
        error: err.message,
        attemptsMade: job?.attemptsMade,
      });
    });

    this.worker.on('error', (err) => {
      logger.error('Webhook worker error', { error: err.message });
    });

    logger.info('Webhook worker started', { concurrency: this.concurrency });
  }

  async stop() {
    if (this.worker) {
      await this.worker.close();
      logger.info('Webhook worker stopped');
    }
  }

  private signPayload(secret: string, payload: string): string {
    const hmac = createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  private async logDelivery(
    webhookId: string,
    event: string,
    data: any,
    status: string,
    statusCode?: number,
    responseBody?: string,
    errorMessage?: string,
    attempt: number = 1,
    duration?: number,
  ) {
    try {
      // Using require for dynamic imports in workers to avoid TypeScript module resolution issues
      const { AppModule } = require('../app.module');
      const { NestFactory } = require('@nestjs/core');
      const appContext = await NestFactory.createApplicationContext(AppModule);
      const { WebhookService } = require('../modules/webhook/webhook.service');
      const webhookService = appContext.get(WebhookService);
      
      if (webhookService && typeof webhookService.logDelivery === 'function') {
        await webhookService.logDelivery(
          webhookId,
          event,
          data,
          status,
          statusCode,
          responseBody,
          errorMessage,
          attempt,
          duration,
        );
      }
    } catch (error) {
      logger.error('Failed to log webhook delivery', { error, webhookId });
    }
  }
}

