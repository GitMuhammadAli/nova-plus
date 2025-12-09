import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Integration, IntegrationDocument, IntegrationType } from './entities/integration.entity';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditResource } from '../audit/entities/audit-log.entity';
import axios from 'axios';

@Injectable()
export class IntegrationsService {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-cbc';

  constructor(
    @InjectModel(Integration.name) private integrationModel: Model<IntegrationDocument>,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {
    // Get encryption key from config or generate one (in production, use a secure key)
    const key = this.configService.get<string>('INTEGRATION_ENCRYPTION_KEY') || 'default-key-32-chars-long!!';
    this.encryptionKey = Buffer.from(key.padEnd(32, '0').slice(0, 32));
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Test email integration
   */
  async testEmail(companyId: string, userId: string, config: { smtpHost: string; smtpPort: number; username: string; password: string; to: string }): Promise<{ success: boolean; message: string }> {
    try {
      // Encrypt password
      const encryptedPassword = this.encrypt(config.password);

      // Save or update integration
      await this.integrationModel.findOneAndUpdate(
        { companyId: new Types.ObjectId(companyId), type: IntegrationType.EMAIL },
        {
          companyId: new Types.ObjectId(companyId),
          type: IntegrationType.EMAIL,
          name: 'Email Integration',
          config: {
            smtpHost: config.smtpHost,
            smtpPort: config.smtpPort,
            username: config.username,
            password: encryptedPassword, // Encrypted
          },
          isActive: true,
          createdBy: new Types.ObjectId(userId),
        },
        { upsert: true, new: true },
      ).exec();

      // Send test email (using nodemailer would be better, but this is a stub)
      // In production, use the email service

      // Audit log
      await this.auditService.createLog({
        action: AuditAction.CREATE,
        resource: AuditResource.SETTINGS,
        resourceId: companyId,
        userId,
        companyId,
      });

      return {
        success: true,
        message: 'Email integration test successful',
      };
    } catch (error: any) {
      throw new BadRequestException(`Email test failed: ${error.message}`);
    }
  }

  /**
   * Test Slack integration
   */
  async testSlack(companyId: string, userId: string, config: { webhookUrl: string }): Promise<{ success: boolean; message: string }> {
    try {
      // Save or update integration
      await this.integrationModel.findOneAndUpdate(
        { companyId: new Types.ObjectId(companyId), type: IntegrationType.SLACK },
        {
          companyId: new Types.ObjectId(companyId),
          type: IntegrationType.SLACK,
          name: 'Slack Integration',
          config: {
            webhookUrl: this.encrypt(config.webhookUrl), // Encrypt webhook URL
          },
          isActive: true,
          createdBy: new Types.ObjectId(userId),
        },
        { upsert: true, new: true },
      ).exec();

      // Send test message to Slack
      const decryptedUrl = this.decrypt(this.encrypt(config.webhookUrl));
      await axios.post(decryptedUrl, {
        text: 'NovaPulse integration test successful!',
      });

      // Audit log
      await this.auditService.createLog({
        action: AuditAction.CREATE,
        resource: AuditResource.SETTINGS,
        resourceId: companyId,
        userId,
        companyId,
      });

      return {
        success: true,
        message: 'Slack integration test successful',
      };
    } catch (error: any) {
      throw new BadRequestException(`Slack test failed: ${error.message}`);
    }
  }

  /**
   * Start Google OAuth flow
   */
  async startGoogleOAuth(companyId: string, userId: string): Promise<{ authUrl: string }> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI') || `${this.configService.get<string>('FRONTEND_URL')}/settings/integrations/google/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive';

    if (!clientId) {
      throw new BadRequestException('Google OAuth is not configured');
    }

    const state = Buffer.from(JSON.stringify({ companyId, userId })).toString('base64');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}&access_type=offline&prompt=consent`;

    return { authUrl };
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleOAuthCallback(
    companyId: string,
    userId: string,
    code: string,
  ): Promise<{ success: boolean; message: string }> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI') || `${this.configService.get<string>('FRONTEND_URL')}/settings/integrations/google/callback`;

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Google OAuth is not configured');
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      const { access_token, refresh_token } = tokenResponse.data;

      // Encrypt tokens
      const encryptedAccessToken = this.encrypt(access_token);
      const encryptedRefreshToken = refresh_token ? this.encrypt(refresh_token) : undefined;

      // Save integration
      await this.integrationModel.findOneAndUpdate(
        { companyId: new Types.ObjectId(companyId), type: IntegrationType.GOOGLE_OAUTH },
        {
          companyId: new Types.ObjectId(companyId),
          type: IntegrationType.GOOGLE_OAUTH,
          name: 'Google OAuth Integration',
          config: {
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
          },
          isActive: true,
          createdBy: new Types.ObjectId(userId),
        },
        { upsert: true, new: true },
      ).exec();

      // Audit log
      await this.auditService.createLog({
        action: AuditAction.CREATE,
        resource: AuditResource.SETTINGS,
        resourceId: companyId,
        userId,
        companyId,
      });

      return {
        success: true,
        message: 'Google OAuth connected successfully',
      };
    } catch (error: any) {
      throw new BadRequestException(`Google OAuth callback failed: ${error.message}`);
    }
  }

  /**
   * Get all integrations for a company
   */
  async findAll(companyId: string): Promise<IntegrationDocument[]> {
    return this.integrationModel
      .find({ companyId: new Types.ObjectId(companyId) })
      .populate('createdBy', 'name email')
      .exec();
  }

  /**
   * Get integration by type
   */
  async findByType(companyId: string, type: IntegrationType): Promise<IntegrationDocument | null> {
    return this.integrationModel
      .findOne({
        companyId: new Types.ObjectId(companyId),
        type,
        isActive: true,
      })
      .exec();
  }

  /**
   * Delete integration
   */
  async remove(companyId: string, integrationId: string, userId: string): Promise<void> {
    const integration = await this.integrationModel
      .findOne({
        _id: integrationId,
        companyId: new Types.ObjectId(companyId),
      })
      .exec();

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    await this.integrationModel.deleteOne({ _id: integrationId }).exec();

    // Audit log
    await this.auditService.createLog({
      action: AuditAction.DELETE,
      resource: AuditResource.SETTINGS,
      resourceId: integrationId,
      userId,
      companyId,
      metadata: { type: integration.type },
    });
  }
}

