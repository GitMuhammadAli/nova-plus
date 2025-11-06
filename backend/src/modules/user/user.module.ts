import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { Organization, OrganizationSchema } from '../organization/entities/organization.entity';
import { Company, CompanySchema } from '../company/entities/company.entity';
import { UsersService } from './user.service';
import { UserController } from './user.controller';
import { UsersController } from './users.controller';
import { DefaultAdminSeed } from './seed/default-admin.seed';
import { TestDataSeed } from './seed/test-data.seed';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
  ],
  providers: [UsersService, DefaultAdminSeed, TestDataSeed],
  controllers: [UserController, UsersController],
  exports: [UsersService],
})
export class UsersModule {}
