import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, Message } from '@aws-sdk/client-sqs';
import { NotificationService } from '../notification/notification.service';
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
    private readonly notificationService: NotificationService,
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

  /**
   * Start consuming messages from SQS
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    logger.info('Starting SQS consumer', { queueUrl: this.queueUrl });

    // Poll for messages
    this.pollInterval = setInterval(() => {
      this.pollMessages();
    }, 5000); // Poll every 5 seconds

    // Initial poll
    this.pollMessages();
  }

  /**
   * Stop consuming messages
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    logger.info('SQS consumer stopped');
  }

  /**
   * Poll for messages from SQS
   */
  private async pollMessages(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20, // Long polling
        VisibilityTimeout: this.configService.get<number>('aws.sqs.visibilityTimeout', 300),
      });

      const response = await this.sqsClient.send(command);

      if (response.Messages && response.Messages.length > 0) {
        await Promise.all(
          response.Messages.map((message) => this.processMessage(message)),
        );
      }
    } catch (error) {
      logger.error('Error polling SQS messages', { error: error.message });
    }
  }

  /**
   * Process a single message
   */
  private async processMessage(message: Message): Promise<void> {
    if (!message.Body || !message.ReceiptHandle) {
      return;
    }

    try {
      const event: BaseEvent = JSON.parse(message.Body);

      // Validate event structure
      if (!EventFactory.validate(event)) {
        logger.warn('Invalid event structure', { eventId: event.eventId });
        await this.deleteMessage(message.ReceiptHandle);
        return;
      }

      // Process notification event
      if (event.eventType === 'notification.send' || event.eventType.startsWith('notification.')) {
        await this.handleNotificationEvent(event);
      }

      // Delete message after successful processing
      await this.deleteMessage(message.ReceiptHandle);

      logger.info('Message processed successfully', { eventId: event.eventId });
    } catch (error) {
      logger.error('Error processing message', {
        error: error.message,
        messageId: message.MessageId,
      });
      // Message will become visible again after visibility timeout
      // If it fails multiple times, it will go to DLQ
    }
  }

  /**
   * Handle notification event
   */
  private async handleNotificationEvent(event: BaseEvent): Promise<void> {
    const { type, recipient, template, data } = event.data;

    await this.notificationService.send({
      type,
      recipient,
      template,
      data,
      tenantId: event.tenantId,
      userId: event.userId,
    });
  }

  /**
   * Delete message from queue
   */
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

