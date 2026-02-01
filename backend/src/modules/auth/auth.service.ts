import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './../user/entities/user.entity';
import { Session } from './entities/session.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MfaService } from './mfa.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private jwtService: JwtService,
    private mfaService: MfaService,
  ) {}

  async register(dto: RegisterDto) {
    console.log('data is ', dto);
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ForbiddenException('Email already registered.');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({ ...dto, password: hashed });
    return this.buildResponseTokens(user);
  }

  async login(dto: LoginDto, userAgent: string, ip: string): Promise<any> {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new UnauthorizedException('Invalid credentials.');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials.');

    // Check if MFA is enabled
    if (user.mfa?.enabled) {
      // If MFA is enabled but no token provided, return MFA required flag
      if (!dto.mfaToken) {
        return {
          requiresMfa: true,
          userId: user._id.toString(),
          message: 'MFA token required',
        };
      }

      // Verify MFA token
      const mfaValid = await this.mfaService.verifyMfaToken(
        user._id.toString(),
        dto.mfaToken,
      );
      if (!mfaValid) {
        throw new UnauthorizedException('Invalid MFA token.');
      }
    }

    return this.buildResponseTokens(user, userAgent, ip);
  }

  async buildResponseTokens(user: User | any, userAgent?: string, ip?: string) {
    const userId = user._id?.toString() || user._id;
    const payload = {
      sub: userId,
      email: user.email,
      role: user.role,
      orgId: user.orgId?.toString() || user.orgId, // Include orgId in JWT
      companyId: user.companyId?.toString() || user.companyId, // Include companyId in JWT
    };

    // JwtService uses the secret from JwtModule configuration
    // Ensure JwtModule is configured with getJwtSecret() in auth.module.ts
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      const { getJwtSecret } = require('./utils/jwt-secret.util');
      const currentSecret = getJwtSecret();
      console.log('✅ Tokens generated:', {
        userId,
        email: user.email,
        secretUsed: currentSecret,
        accessTokenLength: accessToken.length,
        refreshTokenLength: refreshToken.length,
      });
    }

    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.sessionModel.create({
      userId: userId,
      refreshTokenHash: refreshHash,
      userAgent,
      ip,
    });

    return { accessToken, refreshToken, user };
  }

  async refresh(userId: string, refreshToken: string) {
    // Convert userId to string if it's ObjectId
    const userIdStr = userId?.toString() || userId;

    // Find all sessions for this user (try both string and ObjectId format)
    const sessions = await this.sessionModel
      .find({
        $or: [{ userId: userIdStr }, { userId: userId }],
      })
      .exec();

    if (!sessions || sessions.length === 0) {
      throw new ForbiddenException('No sessions found for user.');
    }

    // Try to match the refresh token with any session
    let validSession: any = null;
    for (const session of sessions) {
      try {
        const match = await bcrypt.compare(
          refreshToken,
          session.refreshTokenHash,
        );
        if (match) {
          validSession = session;
          break;
        }
      } catch (error) {
        // Continue to next session if comparison fails
        continue;
      }
    }

    if (!validSession) {
      throw new ForbiddenException('Invalid refresh token.');
    }

    // Get user to include email in token
    const user = await this.userModel.findById(userIdStr);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Generate new access token with user info
    // JwtService uses the secret from JwtModule configuration
    const payload = {
      sub: userIdStr,
      email: user.email,
      role: user.role,
      orgId: user.orgId?.toString() || user.orgId,
      companyId: user.companyId?.toString() || user.companyId,
    };
    const newAccessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
    return { accessToken: newAccessToken };
  }

  async logout(userId: string, refreshToken: string) {
    const userIdStr = userId?.toString() || userId;
    const sessions = await this.sessionModel
      .find({
        $or: [{ userId: userIdStr }, { userId: userId }],
      })
      .exec();

    for (const s of sessions) {
      try {
        if (await bcrypt.compare(refreshToken, s.refreshTokenHash)) {
          await this.sessionModel.deleteOne({ _id: s._id });
          return { message: 'Logged out successfully' };
        }
      } catch (error) {
        continue;
      }
    }
    return { message: 'Logged out successfully' };
  }

  async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id?.toString(),
      email: user.email,
      role: user.role, // ✅ include role in token
      orgId: user.orgId?.toString() || user.orgId,
      companyId: user.companyId?.toString() || user.companyId,
    };

    // Use JwtService with the secret configured in JwtModule (same as buildResponseTokens)
    // This ensures consistency - all tokens use the same secret source
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    // For refresh token, use same secret source for consistency
    // If you need separate refresh secret, configure it in JwtModule
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
