import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SqsEventProducer } from '../../../../shared/events/sqs-producer';
import { EventType } from '../../../../shared/events/event.schema';
import logger from '../logger/winston.logger';

/**
 * Event Emitter Service
 * Used by monolith to emit events to microservices via SQS
 */
@Injectable()
export class EventEmitterService implements OnModuleInit {
  private producer: SqsEventProducer | null = null;
  private enabled: boolean = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const queueUrl = this.configService.get<string>('SQS_EVENTS_QUEUE_URL');
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');

    if (queueUrl) {
      this.producer = new SqsEventProducer(queueUrl, region);
      this.enabled = true;
      logger.info('Event emitter initialized', { queueUrl });
    } else {
      logger.warn('SQS events queue URL not configured, event emission disabled');
    }
  }

  /**
   * Emit an event
   */
  async emit(
    eventType: EventType | string,
    data: Record<string, any>,
    options: {
      tenantId?: string;
      userId?: string;
      correlationId?: string;
    } = {},
  ): Promise<void> {
    if (!this.enabled || !this.producer) {
      logger.debug('Event emission skipped (not configured)', { eventType });
      return;
    }

    try {
      await this.producer.emit(eventType, data, {
        sourceService: 'monolith',
        ...options,
      });

      logger.debug('Event emitted', { eventType, tenantId: options.tenantId });
    } catch (error) {
      logger.error('Failed to emit event', {
        error: error.message,
        eventType,
      });
      // Don't throw - event emission failures shouldn't break the request
    }
  }

  /**
   * Emit user created event
   */
  async emitUserCreated(user: any, tenantId?: string): Promise<void> {
    await this.emit(
      EventType.USER_CREATED,
      {
        userId: user._id || user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId || tenantId,
      },
      { tenantId, userId: user._id || user.id },
    );
  }

  /**
   * Emit company updated event
   */
  async emitCompanyUpdated(companyId: string, changes: Record<string, any>): Promise<void> {
    await this.emit(
      EventType.COMPANY_UPDATED,
      { companyId, changes },
      { tenantId: companyId },
    );
  }

  /**
   * Emit invite sent event
   */
  async emitInviteSent(invite: any, tenantId?: string): Promise<void> {
    await this.emit(
      EventType.INVITE_SENT,
      {
        inviteId: invite._id || invite.id,
        email: invite.email,
        role: invite.role,
        companyId: invite.companyId || tenantId,
        token: invite.token,
      },
      { tenantId },
    );
  }
}

