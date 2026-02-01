import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import logger from '../logger/winston.logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const now = Date.now();
    logger.debug(`--> ${method} ${url}`);

    return next
      .handle()
      .pipe(
        tap(() => logger.debug(`<-- ${method} ${url} ${Date.now() - now}ms`)),
      );
  }
}
