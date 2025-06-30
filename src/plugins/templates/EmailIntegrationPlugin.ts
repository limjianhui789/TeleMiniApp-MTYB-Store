// ============================================================================
// MTYB Virtual Goods Platform - Email Integration Plugin Template
// ============================================================================

import { BasePlugin } from '../../core/plugin/BasePlugin';
import type {
  PluginContext,
  DeliveryResult,
  ValidationResult,
  PluginHealthStatus,
  Order,
  Product,
} from '../../types';
import { Logger } from '../../core/utils/Logger';

// ============================================================================
// Email Integration Types
// ============================================================================

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  apiKey?: string;
  domain?: string;
  region?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType: string;
  encoding?: string;
}

export interface AccountCredentials {
  email: string;
  password: string;
  additionalInfo?: Record<string, any>;
  expiresAt?: Date;
  planType?: string;
  region?: string;
}

export interface EmailDeliveryData {
  credentials: AccountCredentials[];
  deliveryMethod: 'email' | 'telegram' | 'both';
  emailTemplate: string;
  customInstructions?: string;
  supportInfo: {
    email: string;
    telegram?: string;
    website?: string;
  };
}

// ============================================================================
// Email Service Interface
// ============================================================================

interface EmailService {
  sendEmail(to: string, template: EmailTemplate, variables: Record<string, any>): Promise<boolean>;
  validateCredentials(): Promise<boolean>;
  getStatus(): Promise<{ isConnected: boolean; lastError?: string }>;
}

// ============================================================================
// SMTP Email Service Implementation
// ============================================================================

class SmtpEmailService implements EmailService {
  private config: EmailConfig;
  private logger: Logger;

  constructor(config: EmailConfig) {
    this.config = config;
    this.logger = new Logger('SmtpEmailService');
  }

