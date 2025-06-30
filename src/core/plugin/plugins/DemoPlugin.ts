// ============================================================================
// MTYB Virtual Goods Platform - Demo Plugin
// ============================================================================

import { BasePlugin } from '../../../types/plugin';
import {
  type PluginConfig,
  type PluginContext,
  type DeliveryResult,
  type ValidationResult,
  ProductCategory,
  PluginStatus,
  type ValidationError,
  type ValidationWarning,
  type PluginHealthStatus,
} from '../../../types';
import { Logger } from '../../utils/Logger';

// ============================================================================
// Demo Plugin Implementation
// ============================================================================

export class DemoPlugin extends BasePlugin {
  private logger: Logger;
  private isInitialized = false;

  config: PluginConfig = {
    id: 'demo-plugin',
    name: 'Demo Plugin',
    version: '1.0.0',
    description: 'A demonstration plugin for testing the plugin system',
    author: 'MTYB Team',
    category: ProductCategory.DIGITAL_GOODS,
    status: PluginStatus.INACTIVE,
    isEnabled: false,
    metadata: {
      supportedFeatures: ['basic-delivery', 'health-check', 'configuration'],
      configSchema: {
        demoApiKey: { type: 'string', required: false, description: 'Demo API key for testing' },
        deliveryDelay: {
          type: 'number',
          required: false,
          default: 1000,
          description: 'Simulated delivery delay in ms',
        },
        failureRate: {
          type: 'number',
          required: false,
          default: 0,
          description: 'Simulated failure rate (0-1)',
        },
      },
    },
  };

