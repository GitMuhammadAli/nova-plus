import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
  MemoryHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../providers/redis/redis.provider';

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
    private memory: MemoryHealthIndicator,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
      () => this.checkRedis(),
    ]);
  }

  @Get('live')
  live() {
    return { status: 'ok', timestamp: Date.now() };
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
      () => this.checkRedis(),
    ]);
  }

  @Get('status')
  async systemStatus() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    let mongoStatus = 'up';
    try {
      await this.health.check([() => this.mongoose.pingCheck('mongodb')]);
    } catch {
      mongoStatus = 'down';
    }

    let redisStatus = 'up';
    try {
      await this.redisClient.ping();
    } catch {
      redisStatus = 'down';
    }

    return {
      status: mongoStatus === 'up' && redisStatus === 'up' ? 'healthy' : 'degraded',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: {
        seconds: Math.floor(uptime),
        human: this.formatUptime(uptime),
      },
      startedAt: new Date(this.startTime).toISOString(),
      services: {
        mongodb: { status: mongoStatus },
        redis: { status: redisStatus },
      },
      memory: {
        heapUsed: this.formatBytes(memUsage.heapUsed),
        heapTotal: this.formatBytes(memUsage.heapTotal),
        rss: this.formatBytes(memUsage.rss),
        external: this.formatBytes(memUsage.external),
      },
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async checkRedis(): Promise<HealthIndicatorResult> {
    try {
      await this.redisClient.ping();
      return { redis: { status: 'up' } } as HealthIndicatorResult;
    } catch (error) {
      throw new Error('Redis is down');
    }
  }

  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  }

  private formatBytes(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  }
}
