/**
 * Service-to-Service Authentication Middleware
 * Validates JWT tokens for inter-service communication
 */

import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ServiceJwt } from './service-jwt';

@Injectable()
export class ServiceAuthMiddleware implements NestMiddleware {
  private serviceSecret: string;

  constructor(serviceSecret: string) {
    this.serviceSecret = serviceSecret;
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Skip auth for health checks
    if (req.path.includes('/health')) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing service token');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = ServiceJwt.verify(token, this.serviceSecret);
      
      // Attach service info to request
      (req as any).service = {
        name: decoded.serviceName,
        audience: decoded.aud,
      };

      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid service token');
    }
  }
}

