import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import logger from '../logger/winston.logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    }

    logger.error('HTTP Exception: %o', {
      status,
      message,
      path: req?.url,
      method: req?.method,
      stack: (exception as any)?.stack,
    });

    // For 401 errors, include helpful message
    if (status === 401) {
      res.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: req?.url,
        message: message || 'Authentication required',
        error: 'Unauthorized',
      });
      return;
    }

    res.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req?.url,
      message,
    });
  }
}
