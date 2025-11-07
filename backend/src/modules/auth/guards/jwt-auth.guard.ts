import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { getJwtSecret } from '../utils/jwt-secret.util';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // If there's an error or no user, handle it
    if (err || !user) {
      const token = request?.cookies?.access_token || 
                   request?.headers?.authorization?.replace('Bearer ', '');
      
      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ JWT Auth Guard Failed:', {
          hasToken: !!token,
          tokenLength: token?.length || 0,
          error: err?.message || null,
          info: info?.message || null,
          cookieKeys: request?.cookies ? Object.keys(request.cookies) : [],
          url: request?.url,
        });
      }
      
      // If no token provided
      if (!token) {
        throw new UnauthorizedException('Authentication required. Please log in.');
      }
      
      // If token exists but validation failed
      if (info?.message) {
        if (info.message === 'jwt expired') {
          throw new UnauthorizedException('Token expired. Please refresh your session.');
        }
        if (info.message === 'jwt malformed') {
          throw new UnauthorizedException('Invalid token format.');
        }
        if (info.message === 'invalid signature') {
          // Token was signed with a different secret - user needs to re-login
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Token signature mismatch. Current secret:', getJwtSecret());
            console.error('💡 User needs to clear cookies and re-login to get a new token.');
          }
          throw new UnauthorizedException('Token signature invalid. Please log in again.');
        }
      }
      
      // Generic unauthorized error
      throw new UnauthorizedException('Invalid or expired token. Please log in again.');
    }
    
    return user;
  }
}