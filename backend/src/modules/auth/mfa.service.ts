import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import logger from '../../common/logger/winston.logger';

@Injectable()
export class MfaService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /**
   * Generate TOTP secret and QR code for user
   */
  async setupMfa(
    userId: string,
    companyId: string,
  ): Promise<{ secret: string; qrCode: string; recoveryCodes: string[] }> {
    const user = await this.userModel
      .findOne({
        _id: userId,
        companyId: new Types.ObjectId(companyId),
      })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `NovaPulse (${user.email})`,
      issuer: 'NovaPulse',
      length: 32,
    });

    // Generate recovery codes
    const recoveryCodes = this.generateRecoveryCodes();

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

    // Store secret and recovery codes (but don't enable yet)
    user.mfa = {
      enabled: false,
      secret: secret.base32,
      recoveryCodes,
    };
    await user.save();

    logger.info('MFA setup initiated', { userId, companyId });

    return {
      secret: secret.base32 || '',
      qrCode,
      recoveryCodes,
    };
  }

  /**
   * Verify TOTP code and enable MFA
   */
  async verifyAndEnableMfa(
    userId: string,
    companyId: string,
    token: string,
  ): Promise<{ success: boolean }> {
    const user = await this.userModel
      .findOne({
        _id: userId,
        companyId: new Types.ObjectId(companyId),
      })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.mfa?.secret) {
      throw new BadRequestException('MFA not set up. Please set up MFA first.');
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.mfa.secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (60 seconds) of tolerance
    });

    if (!verified) {
      throw new BadRequestException('Invalid TOTP code');
    }

    // Enable MFA
    user.mfa.enabled = true;
    await user.save();

    logger.info('MFA enabled', { userId, companyId });

    return { success: true };
  }

  /**
   * Verify TOTP code during login
   */
  async verifyMfaToken(userId: string, token: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();

    if (!user || !user.mfa?.enabled || !user.mfa?.secret) {
      return false;
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfa.secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    return verified;
  }

  /**
   * Verify recovery code
   */
  async verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();

    if (!user || !user.mfa?.enabled || !user.mfa?.recoveryCodes) {
      return false;
    }

    const index = user.mfa.recoveryCodes.indexOf(code);
    if (index === -1) {
      return false;
    }

    // Remove used recovery code
    user.mfa.recoveryCodes.splice(index, 1);
    await user.save();

    logger.info('Recovery code used', { userId });

    return true;
  }

  /**
   * Disable MFA for user
   */
  async disableMfa(
    userId: string,
    companyId: string,
  ): Promise<{ success: boolean }> {
    const user = await this.userModel
      .findOne({
        _id: userId,
        companyId: new Types.ObjectId(companyId),
      })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.mfa = {
      enabled: false,
    };
    await user.save();

    logger.info('MFA disabled', { userId, companyId });

    return { success: true };
  }

  /**
   * Regenerate recovery codes
   */
  async regenerateRecoveryCodes(
    userId: string,
    companyId: string,
  ): Promise<{ recoveryCodes: string[] }> {
    const user = await this.userModel
      .findOne({
        _id: userId,
        companyId: new Types.ObjectId(companyId),
      })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.mfa?.enabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    const recoveryCodes = this.generateRecoveryCodes();
    user.mfa.recoveryCodes = recoveryCodes;
    await user.save();

    logger.info('Recovery codes regenerated', { userId, companyId });

    return { recoveryCodes };
  }

  /**
   * Check if MFA is enabled for user
   */
  async isMfaEnabled(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();
    return user?.mfa?.enabled || false;
  }

  /**
   * Generate recovery codes
   */
  private generateRecoveryCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-character alphanumeric code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}
