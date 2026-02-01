import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './cache.service';
import { redisProvider, REDIS_CLIENT } from '../redis/redis.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [redisProvider, CacheService],
  exports: [CacheService, REDIS_CLIENT],
})
export class CacheModule {}
