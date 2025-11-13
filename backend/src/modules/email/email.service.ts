import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter (Mailtrap or SMTP)
   */
  private initializeTransporter() {
    const mailtrapHost = this.configService.get<string>('MAILTRAP_HOST');
    const mailtrapPort = this.configService.get<number>('MAILTRAP_PORT');
    const mailtrapUser = this.configService.get<string>('MAILTRAP_USER');
    const mailtrapPass = this.configService.get<string>('MAILTRAP_PASS');
    const emailFrom = this.configService.get<string>('EMAIL_FROM') || 'noreply@novapulse.com';
    const emailFromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'NovaPulse';

    // Use Mailtrap if configured, otherwise use SMTP settings
    if (mailtrapHost && mailtrapUser && mailtrapPass) {
      this.transporter = nodemailer.createTransport({
        host: mailtrapHost,
        port: mailtrapPort || 2525,
        auth: {
          user: mailtrapUser,
          pass: mailtrapPass,
        },
      });
      this.logger.log('✅ Email service initialized with Mailtrap');
    } else {
      // Fallback: Log only mode (development)
      this.logger.warn('⚠️ Mailtrap not configured. Emails will be logged only.');
      this.logger.warn('   Set MAILTRAP_HOST, MAILTRAP_USER, MAILTRAP_PASS in .env');
    }
  }

  /**
   * Send invite email via Mailtrap
   */
  async sendInviteEmail(data: {
    to: string;
    inviteLink: string;
    companyName: string;
    inviterName: string;
    role: string;
    expiresAt: Date;
  }) {
    const { to, inviteLink, companyName, inviterName, role, expiresAt } = data;
    const emailFrom = this.configService.get<string>('EMAIL_FROM') || 'noreply@novapulse.com';
    const emailFromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'NovaPulse';

    // Email template
    const emailHtml = this.getInviteEmailTemplate({
      inviteLink,
      companyName,
      inviterName,
      role,
      expiresAt,
    });

    const emailText = `
You've been invited to join ${companyName} on NovaPulse!

${inviterName} has invited you to join ${companyName} as a ${role}.

Accept your invitation: ${inviteLink}

This invitation expires on ${new Date(expiresAt).toLocaleDateString()}.

If you didn't expect this invitation, you can safely ignore this email.
    `.trim();

    // Send email if transporter is configured
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: `"${emailFromName}" <${emailFrom}>`,
          to,
          subject: `You've been invited to join ${companyName} on NovaPulse`,
          text: emailText,
          html: emailHtml,
        });

        this.logger.log(`✅ Invite email sent to: ${to}`);
        this.logger.debug(`   Message ID: ${info.messageId}`);
        return { success: true, message: 'Invite email sent successfully', messageId: info.messageId };
      } catch (error) {
        this.logger.error(`❌ Failed to send invite email to ${to}:`, error);
        throw error;
      }
    } else {
      // Log mode (development without Mailtrap)
      this.logger.log(`📧 Invite email would be sent to: ${to}`);
      this.logger.log(`   Company: ${companyName}`);
      this.logger.log(`   Inviter: ${inviterName}`);
      this.logger.log(`   Role: ${role}`);
      this.logger.log(`   Link: ${inviteLink}`);
      this.logger.log(`   Expires: ${expiresAt}`);
      
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug('Email HTML:', emailHtml);
      }

      return { success: true, message: 'Invite email logged (Mailtrap not configured)' };
    }
  }

  /**
   * Email template for invites
   */
  private getInviteEmailTemplate(data: {
    inviteLink: string;
    companyName: string;
    inviterName: string;
    role: string;
    expiresAt: Date;
  }): string {
    const { inviteLink, companyName, inviterName, role, expiresAt } = data;
    const expiryDate = new Date(expiresAt).toLocaleDateString();

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to join ${companyName}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">NovaPulse</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">You've been invited!</h2>
    
    <p>Hi there,</p>
    
    <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on NovaPulse as a <strong>${role}</strong>.</p>
    
    <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
      <p style="margin: 0;"><strong>Company:</strong> ${companyName}</p>
      <p style="margin: 5px 0;"><strong>Role:</strong> ${role}</p>
      <p style="margin: 5px 0;"><strong>Invited by:</strong> ${inviterName}</p>
      <p style="margin: 5px 0;"><strong>Expires:</strong> ${expiryDate}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteLink}" 
         style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Accept Invitation
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      Or copy and paste this link into your browser:<br>
      <a href="${inviteLink}" style="color: #667eea; word-break: break-all;">${inviteLink}</a>
    </p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="color: #666; font-size: 12px; margin-bottom: 0;">
      This invitation will expire on ${expiryDate}. If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} NovaPulse. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim();
  }
}

