import { Module } from '@nestjs/common';
import { AggregationService } from './aggregation.service';
import { SchedulerService } from './scheduler.service';

@Module({
  providers: [AggregationService, SchedulerService],
  exports: [AggregationService],
})
export class AggregationModule {}

