/**
 * SQS Event Producer
 * Used by monolith and services to emit events
 */

import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { BaseEvent, EventFactory, EventType } from './event.schema';

export class SqsEventProducer {
  private sqsClient: SQSClient;
  private queueUrl: string;

  constructor(queueUrl: string, region: string = 'us-east-1') {
    this.queueUrl = queueUrl;
    this.sqsClient = new SQSClient({ region });
  }

  /**
   * Emit an event to SQS
   */
  async emit(
    eventType: EventType | string,
    data: Record<string, any>,
    options: {
      sourceService: string;
      tenantId?: string;
      userId?: string;
      correlationId?: string;
    },
  ): Promise<{ messageId: string }> {
    const event = EventFactory.create(eventType, data, options);

    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(event),
        MessageAttributes: {
          EventType: {
            DataType: 'String',
            StringValue: event.eventType,
          },
          SourceService: {
            DataType: 'String',
            StringValue: event.sourceService,
          },
          ...(event.tenantId && {
            TenantId: {
              DataType: 'String',
              StringValue: event.tenantId,
            },
          }),
        },
      });

      const response = await this.sqsClient.send(command);

      return { messageId: response.MessageId || '' };
    } catch (error) {
      throw new Error(`Failed to emit event: ${error.message}`);
    }
  }

  /**
   * Emit multiple events (batch)
   */
  async emitBatch(events: Array<{
    eventType: EventType | string;
    data: Record<string, any>;
    options: {
      sourceService: string;
      tenantId?: string;
      userId?: string;
      correlationId?: string;
    };
  }>): Promise<Array<{ success: boolean; messageId?: string; error?: string }>> {
    // SQS supports batch sends (up to 10 messages)
    const results = await Promise.allSettled(
      events.map((e) => this.emit(e.eventType, e.data, e.options)),
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { success: true, messageId: result.value.messageId };
      } else {
        return { success: false, error: result.reason.message };
      }
    });
  }
}

