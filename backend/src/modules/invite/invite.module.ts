import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Invite, InviteSchema } from './entities/invite.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Company, CompanySchema } from '../company/entities/company.entity';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { getJwtSecret } from '../auth/utils/jwt-secret.util';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invite.name, schema: InviteSchema },
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: '15m' },
    }),
    forwardRef(() => CompanyModule),
  ],
  providers: [InviteService],
  controllers: [InviteController],
  exports: [InviteService],
})
export class InviteModule {}

