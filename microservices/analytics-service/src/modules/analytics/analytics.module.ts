import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { StatsService } from './stats.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, StatsService],
  exports: [AnalyticsService, StatsService],
})
export class AnalyticsModule {}

