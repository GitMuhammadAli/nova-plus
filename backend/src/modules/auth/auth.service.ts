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

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ForbiddenException('Email already registered.');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({ ...dto, password: hashed });
    return this.buildResponseTokens(user);
  }

  async login(dto: LoginDto, userAgent: string, ip: string) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new UnauthorizedException('Invalid credentials.');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials.');

    return this.buildResponseTokens(user, userAgent, ip);
  }

  async buildResponseTokens(user: User, userAgent?: string, ip?: string) {
    const payload = { sub: user._id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.sessionModel.create({
      userId: user._id,
      refreshTokenHash: refreshHash,
      userAgent,
      ip,
    });

    return { accessToken, refreshToken, user };
  }

  async refresh(userId: string, refreshToken: string) {
    const sessions = await this.sessionModel.find({ userId });
    const valid = await Promise.any(
      sessions.map(async (s) => {
        const match = await bcrypt.compare(refreshToken, s.refreshTokenHash);
        return match ? s : null;
      }),
    ).catch(() => null);

    if (!valid) throw new ForbiddenException('Invalid session.');

    const payload = { sub: userId };
    const newAccessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    return { accessToken: newAccessToken };
  }

  async logout(userId: string, refreshToken: string) {
    const sessions = await this.sessionModel.find({ userId });
    for (const s of sessions) {
      if (await bcrypt.compare(refreshToken, s.refreshTokenHash)) {
        await this.sessionModel.deleteOne({ _id: s._id });
      }
    }
    return { message: 'Logged out successfully' };
  }

  async generateTokens(user: UserDocument) {
  const payload = {
    sub: user._id?.toString(),
    email: user.email,
    role: user.role,  // ✅ include role in token
  };

  const accessToken = this.jwtService.sign(payload, {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '15m',
  });

  const refreshToken = this.jwtService.sign(payload, {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
  });

  return { accessToken, refreshToken };
}



}
