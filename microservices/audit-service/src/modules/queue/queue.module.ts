import { Module } from '@nestjs/common';
import { SqsConsumerService } from './sqs-consumer.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [SqsConsumerService],
  exports: [SqsConsumerService],
})
export class QueueModule {}