  async sendEmail(
    to: string,
    template: EmailTemplate,
    variables: Record<string, any>
  ): Promise<boolean> {
    try {
      // Simulate email sending - replace with actual SMTP implementation
      this.logger.info('Sending email', { to, template: template.id });

      // Replace template variables
      let htmlContent = template.htmlContent;
      let textContent = template.textContent;
      let subject = template.subject;

      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), String(value));
        textContent = textContent.replace(new RegExp(placeholder, 'g'), String(value));
        subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      });

      // Simulate sending delay
      await this.delay(2000);

      this.logger.info('Email sent successfully', { to, subject });
      return true;
    } catch (error) {
      this.logger.error('Failed to send email', { error, to });
      return false;
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // Simulate credential validation
      await this.delay(1000);
      return true;
    } catch (error) {
      this.logger.error('Failed to validate email credentials', { error });
      return false;
    }
  }

  async getStatus(): Promise<{ isConnected: boolean; lastError?: string }> {
    try {
      // Simulate status check
      await this.delay(500);
      return { isConnected: true };
    } catch (error) {
      return {
        isConnected: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Email Integration Plugin Base Class
// ============================================================================

export abstract class EmailIntegrationPlugin extends BasePlugin {
  protected emailService: EmailService;
  protected templates: Map<string, EmailTemplate> = new Map();
  protected accountStore: Map<string, AccountCredentials[]> = new Map();

  constructor(emailConfig: EmailConfig) {
    super();

    // Initialize email service based on provider
    switch (emailConfig.provider) {
      case 'smtp':
        this.emailService = new SmtpEmailService(emailConfig);
        break;
      default:
        throw new Error(`Unsupported email provider: ${emailConfig.provider}`);
    }

    this.initializeTemplates();
  }

  // Abstract methods to be implemented by specific service plugins
  abstract getServiceName(): string;
  abstract createAccount(orderDetails: any): Promise<AccountCredentials>;
  abstract validateServiceConfig(config: any): ValidationResult;

  async initialize(): Promise<void> {
    try {
      this.logger.info(`Initializing ${this.getServiceName()} Email Plugin...`);

      // Validate email service
      const isValid = await this.emailService.validateCredentials();
      if (!isValid) {
        throw new Error('Email service credentials validation failed');
      }

      this.logger.info(`${this.getServiceName()} Email Plugin initialized successfully`);
      this.isInitialized = true;
    } catch (error) {
      this.logger.error(`Failed to initialize ${this.getServiceName()} Email Plugin`, { error });
      throw error;
    }
  }

  async validateOrder(context: PluginContext): Promise<ValidationResult> {
    const errors: any[] = [];
    const warnings: any[] = [];

    try {
      const { product, order, user } = context;

      // Validate user email
      if (!user.email) {
        errors.push({
          field: 'email',
          message: 'User email is required for account delivery',
          code: 'MISSING_EMAIL',
        });
      }

      // Validate email format
      if (user.email && !this.isValidEmail(user.email)) {
        errors.push({
          field: 'email',
          message: 'Invalid email format',
          code: 'INVALID_EMAIL',
        });
      }

      // Validate service-specific configuration
      const serviceValidation = this.validateServiceConfig(product.metadata);
      errors.push(...serviceValidation.errors);
      warnings.push(...(serviceValidation.warnings || []));

      // Check email template exists
      const templateId = product.metadata.emailTemplate || 'default';
      if (!this.templates.has(templateId)) {
        errors.push({
          field: 'emailTemplate',
          message: `Email template '${templateId}' not found`,
          code: 'TEMPLATE_NOT_FOUND',
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error('Order validation failed', { error, orderId: context.order.id });
      return {
        isValid: false,
        errors: [
          {
            field: 'general',
            message: 'Validation failed due to system error',
            code: 'VALIDATION_ERROR',
          },
        ],
        warnings,
      };
    }
  }

  async processDelivery(context: PluginContext): Promise<DeliveryResult> {
    try {
      const { product, order, user } = context;
      const orderItem = order.items.find(item => item.productId === product.id);

      if (!orderItem) {
        throw new Error('Order item not found');
      }

      this.logger.info(`Processing ${this.getServiceName()} delivery`, {
        orderId: order.id,
        productId: product.id,
        userId: user.id,
        quantity: orderItem.quantity,
      });

      const credentials: AccountCredentials[] = [];

      // Create accounts for each quantity
      for (let i = 0; i < orderItem.quantity; i++) {
        const account = await this.createAccount({
          product,
          order,
          user,
          index: i,
        });
        credentials.push(account);
      }

      // Store credentials
      this.accountStore.set(order.id, credentials);

      // Send delivery email
      const templateId = product.metadata.emailTemplate || 'default';
      const template = this.templates.get(templateId);

      if (template && user.email) {
        const emailVariables = {
          userName: user.firstName || user.username || 'Customer',
          productName: product.name,
          orderNumber: order.id,
          credentials: credentials,
          serviceName: this.getServiceName(),
          supportEmail: product.metadata.supportEmail || 'support@mtyb.com',
          expirationDate: credentials[0]?.expiresAt?.toLocaleDateString() || 'N/A',
        };

        const emailSent = await this.emailService.sendEmail(user.email, template, emailVariables);

        if (!emailSent) {
          this.logger.warn('Failed to send delivery email', { orderId: order.id });
        }
      }

      const deliveryData: EmailDeliveryData = {
        credentials,
        deliveryMethod: 'email',
        emailTemplate: templateId,
        customInstructions: product.metadata.instructions,
        supportInfo: {
          email: product.metadata.supportEmail || 'support@mtyb.com',
          telegram: product.metadata.supportTelegram,
          website: product.metadata.supportWebsite,
        },
      };

      this.logger.info(`${this.getServiceName()} delivery processed successfully`, {
        orderId: order.id,
        accountsCreated: credentials.length,
      });

      return {
        success: true,
        deliveryData,
        metadata: {
          accountCount: credentials.length,
          emailSent: !!user.email,
          serviceName: this.getServiceName(),
        },
      };
    } catch (error) {
      this.logger.error(`${this.getServiceName()} delivery failed`, {
        error,
        orderId: context.order.id,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown delivery error',
        retryable: true,
        metadata: {
          failureReason: error instanceof Error ? error.message : 'Unknown error',
          serviceName: this.getServiceName(),
        },
      };
    }
  }

  async getHealthStatus(): Promise<PluginHealthStatus> {
    try {
      const startTime = Date.now();
      const emailStatus = await this.emailService.getStatus();
      const responseTime = Date.now() - startTime;

      return {
        isHealthy: emailStatus.isConnected,
        lastCheck: new Date(),
        responseTime,
        error: emailStatus.lastError,
        metadata: {
          emailServiceStatus: emailStatus.isConnected ? 'connected' : 'disconnected',
          serviceName: this.getServiceName(),
        },
      };
    } catch (error) {
      return {
        isHealthy: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Health check failed',
        metadata: {
          serviceName: this.getServiceName(),
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      };
    }
  }

  // Template management
  protected addTemplate(template: EmailTemplate): void {
    this.templates.set(template.id, template);
  }

  protected initializeTemplates(): void {
    // Default template
    this.addTemplate({
      id: 'default',
      name: 'Default Account Delivery',
      subject: 'Your {{serviceName}} Account - Order {{orderNumber}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to {{serviceName}}!</h2>
          <p>Hello {{userName}},</p>
          <p>Thank you for your purchase! Your {{productName}} account(s) are ready.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Account Details:</h3>
            {{#credentials}}
            <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 5px;">
              <strong>Account {{@index}}:</strong><br>
              Email: <code>{{email}}</code><br>
              Password: <code>{{password}}</code><br>
              {{#planType}}Plan: {{planType}}<br>{{/planType}}
              {{#expiresAt}}Expires: {{expiresAt}}<br>{{/expiresAt}}
            </div>
            {{/credentials}}
          </div>

          <h3>Important Notes:</h3>
          <ul>
            <li>Keep your credentials secure and do not share them</li>
            <li>Contact support if you have any issues</li>
            <li>Check the expiration date of your account</li>
          </ul>

          <p>Need help? Contact us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
          
          <p>Best regards,<br>MTYB Team</p>
        </div>
      `,
      textContent: `
Welcome to {{serviceName}}!

Hello {{userName}},

Thank you for your purchase! Your {{productName}} account(s) are ready.

Account Details:
{{#credentials}}
Account {{@index}}:
Email: {{email}}
Password: {{password}}
{{#planType}}Plan: {{planType}}{{/planType}}
{{#expiresAt}}Expires: {{expiresAt}}{{/expiresAt}}

{{/credentials}}

Important Notes:
- Keep your credentials secure and do not share them
- Contact support if you have any issues  
- Check the expiration date of your account

Need help? Contact us at {{supportEmail}}

Best regards,
MTYB Team
      `,
      variables: [
        'userName',
        'serviceName',
        'productName',
        'orderNumber',
        'credentials',
        'supportEmail',
      ],
    });
  }

  // Utility methods
  protected isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  protected generateSecurePassword(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  protected generateRandomEmail(domain: string): string {
    const prefixes = ['user', 'account', 'premium', 'member'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(Math.random() * 10000);
    return `${prefix}${randomNum}@${domain}`;
  }

  // Public methods for account management
  async getDeliveredAccounts(orderId: string): Promise<AccountCredentials[]> {
    return this.accountStore.get(orderId) || [];
  }

  async extendAccount(orderId: string, accountIndex: number, days: number): Promise<boolean> {
    const accounts = this.accountStore.get(orderId);
    if (!accounts || !accounts[accountIndex]) return false;

    const account = accounts[accountIndex];
    const currentExpiry = account.expiresAt || new Date();
    account.expiresAt = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);

    this.accountStore.set(orderId, accounts);
    this.logger.info('Account extended', { orderId, accountIndex, days });
    return true;
  }
}

// ============================================================================
// Example: Netflix Plugin Implementation
// ============================================================================

export class NetflixEmailPlugin extends EmailIntegrationPlugin {
  constructor() {
    const emailConfig: EmailConfig = {
      provider: 'smtp',
      host: process.env.NETFLIX_SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.NETFLIX_SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.NETFLIX_EMAIL_USER || 'netflix@mtyb.com',
        pass: process.env.NETFLIX_EMAIL_PASS || 'app_password',
      },
    };

    super(emailConfig);
    this.initializeNetflixTemplates();
  }

  getId(): string {
    return 'netflix-email-plugin';
  }

  getName(): string {
    return 'Netflix Email Integration Plugin';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'Delivers Netflix account credentials via email';
  }

  getAuthor(): string {
    return 'MTYB Virtual Goods Platform';
  }

  getServiceName(): string {
    return 'Netflix';
  }

  async createAccount(orderDetails: any): Promise<AccountCredentials> {
    // Simulate Netflix account creation
    await this.delay(2000);

    const planTypes = ['Basic', 'Standard', 'Premium'];
    const regions = ['US', 'UK', 'CA', 'AU'];

    return {
      email: this.generateRandomEmail('netflix.com'),
      password: this.generateSecurePassword(16),
      planType: planTypes[Math.floor(Math.random() * planTypes.length)],
      region: regions[Math.floor(Math.random() * regions.length)],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      additionalInfo: {
        profilesAllowed: 4,
        deviceLimit: 5,
        downloadLimit: '100GB',
      },
    };
  }

  validateServiceConfig(config: any): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    if (!config.netflixRegion) {
      warnings.push({
        field: 'netflixRegion',
        message: 'No specific region configured, will use random region',
        code: 'NO_REGION',
      });
    }

    if (!config.netflixPlan) {
      warnings.push({
        field: 'netflixPlan',
        message: 'No specific plan configured, will use random plan',
        code: 'NO_PLAN',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private initializeNetflixTemplates(): void {
    this.addTemplate({
      id: 'netflix-premium',
      name: 'Netflix Premium Account Delivery',
      subject: 'Your Netflix {{planType}} Account is Ready! 🎬',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff;">
          <div style="background: #e50914; padding: 20px; text-align: center;">
            <h1 style="margin: 0; color: white;">Welcome to Netflix!</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 18px;">Hello {{userName}},</p>
            <p>Your Netflix {{planType}} account is ready to stream! 🍿</p>
            
            <div style="background: #333; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #e50914; margin-top: 0;">Account Details</h3>
              {{#credentials}}
              <div style="margin-bottom: 20px; padding: 15px; background: #222; border-radius: 5px;">
                <strong>Email:</strong> <span style="color: #e50914;">{{email}}</span><br>
                <strong>Password:</strong> <span style="color: #e50914;">{{password}}</span><br>
                <strong>Plan:</strong> {{planType}} ({{region}})<br>
                <strong>Expires:</strong> {{expiresAt}}<br>
                <strong>Profiles:</strong> {{additionalInfo.profilesAllowed}} profiles allowed<br>
                <strong>Devices:</strong> {{additionalInfo.deviceLimit}} devices
              </div>
              {{/credentials}}
            </div>

            <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #e50914; margin-top: 0;">Getting Started</h3>
              <ol style="line-height: 1.8;">
                <li>Go to <a href="https://netflix.com" style="color: #e50914;">netflix.com</a></li>
                <li>Click "Sign In" and enter your credentials</li>
                <li>Create up to {{additionalInfo.profilesAllowed}} profiles</li>
                <li>Start streaming on any device!</li>
              </ol>
            </div>

            <div style="background: #333; padding: 15px; border-radius: 8px; border-left: 4px solid #e50914;">
              <h4 style="margin-top: 0; color: #e50914;">Important Notes:</h4>
              <ul style="margin-bottom: 0;">
                <li>Do not share your account credentials</li>
                <li>You can stream on {{additionalInfo.deviceLimit}} devices</li>
                <li>Account valid until {{expiresAt}}</li>
                <li>Contact support for any issues</li>
              </ul>
            </div>

            <p style="margin-top: 30px;">
              Need help? Contact us at <a href="mailto:{{supportEmail}}" style="color: #e50914;">{{supportEmail}}</a>
            </p>
            
            <p style="margin-top: 20px;">
              Happy streaming! 🎬<br>
              <strong>MTYB Team</strong>
            </p>
          </div>
        </div>
      `,
      textContent: `
Welcome to Netflix!

Hello {{userName}},

Your Netflix {{planType}} account is ready to stream!

Account Details:
{{#credentials}}
Email: {{email}}
Password: {{password}}
Plan: {{planType}} ({{region}})
Expires: {{expiresAt}}
Profiles: {{additionalInfo.profilesAllowed}} profiles allowed
Devices: {{additionalInfo.deviceLimit}} devices

{{/credentials}}

Getting Started:
1. Go to netflix.com
2. Click "Sign In" and enter your credentials
3. Create up to {{additionalInfo.profilesAllowed}} profiles
4. Start streaming on any device!

Important Notes:
- Do not share your account credentials
- You can stream on {{additionalInfo.deviceLimit}} devices
- Account valid until {{expiresAt}}
- Contact support for any issues

Need help? Contact us at {{supportEmail}}

Happy streaming!
MTYB Team
      `,
      variables: ['userName', 'planType', 'credentials', 'supportEmail'],
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export instances
export const netflixEmailPlugin = new NetflixEmailPlugin();
