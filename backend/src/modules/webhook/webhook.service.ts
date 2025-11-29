import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Webhook, WebhookDocument } from './entities/webhook.entity';
import { WebhookLog, WebhookLogDocument } from './entities/webhook-log.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { QueueService } from '../../providers/queue/queue.service';
import { createHmac, randomBytes } from 'crypto';
import logger from '../../common/logger/winston.logger';

@Injectable()
export class WebhookService {
  constructor(
    @InjectModel(Webhook.name) private webhookModel: Model<WebhookDocument>,
    @InjectModel(WebhookLog.name) private webhookLogModel: Model<WebhookLogDocument>,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Generate a secure secret for webhook signing
   */
  private generateSecret(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Create a new webhook
   */
  async create(createWebhookDto: CreateWebhookDto, companyId: string, userId: string): Promise<WebhookDocument> {
    const secret = this.generateSecret();

    const webhook = new this.webhookModel({
      ...createWebhookDto,
      companyId: new Types.ObjectId(companyId),
      createdBy: new Types.ObjectId(userId),
      secret,
      isActive: createWebhookDto.isActive !== undefined ? createWebhookDto.isActive : true,
      retries: createWebhookDto.retries || 3,
    });

    const savedWebhook = await webhook.save();
    logger.info('Webhook created', { webhookId: savedWebhook._id, companyId, url: savedWebhook.url });

    return savedWebhook;
  }

  /**
   * Get all webhooks for a company
   */
  async findAll(companyId: string): Promise<WebhookDocument[]> {
    return this.webhookModel
      .find({ companyId: new Types.ObjectId(companyId) })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get webhook by ID
   */
  async findOne(id: string, companyId: string): Promise<WebhookDocument> {
    const webhook = await this.webhookModel
      .findOne({
        _id: id,
        companyId: new Types.ObjectId(companyId),
      })
      .populate('createdBy', 'name email')
      .exec();

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  /**
   * Update webhook
   */
  async update(id: string, updateWebhookDto: UpdateWebhookDto, companyId: string): Promise<WebhookDocument> {
    const webhook = await this.webhookModel.findOne({
      _id: id,
      companyId: new Types.ObjectId(companyId),
    }).exec();

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    Object.assign(webhook, updateWebhookDto);
    return webhook.save();
  }

  /**
   * Delete webhook
   */
  async remove(id: string, companyId: string): Promise<void> {
    const result = await this.webhookModel.deleteOne({
      _id: id,
      companyId: new Types.ObjectId(companyId),
    }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Webhook not found');
    }

    // Also delete related logs
    await this.webhookLogModel.deleteMany({ webhookId: new Types.ObjectId(id) }).exec();
  }

  /**
   * Trigger webhook (enqueue job)
   */
  async triggerWebhook(webhookId: string, event: string, data: Record<string, any>): Promise<void> {
    const webhook = await this.webhookModel.findById(webhookId).exec();

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    if (!webhook.isActive) {
      throw new BadRequestException('Webhook is not active');
    }

    if (!webhook.events.includes(event)) {
      throw new BadRequestException(`Webhook does not listen to event: ${event}`);
    }

    // Enqueue webhook job
    await this.queueService.addWebhookJob({
      webhookId: webhook._id.toString(),
      url: webhook.url,
      secret: webhook.secret,
      event,
      data,
    });

    logger.info('Webhook triggered', { webhookId, event });
  }

  /**
   * Test webhook (immediate dispatch)
   */
  async testWebhook(id: string, companyId: string): Promise<{ success: boolean; message: string }> {
    const webhook = await this.findOne(id, companyId);

    if (!webhook._id) {
      throw new NotFoundException('Webhook not found');
    }

    // Trigger test event
    await this.triggerWebhook(webhook._id.toString(), 'webhook.test', {
      test: true,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Test webhook enqueued',
    };
  }

  /**
   * Get webhook logs
   */
  async getLogs(webhookId: string, companyId: string, limit: number = 50): Promise<WebhookLogDocument[]> {
    // Verify webhook belongs to company
    await this.findOne(webhookId, companyId);

    return this.webhookLogModel
      .find({ webhookId: new Types.ObjectId(webhookId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Log webhook delivery attempt
   */
  async logDelivery(
    webhookId: string,
    event: string,
    payload: any,
    status: string,
    statusCode?: number,
    responseBody?: string,
    errorMessage?: string,
    attempt: number = 1,
    duration?: number,
  ): Promise<WebhookLogDocument> {
    const log = new this.webhookLogModel({
      webhookId: new Types.ObjectId(webhookId),
      event,
      payload,
      status,
      statusCode,
      responseBody,
      errorMessage,
      attempt,
      duration,
      deliveredAt: status === 'success' ? new Date() : undefined,
    });

    // Update webhook last status
    await this.webhookModel.updateOne(
      { _id: webhookId },
      {
        lastStatus: status,
        lastAttemptAt: new Date(),
      },
    ).exec();

    return log.save();
  }

  /**
   * Sign payload with HMAC
   */
  signPayload(secret: string, payload: object): string {
    const hmac = createHmac('sha256', secret);
    const body = JSON.stringify(payload);
    hmac.update(body);
    return `sha256=${hmac.digest('hex')}`;
  }
}

