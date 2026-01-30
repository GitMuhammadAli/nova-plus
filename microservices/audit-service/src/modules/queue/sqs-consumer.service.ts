import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, Message } from '@aws-sdk/client-sqs';
import { AuditService } from '../audit/audit.service';
import logger from '../../common/logger';
import { BaseEvent, EventFactory } from '../../../../shared/events/event.schema';

@Injectable()
export class SqsConsumerService implements OnModuleInit, OnModuleDestroy {
  private sqsClient: SQSClient;
  private queueUrl: string;
  private isRunning: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {
    const region = this.configService.get<string>('aws.region', 'us-east-1');
    this.sqsClient = new SQSClient({ region });
    this.queueUrl = this.configService.get<string>('aws.sqs.queueUrl', '');
  }

  async onModuleInit() {
    if (this.queueUrl) {
      await this.start();
    } else {
      logger.warn('SQS queue URL not configured, consumer not started');
    }
  }

  async onModuleDestroy() {
    await this.stop();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('Starting SQS consumer', { queueUrl: this.queueUrl });

    this.pollInterval = setInterval(() => this.pollMessages(), 5000);
    this.pollMessages();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async pollMessages(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
      });

      const response = await this.sqsClient.send(command);

      if (response.Messages && response.Messages.length > 0) {
        await Promise.all(response.Messages.map((msg) => this.processMessage(msg)));
      }
    } catch (error) {
      logger.error('Error polling SQS messages', { error: error.message });
    }
  }

  private async processMessage(message: Message): Promise<void> {
    if (!message.Body || !message.ReceiptHandle) return;

    try {
      const event: BaseEvent = JSON.parse(message.Body);

      if (!EventFactory.validate(event)) {
        logger.warn('Invalid event structure', { eventId: event.eventId });
        await this.deleteMessage(message.ReceiptHandle);
        return;
      }

      // Process audit event
      if (event.eventType.startsWith('audit.') || event.data.action) {
        await this.handleAuditEvent(event);
      }

      await this.deleteMessage(message.ReceiptHandle);
    } catch (error) {
      logger.error('Error processing message', { error: error.message });
    }
  }

  private async handleAuditEvent(event: BaseEvent): Promise<void> {
    const { action, resource, resourceId, changes, metadata } = event.data;

    await this.auditService.create({
      action,
      resource,
      resourceId,
      tenantId: event.tenantId,
      userId: event.userId,
      changes,
      metadata: {
        ...metadata,
        eventId: event.eventId,
        sourceService: event.sourceService,
      },
    });
  }

  private async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      });
      await this.sqsClient.send(command);
    } catch (error) {
      logger.error('Error deleting message', { error: error.message });
    }
  }
}

