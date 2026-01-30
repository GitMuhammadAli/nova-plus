import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject('REDIS_CLIENT') private readonly client: RedisClientType) {}

  async onModuleDestroy() {
    await this.client.quit();
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Blacklist a token
   */
  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    const key = `blacklist:${token}`;
    await this.client.setEx(key, expiresIn, '1');
  }

  /**
   * Get session data
   */
  async getSession(sessionKey: string): Promise<any> {
    const data = await this.client.get(sessionKey);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Set session data
   */
  async setSession(sessionKey: string, data: any, ttl: number): Promise<void> {
    await this.client.setEx(sessionKey, ttl, JSON.stringify(data));
  }

  /**
   * Delete session
   */
  async deleteSession(sessionKey: string): Promise<void> {
    await this.client.del(sessionKey);
  }
}

