import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrometheusService } from './metrics/prom-client';
import { MetricsController } from './controllers/metrics.controller';
import { RedisThrottleGuard } from './guards/redis-throttle.guard';
import { QueueModule } from '../providers/queue/queue.module';

@Global()
@Module({
  imports: [ConfigModule, QueueModule],
  controllers: [MetricsController],
  providers: [PrometheusService, RedisThrottleGuard],
  exports: [PrometheusService, RedisThrottleGuard],
})
export class CommonModule {}
