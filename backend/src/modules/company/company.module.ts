import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Company, CompanySchema } from './entities/company.entity';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { User, UserSchema } from '../user/entities/user.entity';
import { getJwtSecret } from '../auth/utils/jwt-secret.util';

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
  ],
  providers: [CompanyService],
  controllers: [CompanyController],
  exports: [CompanyService],
})
export class CompanyModule {}

