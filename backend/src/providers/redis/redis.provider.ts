import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (configService: ConfigService) => {
    const redisUrl =
      configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    client.on('connect', () => {
      console.log('Redis connected');
    });

    client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    return client;
  },
  inject: [ConfigService],
};
