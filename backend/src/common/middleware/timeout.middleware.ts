import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import logger from '../logger/winston.logger';

@Injectable()
export class TimeoutMiddleware implements NestMiddleware {
  private readonly timeout: number;

  constructor(private configService: ConfigService) {
    // Default timeout: 30 seconds (AWS API Gateway limit is 29s)
    this.timeout = this.configService.get<number>('requestTimeoutMs', 30000);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] as string;
    const startTime = Date.now();

    // Set response timeout
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          requestId,
          path: req.path,
          method: req.method,
          duration: Date.now() - startTime,
        });

        res.status(504).json({
          statusCode: 504,
          message: 'Request timeout',
          requestId,
        });
      }
    }, this.timeout);

    // Clear timeout on response
    res.on('finish', () => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      // Log slow requests
      if (duration > 5000) {
        logger.warn('Slow request detected', {
          requestId,
          path: req.path,
          method: req.method,
          duration,
          statusCode: res.statusCode,
        });
      }
    });

    // Clear timeout on close
    res.on('close', () => {
      clearTimeout(timeoutId);
    });

    next();
  }
}

