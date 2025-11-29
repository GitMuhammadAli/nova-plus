import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  companyId: string;
  jti: string; // JWT ID (session ID)
  iat: number;
  exp: number;
}

@Injectable()
export class TokenService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    const secret = this.configService.get<string>('jwt.accessSecret');
    
    try {
      const decoded = jwt.verify(token, secret) as TokenPayload;
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    const secret = this.configService.get<string>('jwt.refreshSecret');
    
    try {
      const decoded = jwt.verify(token, secret) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Verify service-to-service token
   */
  verifyServiceToken(token: string, secret: string, expectedAudience?: string): any {
    try {
      const decoded = jwt.verify(token, secret) as any;

      if (expectedAudience && decoded.aud !== expectedAudience) {
        throw new Error('Token audience mismatch');
      }

      return decoded;
    } catch (error) {
      throw new Error(`Service token verification failed: ${error.message}`);
    }
  }
}

