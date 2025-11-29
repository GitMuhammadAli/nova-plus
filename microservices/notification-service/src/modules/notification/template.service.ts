import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TemplateService {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  /**
   * Render template with data
   */
  async render(templateName: string, data: Record<string, any>): Promise<any> {
    // Load template if not cached
    if (!this.templates.has(templateName)) {
      await this.loadTemplate(templateName);
    }

    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    return template(data);
  }

  /**
   * Load template from file system
   */
  private async loadTemplate(templateName: string): Promise<void> {
    try {
      // In production, templates would be in S3 or a template service
      const templatePath = path.join(
        __dirname,
        '../../templates',
        `${templateName}.hbs`,
      );

      if (fs.existsSync(templatePath)) {
        const source = fs.readFileSync(templatePath, 'utf-8');
        this.templates.set(templateName, Handlebars.compile(source));
      } else {
        // Use default template
        this.templates.set(templateName, Handlebars.compile(this.getDefaultTemplate(templateName)));
      }
    } catch (error) {
      // Fallback to default
      this.templates.set(templateName, Handlebars.compile(this.getDefaultTemplate(templateName)));
    }
  }

  /**
   * Get default template
   */
  private getDefaultTemplate(templateName: string): string {
    // Default templates based on common notification types
    const defaults: Record<string, string> = {
      'welcome-email': `
        <h1>Welcome to NovaPulse!</h1>
        <p>Hello {{name}},</p>
        <p>Welcome to NovaPulse. We're excited to have you on board!</p>
      `,
      'invite-email': `
        <h1>You've been invited!</h1>
        <p>Hello,</p>
        <p>You've been invited to join {{companyName}} on NovaPulse.</p>
        <p><a href="{{inviteLink}}">Accept Invitation</a></p>
      `,
      'password-reset': `
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password:</p>
        <p><a href="{{resetLink}}">Reset Password</a></p>
      `,
    };

    return defaults[templateName] || '<p>{{message}}</p>';
  }
}

