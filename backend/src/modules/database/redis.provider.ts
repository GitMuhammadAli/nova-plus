import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType, RedisClientOptions } from 'redis';
import logger from '../../common/logger/winston.logger';

@Injectable()
export class RedisProvider implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const redisUrl =
        this.configService.get<string>('redis.url') || 'redis://localhost:6379';

      const options: RedisClientOptions = {
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 attempts');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          },
          connectTimeout: 10000,
        },
      };

      this.client = createClient(options) as RedisClientType;

      // Event handlers
      this.client.on('connect', () => {
        logger.info('Redis connecting...', { provider: 'redis' });
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        logger.info('Redis connected and ready', { provider: 'redis' });
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis connection error', {
          error: error.message,
          provider: 'redis',
        });
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis reconnecting...', { provider: 'redis' });
      });

      this.client.on('end', () => {
        this.isConnected = false;
        logger.warn('Redis connection ended', { provider: 'redis' });
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis provider', {
        error: error.message,
      });
      // Don't throw - Redis is optional for some operations
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      logger.info('Redis connection closed', { provider: 'redis' });
    }
  }

  /**
   * Get Redis client instance
   */
  getClient(): RedisClientType | null {
    return this.client;
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    if (!this.isReady()) {
      logger.warn('Redis not available, returning null', { key });
      return null;
    }

    try {
      return await this.client!.get(key);
    } catch (error) {
      logger.error('Redis GET error', { key, error: error.message });
      return null; // Fail gracefully
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    if (!this.isReady()) {
      logger.warn('Redis not available, skipping SET', { key });
      return false;
    }

    try {
      if (ttl) {
        await this.client!.setEx(key, ttl, value);
      } else {
        await this.client!.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error', { key, error: error.message });
      return false; // Fail gracefully
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.client!.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Get multiple keys
   */
  async mGet(keys: string[]): Promise<(string | null)[]> {
    if (!this.isReady() || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      return await this.client!.mGet(keys);
    } catch (error) {
      logger.error('Redis MGET error', { keys, error: error.message });
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple key-value pairs
   */
  async mSet(keyValues: Record<string, string>): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.client!.mSet(keyValues);
      return true;
    } catch (error) {
      logger.error('Redis MSET error', { error: error.message });
      return false;
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      return await this.client!.incr(key);
    } catch (error) {
      logger.error('Redis INCR error', { key, error: error.message });
      return null;
    }
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.client!.expire(key, seconds);
      // Redis expire returns 1 for success, 0 for failure
      return result === 1;
    } catch (error) {
      logger.error('Redis EXPIRE error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Get health status
   */
  getHealthStatus(): { status: string; connected: boolean } {
    return {
      status: this.isConnected ? 'connected' : 'disconnected',
      connected: this.isConnected,
    };
  }
}
