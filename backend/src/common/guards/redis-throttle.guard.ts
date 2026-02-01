import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
  CanActivate,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../providers/redis/redis.provider';
import { ConfigService } from '@nestjs/config';

interface RedisThrottleOptions {
  ttl: number; // Time window in seconds
  limit: number; // Max requests per window
  keyGenerator?: (context: ExecutionContext) => string;
}

@Injectable()
export class RedisThrottleGuard implements CanActivate {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate cache key for rate limiting
   */
  protected generateKey(context: ExecutionContext, identifier: string): string {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const companyId = request.user?.companyId || 'anonymous';

    // Use companyId + IP for distributed rate limiting
    return `throttle:${companyId}:${ip}:${identifier}`;
  }

  /**
   * Check if request should be throttled using Redis
   */
  async checkLimit(
    context: ExecutionContext,
    options: RedisThrottleOptions,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const route = request.route?.path || request.url;

    const identifier = options.keyGenerator
      ? options.keyGenerator(context)
      : route;

    const key = this.generateKey(context, identifier);

    try {
      // Use Redis INCR with TTL for rate limiting
      const count = await this.redisClient.incr(key);

      if (count === 1) {
        // Set TTL on first request
        await this.redisClient.expire(key, options.ttl);
      }

      if (count > options.limit) {
        // Get remaining TTL
        const ttl = await this.redisClient.ttl(key);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Too many requests. Please try again in ${ttl} seconds.`,
            retryAfter: ttl,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // If Redis is down, allow request (fail open)
      console.error('Redis throttle check failed, allowing request', error);
      return true;
    }
  }

  /**
   * Override canActivate to use Redis-based throttling
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const route = request.route?.path || request.url;

    // Get throttle config from environment or use defaults
    const ttl = this.configService.get<number>('THROTTLE_TTL') || 60;
    const limit = this.configService.get<number>('THROTTLE_LIMIT') || 100;

    // Apply stricter limits for critical endpoints
    let routeLimit = limit;
    let routeTtl = ttl;

    if (route.includes('/auth/login') || route.includes('/auth/register')) {
      routeLimit = 5; // 5 requests per window
      routeTtl = 60; // 1 minute window
    } else if (route.includes('/invite')) {
      routeLimit = 10; // 10 requests per window
      routeTtl = 60; // 1 minute window
    }

    return this.checkLimit(context, {
      ttl: routeTtl,
      limit: routeLimit,
      keyGenerator: (ctx) => route,
    });
  }
}