  constructor() {
    super();
    this.logger = new Logger('DemoPlugin');
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  async initialize(config: Record<string, any>): Promise<void> {
    try {
      this.logger.info('Initializing Demo Plugin...');

      // Simulate initialization work
      await this.delay(500);

      // Store configuration
      this.config.metadata = { ...this.config.metadata, ...config };

      this.isInitialized = true;
      this.logger.info('Demo Plugin initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Demo Plugin:', error as Error);
      throw error;
    }
  }

  async validateConfig(config: Record<string, any>): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Validate delivery delay
      if (config.deliveryDelay !== undefined) {
        if (typeof config.deliveryDelay !== 'number' || config.deliveryDelay < 0) {
          errors.push({
            field: 'deliveryDelay',
            message: 'deliveryDelay must be a non-negative number',
            code: 'INVALID_TYPE',
          });
        } else if (config.deliveryDelay > 10000) {
          warnings.push({
            field: 'deliveryDelay',
            message: 'deliveryDelay is very high (>10s), this may affect user experience',
            code: 'HIGH_VALUE',
          });
        }
      }

      // Validate failure rate
      if (config.failureRate !== undefined) {
        if (
          typeof config.failureRate !== 'number' ||
          config.failureRate < 0 ||
          config.failureRate > 1
        ) {
          errors.push({
            field: 'failureRate',
            message: 'failureRate must be a number between 0 and 1',
            code: 'INVALID_RANGE',
          });
        } else if (config.failureRate > 0.1) {
          warnings.push({
            field: 'failureRate',
            message: 'failureRate is high (>10%), this may cause frequent failures',
            code: 'HIGH_VALUE',
          });
        }
      }

      // Validate API key format (if provided)
      if (config.demoApiKey !== undefined) {
        if (typeof config.demoApiKey !== 'string') {
          errors.push({
            field: 'demoApiKey',
            message: 'demoApiKey must be a string',
            code: 'INVALID_TYPE',
          });
        } else if (config.demoApiKey.length < 10) {
          warnings.push({
            field: 'demoApiKey',
            message: 'demoApiKey seems too short, ensure it is valid',
            code: 'SHORT_VALUE',
          });
        }
      }

      this.logger.debug('Demo Plugin configuration validation completed');
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error('Configuration validation failed:', error as Error);
      return {
        isValid: false,
        errors: [
          {
            field: 'general',
            message: `Configuration validation error: ${(error as Error).message}`,
            code: 'VALIDATION_ERROR',
          },
        ],
        warnings,
      };
    }
  }

  override async cleanup(): Promise<void> {
    try {
      this.logger.info('Cleaning up Demo Plugin...');

      // Simulate cleanup work
      await this.delay(200);

      this.isInitialized = false;
      this.logger.info('Demo Plugin cleanup completed');
    } catch (error) {
      this.logger.error('Demo Plugin cleanup failed:', error as Error);
      throw error;
    }
  }

  // ============================================================================
  // Core Functionality
  // ============================================================================

  override async processOrder(context: PluginContext): Promise<DeliveryResult> {
    try {
      if (!this.isInitialized) {
        throw new Error('Plugin is not initialized');
      }

      this.logger.info(`Processing order: ${context.order.id}`);

      // Get configuration
      const deliveryDelay = this.config.metadata.deliveryDelay || 1000;
      const failureRate = this.config.metadata.failureRate || 0;

      // Simulate processing delay
      await this.delay(deliveryDelay);

      // Simulate random failures
      if (Math.random() < failureRate) {
        throw new Error('Simulated processing failure');
      }

      // Generate demo delivery data
      const deliveryData = {
        demoCredentials: {
          username: `demo_user_${Date.now()}`,
          password: this.generateRandomPassword(),
          accessToken: this.generateRandomToken(),
        },
        instructions:
          'This is a demo delivery. Use the provided credentials to access your demo service.',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        demoInfo: {
          orderId: context.order.id,
          productName: context.product.name,
          processedAt: new Date(),
          pluginVersion: this.config.version,
        },
      };

      this.logger.info(`Order processed successfully: ${context.order.id}`);
      return {
        success: true,
        deliveryData,
        metadata: {
          processingTime: deliveryDelay,
          pluginId: this.config.id,
          timestamp: new Date(),
          message: 'Demo product delivered successfully! This is a test delivery.',
        },
      };
    } catch (error) {
      this.logger.error(`Order processing failed: ${context.order.id}`, error as Error);
      return {
        success: false,
        deliveryData: {},
        error: `Demo delivery failed: ${(error as Error).message}`,
        metadata: {
          pluginId: this.config.id,
          timestamp: new Date(),
        },
      };
    }
  }

  override async validateProduct(productData: Record<string, any>): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Validate product has required fields for demo
      if (!productData.name) {
        errors.push({
          field: 'name',
          message: 'Product name is required',
          code: 'REQUIRED_FIELD',
        });
      }

      if (!productData.price || productData.price <= 0) {
        errors.push({
          field: 'price',
          message: 'Product price must be greater than 0',
          code: 'INVALID_VALUE',
        });
      }

      // Check if product is suitable for demo plugin
      if (productData.category && productData.category !== ProductCategory.DIGITAL_GOODS) {
        warnings.push({
          field: 'category',
          message: 'Demo plugin is optimized for digital goods category',
          code: 'CATEGORY_MISMATCH',
        });
      }

      this.logger.debug('Demo Plugin product validation completed');
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error('Product validation failed:', error as Error);
      return {
        isValid: false,
        errors: [
          {
            field: 'general',
            message: `Product validation error: ${(error as Error).message}`,
            code: 'VALIDATION_ERROR',
          },
        ],
        warnings,
      };
    }
  }

  // ============================================================================
  // Optional Hook Methods
  // ============================================================================

  override async onOrderCreated(context: PluginContext): Promise<void> {
    this.logger.info(`Demo Plugin: Order created - ${context.order.id}`);
  }

  override async onPaymentCompleted(context: PluginContext): Promise<void> {
    this.logger.info(`Demo Plugin: Payment completed - ${context.order.id}`);
  }

  override async onOrderCancelled(context: PluginContext): Promise<void> {
    this.logger.info(`Demo Plugin: Order cancelled - ${context.order.id}`);
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  override async healthCheck(): Promise<PluginHealthStatus> {
    const startTime = Date.now();

    try {
      // Simulate health check
      await this.delay(100);

      // Check if plugin is properly initialized
      if (!this.isInitialized) {
        this.logger.warn('Demo Plugin health check: Plugin not initialized');
        return {
          isHealthy: false,
          lastCheck: new Date(),
          error: 'Plugin not initialized',
          responseTime: Date.now() - startTime,
        };
      }

      // Simulate occasional health check failures for testing
      const healthFailureRate = 0.05; // 5% failure rate
      if (Math.random() < healthFailureRate) {
        this.logger.warn('Demo Plugin health check: Simulated health check failure');
        return {
          isHealthy: false,
          lastCheck: new Date(),
          error: 'Simulated health check failure',
          responseTime: Date.now() - startTime,
        };
      }

      this.logger.debug('Demo Plugin health check: OK');
      return {
        isHealthy: true,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Demo Plugin health check failed:', error as Error);
      return {
        isHealthy: false,
        lastCheck: new Date(),
        error: (error as Error).message,
        responseTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRandomPassword(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private generateRandomToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}

// ============================================================================
// Export Demo Plugin Instance
// ============================================================================

export const demoPlugin = new DemoPlugin();
