import { Injectable, OnModuleInit } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class PrometheusService implements OnModuleInit {
  private readonly register: promClient.Registry;

  // HTTP Metrics
  public readonly httpRequestDuration: promClient.Histogram<string>;
  public readonly httpRequestTotal: promClient.Counter<string>;
  public readonly httpRequestErrors: promClient.Counter<string>;

  // Queue Metrics
  public readonly queueJobDuration: promClient.Histogram<string>;
  public readonly queueJobTotal: promClient.Counter<string>;
  public readonly queueJobErrors: promClient.Counter<string>;
  public readonly queueSize: promClient.Gauge<string>;

  // Database Metrics
  public readonly dbQueryDuration: promClient.Histogram<string>;
  public readonly dbConnectionPool: promClient.Gauge<string>;

  // Redis Metrics
  public readonly redisCommandDuration: promClient.Histogram<string>;
  public readonly redisConnectionStatus: promClient.Gauge<string>;

  constructor() {
    this.register = new promClient.Registry();
    promClient.collectDefaultMetrics({ register: this.register });

    // HTTP Metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    this.httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.httpRequestErrors = new promClient.Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.register],
    });

    // Queue Metrics
    this.queueJobDuration = new promClient.Histogram({
      name: 'queue_job_duration_seconds',
      help: 'Duration of queue jobs in seconds',
      labelNames: ['queue', 'job_type', 'status'],
      buckets: [1, 5, 10, 30, 60, 300],
      registers: [this.register],
    });

    this.queueJobTotal = new promClient.Counter({
      name: 'queue_jobs_total',
      help: 'Total number of queue jobs',
      labelNames: ['queue', 'job_type', 'status'],
      registers: [this.register],
    });

    this.queueJobErrors = new promClient.Counter({
      name: 'queue_job_errors_total',
      help: 'Total number of queue job errors',
      labelNames: ['queue', 'job_type'],
      registers: [this.register],
    });

    this.queueSize = new promClient.Gauge({
      name: 'queue_size',
      help: 'Current size of queue',
      labelNames: ['queue'],
      registers: [this.register],
    });

    // Database Metrics
    this.dbQueryDuration = new promClient.Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['collection', 'operation'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.register],
    });

    this.dbConnectionPool = new promClient.Gauge({
      name: 'db_connection_pool_size',
      help: 'Current database connection pool size',
      labelNames: ['state'],
      registers: [this.register],
    });

    // Redis Metrics
    this.redisCommandDuration = new promClient.Histogram({
      name: 'redis_command_duration_seconds',
      help: 'Duration of Redis commands in seconds',
      labelNames: ['command'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
      registers: [this.register],
    });

    this.redisConnectionStatus = new promClient.Gauge({
      name: 'redis_connection_status',
      help: 'Redis connection status (1 = connected, 0 = disconnected)',
      registers: [this.register],
    });
  }

  onModuleInit() {
    // Set initial Redis connection status
    this.redisConnectionStatus.set(0);
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Get registry for custom metrics
   */
  getRegister(): promClient.Registry {
    return this.register;
  }
}
