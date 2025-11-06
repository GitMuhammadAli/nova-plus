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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.register(dto);
    this.setAuthCookies(res, accessToken, refreshToken);
    
    // Return consistent format - user object (password excluded)
    const userObj = user.toObject ? user.toObject() : user;
    const { password: _, ...userWithoutPassword } = userObj;
    
    return {
      success: true,
      message: 'User registered successfully',
      accessToken, // Include token in response for Postman/API clients
      refreshToken, // Include refresh token
      token: accessToken, // Alias for backward compatibility
      user: userWithoutPassword,
    };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || " ";
    const userAgent = String(req.headers['user-agent'] ?? '');
    const { accessToken, refreshToken, user } = await this.authService.login(
      dto,
      userAgent,
      ip,
    );
    
    // Set cookies BEFORE returning response
    this.setAuthCookies(res, accessToken, refreshToken);
    
    // Return consistent format - user object (password excluded)
    const userObj = user.toObject ? user.toObject() : user;
    const { password: _, ...userWithoutPassword } = userObj;
    
    const response = {
      success: true,
      message: 'Login successful',
      accessToken, // Include token in response for Postman/API clients
      refreshToken, // Include refresh token
      token: accessToken, // Alias for backward compatibility
      user: userWithoutPassword,
    };
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Login response:', {
        hasUser: !!userWithoutPassword,
        userId: userWithoutPassword._id,
        email: userWithoutPassword.email,
        hasToken: !!accessToken,
      });
    }
    
    return response;
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Try to get refresh token from cookies
    const refreshToken = req.cookies?.['refresh_token'] || req.cookies?.refresh_token;
    
    if (!refreshToken) {
      throw new BadRequestException('Refresh token not provided');
    }

    // Decode the refresh token to get user ID (decode doesn't verify signature)
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
    
    // Set new access token cookie with proper expiration
    res.cookie('access_token', data.accessToken, this.cookieConfig(15 * 60 * 1000));
    
    return { 
      success: true,
      accessToken: data.accessToken,
      token: data.accessToken, // Alias for backward compatibility
      refreshToken: refreshToken, // Return the same refresh token (it's still valid)
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: Request) {
    // req.user is set by JwtStrategy.validate() which already excludes password
    return req.user;
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new BadRequestException('Refresh token not provided');
    }

    // Decode refresh token
    const jwt = require('jsonwebtoken');
    const payload: any = jwt.decode(refreshToken);
    if (!payload || !payload.sub) {
      throw new BadRequestException('Invalid refresh token');
    }

    await this.authService.logout(payload.sub, refreshToken);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const accessConfig = this.cookieConfig(15 * 60 * 1000);
    const refreshConfig = this.cookieConfig(7 * 24 * 60 * 60 * 1000);
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('🍪 Setting cookies:', {
        accessTokenLength: accessToken?.length || 0,
        refreshTokenLength: refreshToken?.length || 0,
        accessConfig,
        refreshConfig,
      });
    }
    
    res.cookie('access_token', accessToken, accessConfig);
    res.cookie('refresh_token', refreshToken, refreshConfig);
  }

  private cookieConfig(maxAge = 0): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: isProduction && process.env.COOKIE_SECURE === 'true',
      sameSite: (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax',
      path: '/',
    };
    
    if (maxAge > 0) {
      cookieOptions.maxAge = maxAge;
    }
    
    if (process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }
    
    return cookieOptions;
  }
}
