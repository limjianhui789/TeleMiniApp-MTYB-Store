// ============================================================================
// MTYB Virtual Goods Platform - API Integration Plugin Template
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
// API Integration Types
// ============================================================================

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  apiSecret?: string;
  timeout: number;
  retryAttempts: number;
  headers?: Record<string, string>;
  authentication: 'bearer' | 'api_key' | 'basic' | 'custom';
  rateLimit?: {
    requests: number;
    period: number; // in seconds
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  headers?: Record<string, string>;
  rateLimit?: {
    remaining: number;
    reset: number;
  };
}

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface LicenseKey {
  id: string;
  key: string;
  type: 'license' | 'activation' | 'subscription';
  expiresAt?: Date;
  activationsRemaining?: number;
  maxActivations?: number;
  metadata?: Record<string, any>;
  isActive: boolean;
}

export interface ApiDeliveryData {
  keys: LicenseKey[];
  downloadUrls?: string[];
  additionalFiles?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  instructions: string;
  supportInfo: {
    apiDocUrl?: string;
    supportEmail: string;
    supportPortal?: string;
  };
}

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private period: number;

  constructor(maxRequests: number, period: number) {
    this.maxRequests = maxRequests;
    this.period = period * 1000; // Convert to milliseconds
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove old requests outside the period
    this.requests = this.requests.filter(time => now - time < this.period);

    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getWaitTime(): number {
    if (this.canMakeRequest()) return 0;

    const oldestRequest = Math.min(...this.requests);
    return this.period - (Date.now() - oldestRequest);
  }
}

// ============================================================================
// HTTP Client
// ============================================================================

class ApiHttpClient {
  private config: ApiConfig;
  private logger: Logger;
  private rateLimiter?: RateLimiter;

  constructor(config: ApiConfig) {
    this.config = config;
    this.logger = new Logger('ApiHttpClient');

    if (config.rateLimit) {
      this.rateLimiter = new RateLimiter(config.rateLimit.requests, config.rateLimit.period);
    }
  }

  async makeRequest<T>(request: ApiRequest): Promise<ApiResponse<T>> {
    try {
      // Check rate limit
      if (this.rateLimiter && !this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        this.logger.warn(`Rate limit reached, waiting ${waitTime}ms`);
        await this.delay(waitTime);
      }

      // Prepare request
      const url = new URL(request.endpoint, this.config.baseUrl);
      if (request.params) {
        Object.entries(request.params).forEach(([key, value]) => {
          url.searchParams.append(key, String(value));
        });
      }

      const headers = this.buildHeaders(request.headers);
      const timeout = request.timeout || this.config.timeout;

      this.logger.debug('Making API request', {
        method: request.method,
        url: url.toString(),
      });

      // Simulate API call - replace with actual fetch implementation
      await this.delay(Math.random() * 1000 + 500);

      // Record request for rate limiting
      if (this.rateLimiter) {
        this.rateLimiter.recordRequest();
      }

      // Simulate response
      const mockResponse: ApiResponse<T> = {
        success: true,
        data: this.generateMockData(request) as T,
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
          'x-rate-limit-remaining': '99',
          'x-rate-limit-reset': String(Date.now() + 3600000),
        },
      };

      this.logger.debug('API request successful', {
        statusCode: mockResponse.statusCode,
      });

      return mockResponse;
    } catch (error) {
      this.logger.error('API request failed', { error, request });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown API error',
        statusCode: 500,
      };
    }
  }

  private buildHeaders(requestHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'MTYB-Plugin/1.0',
      ...this.config.headers,
      ...requestHeaders,
    };

    // Add authentication headers
    switch (this.config.authentication) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        break;
      case 'api_key':
        headers['X-API-Key'] = this.config.apiKey;
        break;
      case 'basic':
        const credentials = btoa(`${this.config.apiKey}:${this.config.apiSecret || ''}`);
        headers['Authorization'] = `Basic ${credentials}`;
        break;
    }

    return headers;
  }

  private generateMockData(request: ApiRequest): any {
    // Generate mock data based on request type
    if (request.endpoint.includes('license') || request.endpoint.includes('key')) {
      return {
        id: `key_${Date.now()}`,
        key: this.generateLicenseKey(),
        type: 'license',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        activationsRemaining: 5,
        maxActivations: 5,
        isActive: true,
      };
    }

    return { success: true, message: 'Operation completed' };
  }

  private generateLicenseKey(): string {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      const segment = Math.random().toString(36).substring(2, 7).toUpperCase();
      segments.push(segment);
    }
    return segments.join('-');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest({
        method: 'GET',
        endpoint: '/health',
        timeout: 5000,
      });
      return response.success;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// API Integration Plugin Base Class
// ============================================================================

export abstract class ApiIntegrationPlugin extends BasePlugin {
  protected apiClient: ApiHttpClient;
  protected deliveredKeys: Map<string, LicenseKey[]> = new Map();

