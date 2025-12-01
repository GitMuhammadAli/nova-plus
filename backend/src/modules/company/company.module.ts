import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Company, CompanySchema } from './entities/company.entity';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { User, UserSchema } from '../user/entities/user.entity';
import { getJwtSecret } from '../auth/utils/jwt-secret.util';
import { InviteModule } from '../invite/invite.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: '15m' },
    }),
    forwardRef(() => InviteModule),
    AuditModule,
  ],
  providers: [CompanyService],
  controllers: [CompanyController],
  exports: [CompanyService],
})
export class CompanyModule {}

