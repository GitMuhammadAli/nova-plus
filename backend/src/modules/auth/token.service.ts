import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService implements OnModuleInit {
  private client: RedisClientType;
  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const url =
      this.config.get<string>('REDIS_URL') ||
      this.config.get<string>('redisUrl');
    this.client = createClient({ url });
    this.client.on('error', (err) => console.error('Redis error', err));
    await this.client.connect();
  }

  async allowRefreshToken(jti: string, userId: string, ttlSeconds: number) {
    await this.client.setEx(`refresh:${jti}`, ttlSeconds, userId);
  }

  async isRefreshAllowed(jti: string) {
    return await this.client.get(`refresh:${jti}`);
  }

  async revokeRefreshToken(jti: string) {
    await this.client.del(`refresh:${jti}`);
  }

  // Optionally revoke all tokens for user (pattern delete)
  async revokeAllForUser(userId: string) {
    const iter = this.client.scanIterator({ MATCH: `refresh:*` });
    for await (const keyOrKeys of iter) {
      const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
      for (const key of keys) {
        const val = await this.client.get(key);
        if (val === userId) await this.client.del(key);
      }
    }
  }
}
