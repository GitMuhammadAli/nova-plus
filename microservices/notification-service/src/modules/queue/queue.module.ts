import { Module } from '@nestjs/common';
import { SqsConsumerService } from './sqs-consumer.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [SqsConsumerService],
  exports: [SqsConsumerService],
})
export class QueueModule {}

