import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { Webhook, WebhookSchema } from './entities/webhook.entity';
import { WebhookLog, WebhookLogSchema } from './entities/webhook-log.entity';
import { QueueModule } from '../../providers/queue/queue.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Webhook.name, schema: WebhookSchema },
      { name: WebhookLog.name, schema: WebhookLogSchema },
    ]),
    QueueModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}

