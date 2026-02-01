import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.provider';

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
  SHORT: 60, // 1 minute - for rapidly changing data
  MEDIUM: 300, // 5 minutes - for moderately changing data
  LONG: 3600, // 1 hour - for stable data
  VERY_LONG: 86400, // 24 hours - for rarely changing data
  SESSION: 900, // 15 minutes - for session data
} as const;

/**
 * Cache key prefixes for organization
 */
export const CACHE_PREFIX = {
  USER: 'user:',
  COMPANY: 'company:',
  SESSION: 'session:',
  SETTINGS: 'settings:',
  PLAN: 'plan:',
  USAGE: 'usage:',
  DASHBOARD: 'dashboard:',
  STATS: 'stats:',
} as const;

@Injectable()
export class CacheService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy() {
    // Clean up Redis connection on module destruction
    await this.redis.quit();
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set(
    key: string,
    value: any,
    ttl: number = CACHE_TTL.MEDIUM,
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error(`Cache ttl error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Increment a counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, amount);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get or set pattern - fetches from cache or calls getter and caches result
   */
  async getOrSet<T>(
    key: string,
    getter: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM,
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, call getter and store result
    const value = await getter();
    await this.set(key, value, ttl);
    return value;
  }

  // ============================================
  // USER CACHING
  // ============================================

  /**
   * Cache user data
   */
  async cacheUser(userId: string, userData: any): Promise<void> {
    const key = `${CACHE_PREFIX.USER}${userId}`;
    await this.set(key, userData, CACHE_TTL.SESSION);
  }

  /**
   * Get cached user data
   */
  async getCachedUser(userId: string): Promise<any | null> {
    const key = `${CACHE_PREFIX.USER}${userId}`;
    return this.get(key);
  }

  /**
   * Invalidate user cache
   */
  async invalidateUser(userId: string): Promise<void> {
    const key = `${CACHE_PREFIX.USER}${userId}`;
    await this.delete(key);
  }

  // ============================================
  // COMPANY CACHING
  // ============================================

  /**
   * Cache company data
   */
  async cacheCompany(companyId: string, companyData: any): Promise<void> {
    const key = `${CACHE_PREFIX.COMPANY}${companyId}`;
    await this.set(key, companyData, CACHE_TTL.LONG);
  }

  /**
   * Get cached company data
   */
  async getCachedCompany(companyId: string): Promise<any | null> {
    const key = `${CACHE_PREFIX.COMPANY}${companyId}`;
    return this.get(key);
  }

  /**
   * Invalidate company cache
   */
  async invalidateCompany(companyId: string): Promise<void> {
    const key = `${CACHE_PREFIX.COMPANY}${companyId}`;
    await this.delete(key);
    // Also invalidate related caches
    await this.deletePattern(`${CACHE_PREFIX.SETTINGS}${companyId}:*`);
    await this.deletePattern(`${CACHE_PREFIX.USAGE}${companyId}:*`);
    await this.deletePattern(`${CACHE_PREFIX.DASHBOARD}${companyId}:*`);
  }

  // ============================================
  // SESSION CACHING
  // ============================================

  /**
   * Store session data
   */
  async setSession(sessionId: string, sessionData: any): Promise<void> {
    const key = `${CACHE_PREFIX.SESSION}${sessionId}`;
    await this.set(key, sessionData, CACHE_TTL.SESSION);
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<any | null> {
    const key = `${CACHE_PREFIX.SESSION}${sessionId}`;
    return this.get(key);
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const key = `${CACHE_PREFIX.SESSION}${sessionId}`;
    await this.delete(key);
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<void> {
    await this.deletePattern(`${CACHE_PREFIX.SESSION}*:${userId}:*`);
  }

  // ============================================
  // SETTINGS CACHING
  // ============================================

  /**
   * Cache company settings
   */
  async cacheSettings(companyId: string, settings: any): Promise<void> {
    const key = `${CACHE_PREFIX.SETTINGS}${companyId}`;
    await this.set(key, settings, CACHE_TTL.LONG);
  }

  /**
   * Get cached settings
   */
  async getCachedSettings(companyId: string): Promise<any | null> {
    const key = `${CACHE_PREFIX.SETTINGS}${companyId}`;
    return this.get(key);
  }

  /**
   * Invalidate settings cache
   */
  async invalidateSettings(companyId: string): Promise<void> {
    const key = `${CACHE_PREFIX.SETTINGS}${companyId}`;
    await this.delete(key);
  }

  // ============================================
  // PLAN & USAGE CACHING
  // ============================================

  /**
   * Cache plan info
   */
  async cachePlanInfo(companyId: string, planInfo: any): Promise<void> {
    const key = `${CACHE_PREFIX.PLAN}${companyId}`;
    await this.set(key, planInfo, CACHE_TTL.MEDIUM);
  }

  /**
   * Get cached plan info
   */
  async getCachedPlanInfo(companyId: string): Promise<any | null> {
    const key = `${CACHE_PREFIX.PLAN}${companyId}`;
    return this.get(key);
  }

  /**
   * Invalidate plan cache
   */
  async invalidatePlanInfo(companyId: string): Promise<void> {
    const key = `${CACHE_PREFIX.PLAN}${companyId}`;
    await this.delete(key);
  }

  /**
   * Cache usage stats
   */
  async cacheUsageStats(companyId: string, usage: any): Promise<void> {
    const key = `${CACHE_PREFIX.USAGE}${companyId}`;
    await this.set(key, usage, CACHE_TTL.SHORT); // Short TTL for usage stats
  }

  /**
   * Get cached usage stats
   */
  async getCachedUsageStats(companyId: string): Promise<any | null> {
    const key = `${CACHE_PREFIX.USAGE}${companyId}`;
    return this.get(key);
  }

  // ============================================
  // DASHBOARD CACHING
  // ============================================

  /**
   * Cache dashboard stats
   */
  async cacheDashboardStats(companyId: string, stats: any): Promise<void> {
    const key = `${CACHE_PREFIX.DASHBOARD}${companyId}`;
    await this.set(key, stats, CACHE_TTL.SHORT);
  }

  /**
   * Get cached dashboard stats
   */
  async getCachedDashboardStats(companyId: string): Promise<any | null> {
    const key = `${CACHE_PREFIX.DASHBOARD}${companyId}`;
    return this.get(key);
  }

  /**
   * Invalidate dashboard cache
   */
  async invalidateDashboard(companyId: string): Promise<void> {
    const key = `${CACHE_PREFIX.DASHBOARD}${companyId}`;
    await this.delete(key);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Flush all cache (use with caution!)
   */
  async flushAll(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Cache flush all error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keyCount: number; memoryUsed: string }> {
    try {
      const info = await this.redis.info('memory');
      const keyCount = await this.redis.dbsize();

      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsed = memoryMatch ? memoryMatch[1].trim() : 'unknown';

      return { keyCount, memoryUsed };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { keyCount: 0, memoryUsed: 'unknown' };
    }
  }
}
