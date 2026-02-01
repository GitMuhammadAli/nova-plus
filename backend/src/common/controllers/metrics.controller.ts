import { Controller, Get } from '@nestjs/common';
import { PrometheusService } from '../metrics/prom-client';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly prometheusService: PrometheusService) {}

  @Get()
  async getMetrics() {
    const metrics = await this.prometheusService.getMetrics();
    return metrics;
  }
}
