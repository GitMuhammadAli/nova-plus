import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongoProvider } from './mongo.provider';
import { RedisProvider } from './redis.provider';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useClass: MongoProvider,
      inject: [ConfigService],
    }),
  ],
  providers: [MongoProvider, RedisProvider],
  exports: [MongoProvider, RedisProvider, MongooseModule],
})
export class DatabaseModule {}

