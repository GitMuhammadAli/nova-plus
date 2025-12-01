// src/modules/auth/auth.module.ts (Corrected)

import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose'; 
import { UsersModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User, UserSchema } from './../user/entities/user.entity'; 
import { Session, SessionSchema } from './entities/session.entity';
import { getJwtSecret } from './utils/jwt-secret.util';

@Module({
  imports: [
    UsersModule,
    PassportModule,
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
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService], 
})
export class AuthModule {}