import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  UseGuards,
  BadRequestException,
  Get,
} from '@nestjs/common';
import type { Response, Request, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RedisThrottleGuard } from '../../common/guards/redis-throttle.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  @UseGuards(RedisThrottleGuard)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.register(dto);
    
    // Set cookies
    this.setAuthCookies(res, accessToken, refreshToken);
    
    // Return user without password
    const userObj = user.toObject ? user.toObject() : user;
    const { password: _, ...userWithoutPassword } = userObj;
    
    return {
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword,
    };
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(RedisThrottleGuard)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = String(req.headers['user-agent'] ?? '');
    
    const result = await this.authService.login(
      dto,
      userAgent,
      ip,
    );
    
    // Check if MFA is required
    if (result.requiresMfa) {
      return {
        success: false,
        requiresMfa: true,
        userId: result.userId,
        message: result.message,
      };
    }
    
    const { accessToken, refreshToken, user } = result;
    
    // Set cookies BEFORE returning response
    this.setAuthCookies(res, accessToken, refreshToken);
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      const { getJwtSecret } = require('./utils/jwt-secret.util');
      console.log('✅ Login successful - Cookies set:', {
        email: user.email,
        accessTokenLength: accessToken.length,
        refreshTokenLength: refreshToken.length,
        secretUsed: getJwtSecret(),
        cookiesSet: true,
      });
    }
    
    // Return user without password
    const userObj = user.toObject ? user.toObject() : user;
    const { password: _, ...userWithoutPassword } = userObj;
    
    return {
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
    };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Get refresh token from cookies
    const refreshToken = req.cookies?.['refresh_token'] || req.cookies?.refresh_token;
    
    if (!refreshToken) {
      throw new BadRequestException('Refresh token not provided');
    }

    // Decode to get user ID
    let payload: any = null;
    try {
      const jwt = require('jsonwebtoken');
      payload = jwt.decode(refreshToken);
    } catch (error) {
      throw new BadRequestException('Invalid refresh token format');
    }

    if (!payload || !payload.sub) {
      throw new BadRequestException('Invalid refresh token payload');
    }

    // Refresh the access token
    const data = await this.authService.refresh(payload.sub, refreshToken);
    
    // Set new access token cookie
    const cookieConfig = this.cookieConfig(15 * 60 * 1000); // 15 minutes
    res.cookie('access_token', data.accessToken, cookieConfig);
    
    return { 
      success: true,
      accessToken: data.accessToken,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async getCurrentUser(@Req() req: Request) {
    // req.user is set by JwtStrategy.validate()
    return req.user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['refresh_token'] || req.cookies?.refresh_token;
    
    if (refreshToken) {
      try {
        const jwt = require('jsonwebtoken');
        const payload: any = jwt.decode(refreshToken);
        if (payload?.sub) {
          await this.authService.logout(payload.sub, refreshToken);
        }
      } catch (error) {
        // Continue with cookie clearing even if logout fails
      }
    }
    
    // Clear cookies
    res.clearCookie('access_token', { path: '/', httpOnly: true, sameSite: 'lax' });
    res.clearCookie('refresh_token', { path: '/', httpOnly: true, sameSite: 'lax' });
    
    return { 
      success: true,
      message: 'Logged out successfully' 
    };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Access token: 15 minutes
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    
    // Refresh token: 7 days
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private cookieConfig(maxAge = 0): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    };
    
    if (maxAge > 0) {
      cookieOptions.maxAge = maxAge;
    }
    
    if (isProduction && process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }
    
    return cookieOptions;
  }
}
