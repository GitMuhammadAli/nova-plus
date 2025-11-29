import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { REDIS_CLIENT, redisProvider } from '../redis/redis.provider';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        return {
          connection: {
            url: redisUrl,
          },
        };
      },
      inject: [ConfigService],
    }),
    // Register queues
    BullModule.registerQueue(
      { name: 'nova:email' },
      { name: 'nova:webhook' },
      { name: 'nova:workflow' },
      { name: 'nova:report' },
    ),
  ],
  controllers: [QueueController],
  providers: [redisProvider, QueueService],
  exports: [QueueService, REDIS_CLIENT, BullModule],
})
export class QueueModule {}

