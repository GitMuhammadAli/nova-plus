// src/modules/auth/auth.module.ts (Corrected)

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose'; 
import { UsersModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MfaService } from './mfa.service';
import { MfaController } from './mfa.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User, UserSchema } from './../user/entities/user.entity'; 
import { Session, SessionSchema } from './entities/session.entity';
import { getJwtSecret } from './utils/jwt-secret.util';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    CommonModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = getJwtSecret();
        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 JwtModule initialized with secret:', secret);
        }
        return {
          secret: secret,
          signOptions: { expiresIn: '15m' },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy, MfaService],
  controllers: [AuthController, MfaController],
  exports: [AuthService, MfaService],
})
export class AuthModule {}