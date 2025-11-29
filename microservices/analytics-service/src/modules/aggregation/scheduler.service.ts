import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AggregationService } from './aggregation.service';
import logger from '../../common/logger';

@Injectable()
export class SchedulerService {
  constructor(private readonly aggregationService: AggregationService) {}

  /**
   * Run hourly aggregation
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyAggregation() {
    logger.info('Running scheduled hourly aggregation');
    try {
      await this.aggregationService.aggregateHourly();
    } catch (error) {
      logger.error('Hourly aggregation failed', { error: error.message });
    }
  }

  /**
   * Run daily aggregation at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyAggregation() {
    logger.info('Running scheduled daily aggregation');
    try {
      await this.aggregationService.aggregateDaily();
    } catch (error) {
      logger.error('Daily aggregation failed', { error: error.message });
    }
  }
}

