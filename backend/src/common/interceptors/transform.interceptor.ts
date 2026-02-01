import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const url = request?.url || '';

    // Skip transformation for auth routes - they handle their own response format
    if (url.includes('/auth/')) {
      return next.handle();
    }

    // For other routes, wrap in standard format
    return next.handle().pipe(map((data) => ({ success: true, data })));
  }
}