  constructor(apiConfig: ApiConfig) {
    super();
    this.apiClient = new ApiHttpClient(apiConfig);
  }

  // Abstract methods to be implemented by specific service plugins
  abstract getServiceName(): string;
  abstract createLicenseKey(orderDetails: any): Promise<LicenseKey>;
  abstract validateServiceConfig(config: any): ValidationResult;
  abstract getServiceInstructions(keys: LicenseKey[]): string;

  async initialize(): Promise<void> {
    try {
      this.logger.info(`Initializing ${this.getServiceName()} API Plugin...`);

      // Test API connectivity
      const isConnected = await this.apiClient.testConnection();
      if (!isConnected) {
        throw new Error('API connectivity test failed');
      }

      this.logger.info(`${this.getServiceName()} API Plugin initialized successfully`);
      this.isInitialized = true;
    } catch (error) {
      this.logger.error(`Failed to initialize ${this.getServiceName()} API Plugin`, { error });
      throw error;
    }
  }

  async validateOrder(context: PluginContext): Promise<ValidationResult> {
    const errors: any[] = [];
    const warnings: any[] = [];

    try {
      const { product, order } = context;

      // Validate service-specific configuration
      const serviceValidation = this.validateServiceConfig(product.metadata);
      errors.push(...serviceValidation.errors);
      warnings.push(...(serviceValidation.warnings || []));

      // Validate quantity limits
      const orderItem = order.items.find(item => item.productId === product.id);
      if (orderItem && orderItem.quantity > 10) {
        warnings.push({
          field: 'quantity',
          message: 'Large quantity orders may take longer to process',
          code: 'LARGE_QUANTITY',
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

      const keys: LicenseKey[] = [];

      // Create license keys for each quantity
      for (let i = 0; i < orderItem.quantity; i++) {
        const key = await this.createLicenseKey({
          product,
          order,
          user,
          index: i,
        });
        keys.push(key);
      }

      // Store delivered keys
      this.deliveredKeys.set(order.id, keys);

      const deliveryData: ApiDeliveryData = {
        keys,
        instructions: this.getServiceInstructions(keys),
        supportInfo: {
          apiDocUrl: product.metadata.apiDocUrl,
          supportEmail: product.metadata.supportEmail || 'support@mtyb.com',
          supportPortal: product.metadata.supportPortal,
        },
      };

      // Add download URLs if available
      if (product.metadata.downloadUrls) {
        deliveryData.downloadUrls = Array.isArray(product.metadata.downloadUrls)
          ? product.metadata.downloadUrls
          : [product.metadata.downloadUrls];
      }

      this.logger.info(`${this.getServiceName()} delivery processed successfully`, {
        orderId: order.id,
        keysGenerated: keys.length,
      });

      return {
        success: true,
        deliveryData,
        metadata: {
          keyCount: keys.length,
          serviceName: this.getServiceName(),
          keyIds: keys.map(k => k.id),
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
      const isConnected = await this.apiClient.testConnection();
      const responseTime = Date.now() - startTime;

      return {
        isHealthy: isConnected,
        lastCheck: new Date(),
        responseTime,
        metadata: {
          apiConnectivity: isConnected ? 'connected' : 'disconnected',
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

  // Key management methods
  async getDeliveredKeys(orderId: string): Promise<LicenseKey[]> {
    return this.deliveredKeys.get(orderId) || [];
  }

  async deactivateKey(orderId: string, keyId: string): Promise<boolean> {
    try {
      const keys = this.deliveredKeys.get(orderId);
      if (!keys) return false;

      const key = keys.find(k => k.id === keyId);
      if (!key) return false;

      // Call API to deactivate key
      const response = await this.apiClient.makeRequest({
        method: 'POST',
        endpoint: `/keys/${keyId}/deactivate`,
      });

      if (response.success) {
        key.isActive = false;
        this.deliveredKeys.set(orderId, keys);
        this.logger.info('Key deactivated', { orderId, keyId });
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to deactivate key', { error, orderId, keyId });
      return false;
    }
  }

  async extendKey(orderId: string, keyId: string, days: number): Promise<boolean> {
    try {
      const keys = this.deliveredKeys.get(orderId);
      if (!keys) return false;

      const key = keys.find(k => k.id === keyId);
      if (!key) return false;

      // Call API to extend key
      const response = await this.apiClient.makeRequest({
        method: 'POST',
        endpoint: `/keys/${keyId}/extend`,
        data: { days },
      });

      if (response.success && key.expiresAt) {
        key.expiresAt = new Date(key.expiresAt.getTime() + days * 24 * 60 * 60 * 1000);
        this.deliveredKeys.set(orderId, keys);
        this.logger.info('Key extended', { orderId, keyId, days });
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to extend key', { error, orderId, keyId });
      return false;
    }
  }
}

// ============================================================================
// Example: KeyAuth Plugin Implementation
// ============================================================================

export class KeyAuthPlugin extends ApiIntegrationPlugin {
  constructor() {
    const apiConfig: ApiConfig = {
      baseUrl: process.env.KEYAUTH_API_URL || 'https://keyauth.win/api/1.2/',
      apiKey: process.env.KEYAUTH_API_KEY || 'demo_api_key',
      apiSecret: process.env.KEYAUTH_SECRET || 'demo_secret',
      timeout: 30000,
      retryAttempts: 3,
      authentication: 'api_key',
      rateLimit: {
        requests: 100,
        period: 60,
      },
    };

    super(apiConfig);
  }

  getId(): string {
    return 'keyauth-plugin';
  }

  getName(): string {
    return 'KeyAuth Integration Plugin';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'Generates KeyAuth license keys for software authentication';
  }

  getAuthor(): string {
    return 'MTYB Virtual Goods Platform';
  }

  getServiceName(): string {
    return 'KeyAuth';
  }

  async createLicenseKey(orderDetails: any): Promise<LicenseKey> {
    const { product, order, user, index } = orderDetails;

    // Call KeyAuth API to create license
    const response = await this.apiClient.makeRequest<any>({
      method: 'POST',
      endpoint: '/license/add',
      data: {
        type: product.metadata.licenseType || 'lifetime',
        level: product.metadata.userLevel || '1',
        amount: product.metadata.duration || '30',
        unit: product.metadata.timeUnit || 'days',
        format: 'JSON',
        owner: user.id,
        character: product.metadata.keyLength || '25',
      },
    });

    if (!response.success) {
      throw new Error(`Failed to create KeyAuth license: ${response.error}`);
    }

    return {
      id: response.data.id || `keyauth_${Date.now()}_${index}`,
      key: response.data.key || this.generateLicenseKey(),
      type: 'license',
      expiresAt: this.calculateExpiryDate(product.metadata),
      activationsRemaining: product.metadata.maxActivations || 1,
      maxActivations: product.metadata.maxActivations || 1,
      isActive: true,
      metadata: {
        userLevel: product.metadata.userLevel || '1',
        appName: product.metadata.appName || 'Unknown App',
        keyAuthId: response.data.id,
      },
    };
  }

  validateServiceConfig(config: any): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    if (!config.appName) {
      errors.push({
        field: 'appName',
        message: 'KeyAuth app name is required',
        code: 'MISSING_APP_NAME',
      });
    }

    if (!config.licenseType) {
      warnings.push({
        field: 'licenseType',
        message: 'No license type specified, using default (lifetime)',
        code: 'DEFAULT_LICENSE_TYPE',
      });
    }

    if (config.maxActivations && config.maxActivations > 10) {
      warnings.push({
        field: 'maxActivations',
        message: 'High activation limit may increase security risks',
        code: 'HIGH_ACTIVATION_LIMIT',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  getServiceInstructions(keys: LicenseKey[]): string {
    return `
## KeyAuth License Setup Instructions

### Your License Key(s):
${keys
  .map(
    (key, index) => `
**License ${index + 1}:**
- Key: \`${key.key}\`
- Expires: ${key.expiresAt ? key.expiresAt.toLocaleDateString() : 'Never'}
- Activations: ${key.activationsRemaining}/${key.maxActivations}
- App: ${key.metadata?.appName || 'Unknown'}
`
  )
  .join('\n')}

### How to Use:
1. Launch your application
2. Enter your license key when prompted
3. Your software will automatically validate with KeyAuth
4. Keep your key secure and do not share it

### Important Notes:
- Each key can be activated on ${keys[0]?.maxActivations || 1} device(s)
- Keys are tied to your hardware fingerprint
- Contact support if you need to transfer to a new device
- Backup your keys in a secure location

### Troubleshooting:
- If activation fails, check your internet connection
- Ensure you're using the latest version of the software
- Contact support with your key ID for assistance

### Support:
- Email: support@mtyb.com
- Include your order number and key ID in support requests
    `.trim();
  }

  private calculateExpiryDate(metadata: any): Date | undefined {
    if (metadata.licenseType === 'lifetime') {
      return undefined; // No expiry for lifetime licenses
    }

    const duration = parseInt(metadata.duration || '30');
    const unit = metadata.timeUnit || 'days';

    let multiplier = 1;
    switch (unit) {
      case 'hours':
        multiplier = 60 * 60 * 1000;
        break;
      case 'days':
        multiplier = 24 * 60 * 60 * 1000;
        break;
      case 'weeks':
        multiplier = 7 * 24 * 60 * 60 * 1000;
        break;
      case 'months':
        multiplier = 30 * 24 * 60 * 60 * 1000;
        break;
      case 'years':
        multiplier = 365 * 24 * 60 * 60 * 1000;
        break;
    }

    return new Date(Date.now() + duration * multiplier);
  }

  private generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [];

    for (let i = 0; i < 5; i++) {
      let segment = '';
      for (let j = 0; j < 5; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }

    return segments.join('-');
  }
}

// Export instances
export const keyAuthPlugin = new KeyAuthPlugin();
