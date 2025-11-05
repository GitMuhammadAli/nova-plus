import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { TasksModule } from './modules/task/task.module';
import { TeamsModule } from './modules/team/team.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { UsersModule } from './modules/user/user.module';
import { CompanyModule } from './modules/company/company.module';
import { InviteModule } from './modules/invite/invite.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule , TasksModule , TeamsModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongoUri'),
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    OrganizationModule,
    CompanyModule,
    InviteModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
