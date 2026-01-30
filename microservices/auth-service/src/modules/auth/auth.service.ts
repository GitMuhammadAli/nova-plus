import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { RedisService } from '../redis/redis.service';
import { ValidateResponseDto } from './dto/validate-token.dto';
import logger from '../../common/logger';

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validate access token
   * Checks JWT signature, expiration, and optional Redis blacklist
   */
  async validateToken(token: string): Promise<ValidateResponseDto> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.redisService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Verify and decode token
      const payload = await this.tokenService.verifyAccessToken(token);

      // Get session info from Redis if available
      const sessionKey = `session:${payload.userId}:${payload.jti}`;
      const session = await this.redisService.getSession(sessionKey);

      return {
        valid: true,
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        companyId: payload.companyId,
        sessionId: payload.jti,
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        device: session?.device || null,
      };
    } catch (error) {
      logger.warn('Token validation failed', {
        error: error.message,
        tokenPrefix: token.substring(0, 20),
      });

      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Revoke token (add to blacklist)
   */
  async revokeToken(token: string, expiresIn: number): Promise<void> {
    await this.redisService.blacklistToken(token, expiresIn);
    logger.info('Token revoked', { tokenPrefix: token.substring(0, 20) });
  }

  /**
   * Validate service-to-service token
   */
  async validateServiceToken(token: string, expectedAudience?: string): Promise<any> {
    try {
      const serviceSecret = this.configService.get<string>('jwt.serviceSecret');
      return this.tokenService.verifyServiceToken(token, serviceSecret, expectedAudience);
    } catch (error) {
      throw new UnauthorizedException('Invalid service token');
    }
  }
}

