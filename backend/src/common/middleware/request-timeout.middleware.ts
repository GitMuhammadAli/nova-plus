import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * Request timeout middleware
 * Sets a timeout for individual requests to prevent hanging
 */
@Injectable()
export class RequestTimeoutMiddleware implements NestMiddleware {
  private readonly timeout: number;

  constructor(private configService: ConfigService) {
    // Service-level timeout (should be less than gateway timeout)
    this.timeout = this.configService.get<number>('serviceTimeoutMs', 25000);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          statusCode: 504,
          message: 'Service request timeout',
          timestamp: new Date().toISOString(),
        });
      }
    }, this.timeout);

    // Clear timeout when response finishes
    res.on('finish', () => clearTimeout(timeoutId));
    res.on('close', () => clearTimeout(timeoutId));

    next();
  }
}

