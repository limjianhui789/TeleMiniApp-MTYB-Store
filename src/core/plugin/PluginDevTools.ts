// ============================================================================
// MTYB Virtual Goods Platform - Plugin Development Tools
// ============================================================================

import { BasePlugin } from '../../types/plugin';
import { PluginContext, DeliveryResult, ValidationResult, ProductCategory, OrderStatus, ProductStatus, ProductStock } from '../../types';
import { Logger } from '../utils/Logger';
// import { pluginManager } from './PluginManager'; // Removed to avoid circular dependency

// ============================================================================
// Plugin Testing Utilities
// ============================================================================

export class PluginTester {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('PluginTester');
  }

  // ============================================================================
  // Plugin Validation Testing
  // ============================================================================

  async testPluginValidation(plugin: BasePlugin): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Test basic plugin structure
      if (!plugin.config) {
        errors.push('Plugin must have a config property');
      } else {
        // Test config properties
        const requiredFields = ['id', 'name', 'version', 'description', 'author', 'category'];
        for (const field of requiredFields) {
          if (!plugin.config[field as keyof typeof plugin.config]) {
            errors.push(`Plugin config missing required field: ${field}`);
          }
        }

        // Test version format
        if (plugin.config.version && !/^\d+\.\d+\.\d+/.test(plugin.config.version)) {
          warnings.push('Plugin version should follow semantic versioning (e.g., 1.0.0)');
        }
      }

      // Test required methods
      const requiredMethods = ['initialize', 'validateConfig', 'processOrder', 'validateProduct'];
      for (const method of requiredMethods) {
        if (typeof plugin[method as keyof BasePlugin] !== 'function') {
          errors.push(`Plugin must implement required method: ${method}`);
        }
      }

      // Test optional methods
      const optionalMethods = ['onOrderCreated', 'onPaymentCompleted', 'onOrderCancelled', 'healthCheck'];
      for (const method of optionalMethods) {
        if (plugin[method as keyof BasePlugin] && typeof plugin[method as keyof BasePlugin] !== 'function') {
          warnings.push(`Optional method ${method} should be a function if implemented`);
        }
      }

      // Test config validation method
      if (plugin.validateConfig) {
        try {
          const testConfig = {};
          const result = await plugin.validateConfig(testConfig);
          if (!result || typeof result.isValid !== 'boolean') {
            errors.push('validateConfig method must return a ValidationResult object');
          }
        } catch (error) {
          warnings.push(`validateConfig method threw an error with empty config: ${(error as Error).message}`);
        }
      }

      this.logger.info(`Plugin validation completed: ${plugin.config?.id || 'unknown'}`);
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`Plugin validation failed: ${(error as Error).message}`);
      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }

  // ============================================================================
  // Plugin Execution Testing
  // ============================================================================

  async testPluginExecution(
    plugin: BasePlugin,
    testContext: PluginContext
  ): Promise<{
    success: boolean;
    result?: DeliveryResult;
    error?: string;
    executionTime: number;
  }> {
    const startTime = Date.now();

    try {
      // Initialize plugin first
      await plugin.initialize(plugin.config.metadata || {});

      // Execute plugin
      const result = await plugin.processOrder(testContext);

      const executionTime = Date.now() - startTime;

      this.logger.info(`Plugin execution test completed: ${plugin.config.id} (${executionTime}ms)`);
      return {
        success: true,
        result,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Plugin execution test failed: ${plugin.config.id}`, error as Error);
      return {
        success: false,
        error: (error as Error).message,
        executionTime
      };
    }
  }

  // ============================================================================
  // Plugin Performance Testing
  // ============================================================================

  async testPluginPerformance(
    plugin: BasePlugin,
    testContext: PluginContext,
    iterations: number = 10
  ): Promise<{
    averageExecutionTime: number;
    minExecutionTime: number;
    maxExecutionTime: number;
    successRate: number;
    errors: string[];
  }> {
    const executionTimes: number[] = [];
    const errors: string[] = [];
    let successCount = 0;

    // Initialize plugin once
    await plugin.initialize(plugin.config.metadata || {});

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        await plugin.processOrder(testContext);
        const executionTime = Date.now() - startTime;
        executionTimes.push(executionTime);
        successCount++;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        executionTimes.push(executionTime);
        errors.push(`Iteration ${i + 1}: ${(error as Error).message}`);
      }
    }

    const averageExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
    const minExecutionTime = Math.min(...executionTimes);
    const maxExecutionTime = Math.max(...executionTimes);
    const successRate = (successCount / iterations) * 100;

    this.logger.info(`Plugin performance test completed: ${plugin.config.id} (${iterations} iterations)`);
    return {
      averageExecutionTime,
      minExecutionTime,
      maxExecutionTime,
      successRate,
      errors
    };
  }
}

// ============================================================================
// Mock Data Generators
// ============================================================================

export class MockDataGenerator {
  // ============================================================================
  // Mock Plugin Context
  // ============================================================================

  static createMockContext(overrides: Partial<PluginContext> = {}): PluginContext {
    const mockStock: ProductStock = {
      available: 100,
      reserved: 0,
      total: 100,
      lowStockThreshold: 10
    };

    return {
      order: {
        id: 'test-order-001',
        userId: 'test-user-001',
        items: [{
          id: 'test-item-001',
          productId: 'test-product-001',
          product: {} as any, // Will be filled with the product below
          quantity: 1,
          unitPrice: 9.99,
          totalPrice: 9.99,
          status: OrderStatus.PENDING
        }],
        totalAmount: 9.99,
        currency: 'USD',
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
      },
      product: {
        id: 'test-product-001',
        name: 'Test Product',
        description: 'A test product for plugin development',
        category: ProductCategory.VPN,
        price: 9.99,
        originalPrice: 12.99,
        currency: 'USD',
        pluginId: 'demo-plugin',
        status: ProductStatus.ACTIVE,
        isActive: true,
        isFeatured: false,
        tags: ['test', 'demo'],
        images: [],
        metadata: {},
        stock: mockStock,
        deliveryInfo: {
          type: 'instant',
          estimatedTime: '5 minutes',
          instructions: 'Digital delivery via email'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      user: {
        id: 'test-user-001',
        telegramId: 123456789,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        languageCode: 'en',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      config: {},
      logger: new Logger('MockPlugin'),
      ...overrides
    };
  }

  // ============================================================================
  // Mock Delivery Results
  // ============================================================================

  static createMockDeliveryResult(overrides: Partial<DeliveryResult> = {}): DeliveryResult {
    return {
      success: true,
      deliveryData: {
        credentials: {
          username: 'testuser123',
          password: 'testpass456'
        },
        instructions: 'Use these credentials to access your service',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      metadata: {
        message: 'Product delivered successfully'
      },
      ...overrides
    };
  }

  // ============================================================================
  // Mock Validation Results
  // ============================================================================

  static createMockValidationResult(isValid: boolean = true, errorMessages: string[] = []): ValidationResult {
    const errors = errorMessages.map((message, index) => ({
      field: `field${index}`,
      message,
      code: 'MOCK_ERROR'
    }));

    return {
      isValid,
      errors,
      warnings: []
    };
  }
}

// ============================================================================
// Plugin Template Generator
// ============================================================================

export class PluginTemplateGenerator {
  // ============================================================================
  // Generate Basic Plugin Template
  // ============================================================================

  static generateBasicPluginTemplate(
    pluginId: string,
    pluginName: string,
    category: ProductCategory,
    author: string = 'MTYB Developer'
  ): string {
    return `// ============================================================================
// ${pluginName} Plugin
// ============================================================================

import { BasePlugin } from '../types/plugin';
import { PluginConfig, PluginContext, DeliveryResult, ValidationResult, ProductCategory } from '../types';

export class ${this.toPascalCase(pluginId)}Plugin extends BasePlugin {
  config: PluginConfig = {
    id: '${pluginId}',
    name: '${pluginName}',
    version: '1.0.0',
    description: 'Plugin for ${pluginName} integration',
    author: '${author}',
    category: ProductCategory.${category.toUpperCase()},
    status: 'inactive',
    isEnabled: false,
    metadata: {}
  };

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  async initialize(config: Record<string, any>): Promise<void> {
    // Initialize plugin with configuration
    // Example: setup API clients, validate credentials, etc.
    console.log(\`Initializing \${this.config.name} plugin...\`);
  }

  async validateConfig(config: Record<string, any>): Promise<ValidationResult> {
    const errors: string[] = [];

    // Add your configuration validation logic here
    // Example:
    // if (!config.apiKey) {
    //   errors.push('API key is required');
    // }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  async cleanup(): Promise<void> {
    // Cleanup resources when plugin is disabled
    console.log(\`Cleaning up \${this.config.name} plugin...\`);
  }

  // ============================================================================
  // Core Functionality
  // ============================================================================

  async processOrder(context: PluginContext): Promise<DeliveryResult> {
    try {
      // Implement your order processing logic here
      // Example: create account, generate credentials, etc.
      
      const deliveryData = {
        // Add your delivery data here
        message: 'Service delivered successfully',
        timestamp: new Date()
      };

      return {
        success: true,
        deliveryData,
        message: 'Order processed successfully',
        metadata: {}
      };
    } catch (error) {
      return {
        success: false,
        deliveryData: {},
        message: \`Order processing failed: \${(error as Error).message}\`,
        metadata: { error: (error as Error).message }
      };
    }
  }

  async validateProduct(productData: Record<string, any>): Promise<ValidationResult> {
    const errors: string[] = [];

    // Add your product validation logic here
    // Example: check if product configuration is valid

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  // ============================================================================
  // Optional Hook Methods
  // ============================================================================

  async onOrderCreated(context: PluginContext): Promise<void> {
    // Called when an order is created
    console.log(\`Order created for \${this.config.name}: \${context.order.id}\`);
  }

  async onPaymentCompleted(context: PluginContext): Promise<void> {
    // Called when payment is completed
    console.log(\`Payment completed for \${this.config.name}: \${context.order.id}\`);
  }

  async onOrderCancelled(context: PluginContext): Promise<void> {
    // Called when an order is cancelled
    console.log(\`Order cancelled for \${this.config.name}: \${context.order.id}\`);
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  async healthCheck(): Promise<boolean> {
    try {
      // Implement your health check logic here
      // Example: ping API endpoint, check database connection, etc.
      return true;
    } catch (error) {
      console.error(\`Health check failed for \${this.config.name}:\`, error);
      return false;
    }
  }
}`;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private static toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}

// ============================================================================
// Global Plugin Development Tools
// ============================================================================

export const pluginTester = new PluginTester();
export const mockDataGenerator = MockDataGenerator;
export const pluginTemplateGenerator = PluginTemplateGenerator;
