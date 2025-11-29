import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('database.redis.url');
        const client = createClient({ url: redisUrl }) as RedisClientType;
        
        client.on('error', (err) => console.error('Redis Client Error', err));
        await client.connect();
        
        return client;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}

