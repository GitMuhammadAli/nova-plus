import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import getRawBody from 'raw-body';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Only capture raw body for webhook routes
    if (req.path.includes('/billing/webhook') || req.path.includes('/webhooks')) {
      getRawBody(req, {
        length: req.headers['content-length'],
        limit: '10mb',
        encoding: 'utf8',
      })
        .then((rawBody) => {
          (req as any).rawBody = rawBody;
          next();
        })
        .catch((err) => {
          next(err);
        });
    } else {
      next();
    }
  }
}

