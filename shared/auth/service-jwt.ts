/**
 * Service-to-Service JWT Authentication
 * Used for inter-service communication
 */

import * as jwt from 'jsonwebtoken';

export interface ServiceJwtPayload {
  iss: string; // Issuer (service name)
  sub: string; // Subject (service name)
  aud: string; // Audience (target service)
  iat: number; // Issued at
  exp: number; // Expiration
  serviceName: string;
  permissions?: string[];
}

export class ServiceJwt {
  /**
   * Generate service JWT token
   */
  static generate(
    serviceName: string,
    targetService: string,
    secret: string,
    expiresIn: string = '1h',
  ): string {
    const payload: ServiceJwtPayload = {
      iss: serviceName,
      sub: serviceName,
      aud: targetService,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour default
      serviceName,
    };

    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * Verify service JWT token
   */
  static verify(
    token: string,
    secret: string,
    expectedAudience?: string,
  ): ServiceJwtPayload {
    try {
      const decoded = jwt.verify(token, secret) as ServiceJwtPayload;

      if (expectedAudience && decoded.aud !== expectedAudience) {
        throw new Error('Token audience mismatch');
      }

      return decoded;
    } catch (error) {
      throw new Error(`Service JWT verification failed: ${error.message}`);
    }
  }

  /**
   * Extract service name from token (without verification)
   */
  static extractServiceName(token: string): string | null {
    try {
      const decoded = jwt.decode(token) as ServiceJwtPayload;
      return decoded?.serviceName || null;
    } catch {
      return null;
    }
  }
}

