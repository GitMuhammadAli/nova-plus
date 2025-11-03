import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { UsersService } from './user.service';
import { UserController } from './user.controller';
import { DefaultAdminSeed } from './seed/default-admin.seed';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  providers: [UsersService, DefaultAdminSeed],
  controllers: [UserController],
  exports: [UsersService],
})
export class UsersModule {}
