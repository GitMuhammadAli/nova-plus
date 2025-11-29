import { Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { REDIS_CLIENT } from '../redis/redis.provider';
import Redis from 'ioredis';
import logger from '../../common/logger/winston.logger';

export interface JobOptions {
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  delay?: number;
  priority?: number;
  jobId?: string;
}

@Injectable()
export class QueueService {
  private emailQueue: Queue;
  private webhookQueue: Queue;
  private workflowQueue: Queue;
  private reportQueue: Queue;

  constructor(
    @InjectQueue('nova:email') emailQueue: Queue,
    @InjectQueue('nova:webhook') webhookQueue: Queue,
    @InjectQueue('nova:workflow') workflowQueue: Queue,
    @InjectQueue('nova:report') reportQueue: Queue,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {
    this.emailQueue = emailQueue;
    this.webhookQueue = webhookQueue;
    this.workflowQueue = workflowQueue;
    this.reportQueue = reportQueue;
  }

  /**
   * Add email job to queue
   */
  async addEmailJob(
    payload: {
      to: string;
      subject?: string;
      template?: string;
      data?: Record<string, any>;
      html?: string;
      text?: string;
    },
    options?: JobOptions,
  ) {
    const jobOptions = {
      attempts: options?.attempts || 5,
      backoff: options?.backoff || {
        type: 'exponential' as const,
        delay: 2000,
      },
      ...options,
    };

    const job = await this.emailQueue.add('sendEmail', payload, jobOptions);
    logger.info('Email job enqueued', { jobId: job.id, to: payload.to });
    return job;
  }

  /**
   * Add webhook job to queue
   */
  async addWebhookJob(
    payload: {
      webhookId: string;
      url: string;
      secret: string;
      event: string;
      data: Record<string, any>;
    },
    options?: JobOptions,
  ) {
    const jobOptions = {
      attempts: options?.attempts || 3,
      backoff: options?.backoff || {
        type: 'exponential' as const,
        delay: 1000,
      },
      ...options,
    };

    const job = await this.webhookQueue.add('dispatchWebhook', payload, jobOptions);
    logger.info('Webhook job enqueued', { jobId: job.id, webhookId: payload.webhookId });
    return job;
  }

  /**
   * Add workflow execution job to queue
   */
  async addWorkflowJob(
    payload: {
      workflowId: string;
      triggerData?: Record<string, any>;
    },
    options?: JobOptions,
  ) {
    const jobOptions = {
      attempts: options?.attempts || 3,
      backoff: options?.backoff || {
        type: 'exponential' as const,
        delay: 2000,
      },
      ...options,
    };

    const job = await this.workflowQueue.add('executeWorkflow', payload, jobOptions);
    logger.info('Workflow job enqueued', { jobId: job.id, workflowId: payload.workflowId });
    return job;
  }

  /**
   * Add report generation job to queue
   */
  async addReportJob(
    payload: {
      reportType: string;
      companyId: string;
      userId: string;
      params?: Record<string, any>;
    },
    options?: JobOptions,
  ) {
    const jobOptions = {
      attempts: options?.attempts || 2,
      backoff: options?.backoff || {
        type: 'fixed' as const,
        delay: 5000,
      },
      ...options,
    };

    const job = await this.reportQueue.add('generateReport', payload, jobOptions);
    logger.info('Report job enqueued', { jobId: job.id, reportType: payload.reportType });
    return job;
  }

  /**
   * Generic method to add job to any queue
   */
  async add(queueName: string, jobName: string, payload: any, options?: JobOptions) {
    let queue: Queue;
    switch (queueName) {
      case 'nova:email':
        queue = this.emailQueue;
        break;
      case 'nova:webhook':
        queue = this.webhookQueue;
        break;
      case 'nova:workflow':
        queue = this.workflowQueue;
        break;
      case 'nova:report':
        queue = this.reportQueue;
        break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }

    const job = await queue.add(jobName, payload, options);
    logger.info('Job enqueued', { queueName, jobName, jobId: job.id });
    return job;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [emailStats, webhookStats, workflowStats, reportStats] = await Promise.all([
      this.emailQueue.getJobCounts(),
      this.webhookQueue.getJobCounts(),
      this.workflowQueue.getJobCounts(),
      this.reportQueue.getJobCounts(),
    ]);

    return {
      email: emailStats,
      webhook: webhookStats,
      workflow: workflowStats,
      report: reportStats,
    };
  }

  /**
   * Get Redis client for direct access
   */
  getRedisClient(): Redis {
    return this.redisClient;
  }
}

