import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      const token = request?.cookies?.access_token || 
                   request?.headers?.authorization?.replace('Bearer ', '');
      console.log('🔐 JWT Auth Guard:', {
        hasUser: !!user,
        hasToken: !!token,
        tokenLength: token?.length || 0,
        error: err?.message || null,
        info: info?.message || null,
      });
    }
    
    if (!user) {
      // Check if token is missing
      const token = request?.cookies?.access_token || 
                   request?.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }
      
      // Log detailed error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ JWT validation failed:', {
          error: err?.message,
          info: info?.message,
          tokenPreview: token?.substring(0, 20) + '...',
        });
      }
      
      // If token exists but invalid, throw the original error or unauthorized
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    if (err) {
      throw err;
    }
    return user;
  }
}