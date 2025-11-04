import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { Organization, OrganizationSchema } from '../organization/entities/organization.entity';
import { UsersService } from './user.service';
import { UserController } from './user.controller';
import { DefaultAdminSeed } from './seed/default-admin.seed';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  providers: [UsersService, DefaultAdminSeed],
  controllers: [UserController],
  exports: [UsersService],
})
export class UsersModule {}
