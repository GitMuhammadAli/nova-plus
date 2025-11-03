import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../user/entities/user.entity';
import { getJwtSecret } from '../utils/jwt-secret.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Debug: Log cookie extraction (remove in production)
          if (process.env.NODE_ENV === 'development') {
            const token = request?.cookies?.access_token || request?.cookies?.['access_token'];
            console.log('🍪 Cookie extraction:', {
              hasCookies: !!request?.cookies,
              cookieKeys: request?.cookies ? Object.keys(request.cookies) : [],
              accessToken: token ? `Found (length: ${token.length})` : 'Missing',
              secretKey: getJwtSecret(),
            });
          }
          
          // Try cookies first (primary method)
          const token = request?.cookies?.access_token || request?.cookies?.['access_token'];
          if (token && typeof token === 'string') {
            return token;
          }
          
          // Fallback to Authorization header
          const authHeader = request?.headers?.authorization;
          if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    
    const user = await this.userModel.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    // Return user without password
    const userObj: any = user.toObject();
    if (userObj.password) {
      delete userObj.password;
    }
    return userObj;
  }
}