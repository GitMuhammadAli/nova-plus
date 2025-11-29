import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AggregationModule } from './modules/aggregation/aggregation.module';
import { HealthModule } from './modules/health/health.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: (configService) => ({
        uri: configService.get('database.mongo.uri'),
      }),
      inject: ['ConfigService'],
    }),
    AnalyticsModule,
    AggregationModule,
    HealthModule,
  ],
})
export class AppModule {}

