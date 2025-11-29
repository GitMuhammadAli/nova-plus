import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller';
import { QueueModule } from '../../providers/queue/queue.module';
import { REDIS_CLIENT } from '../../providers/redis/redis.provider';

@Module({
  imports: [
    TerminusModule,
    MongooseModule,
    QueueModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class HealthModule {}
