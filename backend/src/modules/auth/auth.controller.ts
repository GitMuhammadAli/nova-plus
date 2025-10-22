import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Response, Request, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
   return {
    message: 'User registered successfully',
    user,
    accessToken,
    refreshToken,
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
    this.setAuthCookies(res, accessToken, refreshToken);
    return {
    message: 'Login successful',
    user,
    accessToken,
    refreshToken,
  };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new BadRequestException('Refresh token not provided');
    }

    const payload: any =
      this.authService['jwtService']?.decode(refreshToken) ?? null;
    if (!payload || !payload.sub) {
      throw new BadRequestException('Invalid refresh token');
    }

    const data = await this.authService.refresh(payload.sub, refreshToken);
    res.cookie('access_token', data.accessToken, this.cookieConfig());
    return { accessToken: data.accessToken };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new BadRequestException('Refresh token not provided');
    }

    const payload: any =
      this.authService['jwtService']?.decode(refreshToken) ?? null;
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
    res.cookie('access_token', accessToken, this.cookieConfig(15 * 60 * 1000));
    res.cookie(
      'refresh_token',
      refreshToken,
      this.cookieConfig(7 * 24 * 60 * 60 * 1000),
    );
  }

  private cookieConfig(maxAge = 0): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // choose a concrete sameSite value; use 'lax' which is a safe default
      sameSite: 'lax',
      path: '/',
      maxAge,
    };
  }
}
