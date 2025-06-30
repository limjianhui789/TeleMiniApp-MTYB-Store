// ============================================================================
// MTYB Virtual Goods Platform - Plugin Testing and Validation Framework
// ============================================================================

import { BasePlugin } from '../core/plugin/BasePlugin';
import type {
  PluginContext,
  DeliveryResult,
  ValidationResult,
  PluginHealthStatus,
  Order,
  Product,
  User,
} from '../types';
import { Logger } from '../core/utils/Logger';

// ============================================================================
// Test Types
// ============================================================================

export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'validation' | 'delivery' | 'health' | 'integration' | 'performance';
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeout: number;
  setup?: () => Promise<void>;
  cleanup?: () => Promise<void>;
  execute: (plugin: BasePlugin, context: PluginTestContext) => Promise<TestResult>;
}

export interface TestResult {
  success: boolean;
  duration: number;
  message?: string;
  error?: Error;
  data?: any;
  warnings?: string[];
  performance?: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage?: number;
  };
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
  setup?: () => Promise<void>;
  cleanup?: () => Promise<void>;
}

export interface PluginTestContext {
  mockData: {
    user: User;
    product: Product;
    order: Order;
  };
  helpers: {
    createMockOrder: (productId: string, quantity: number) => Order;
    createMockProduct: (type: string, metadata?: any) => Product;
    createMockUser: (email?: string) => User;
    waitForCondition: (condition: () => boolean, timeout: number) => Promise<boolean>;
    measurePerformance: <T>(
      fn: () => Promise<T>
    ) => Promise<{ result: T; duration: number; memory: number }>;
  };
}

export interface TestReport {
  pluginId: string;
  pluginName: string;
  pluginVersion: string;
  testSuiteId: string;
  executionDate: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  results: Array<{
    testId: string;
    testName: string;
    result: TestResult;
  }>;
  summary: {
    overallStatus: 'passed' | 'failed' | 'warning';
    criticalIssues: number;
    performanceIssues: number;
    recommendations: string[];
  };
}

// ============================================================================
// Mock Data Generators
// ============================================================================

class MockDataGenerator {
  private static readonly SAMPLE_USERS: Partial<User>[] = [
    {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john.doe@example.com',
      languageCode: 'en',
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      username: 'janesmith',
      email: 'jane.smith@example.com',
      languageCode: 'en',
    },
    {
      firstName: 'Alice',
      lastName: 'Johnson',
      username: 'alicej',
      email: 'alice.johnson@example.com',
      languageCode: 'en',
    },
  ];

  static createMockUser(email?: string): User {
    const template = this.SAMPLE_USERS[Math.floor(Math.random() * this.SAMPLE_USERS.length)];
    return {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      firstName: template.firstName!,
      lastName: template.lastName,
      username: template.username!,
      email: email || template.email!,
      languageCode: template.languageCode!,
      isPremium: Math.random() > 0.7,
      isBot: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static createMockProduct(type: string, metadata: any = {}): Product {
    const baseProducts = {
      vpn: {
        name: 'Premium VPN Service',
        description: 'High-speed VPN with global servers',
        category: 'vpn',
        metadata: {
          serverRegions: ['us', 'eu', 'asia'],
          protocols: ['openvpn', 'wireguard'],
          maxConnections: 5,
          ...metadata,
        },
      },
      netflix: {
        name: 'Netflix Premium Account',
        description: '4K streaming account with multiple profiles',
        category: 'streaming',
        metadata: {
          planType: 'premium',
          region: 'US',
          profilesAllowed: 4,
          ...metadata,
        },
      },
      software: {
        name: 'Software License',
        description: 'Professional software package',
        category: 'software',
        metadata: {
          version: '1.0.0',
          platform: 'windows',
          licenseType: 'perpetual',
          ...metadata,
        },
      },
    };

    const template = baseProducts[type as keyof typeof baseProducts] || baseProducts.software;

    return {
      id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      description: template.description,
      price: Math.floor(Math.random() * 50) + 10,
      currency: 'USD',
      category: template.category,
      isActive: true,
      stock: Math.floor(Math.random() * 100) + 10,
      images: [`https://example.com/image_${Date.now()}.jpg`],
      metadata: template.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static createMockOrder(productId: string, quantity: number = 1): Order {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const unitPrice = Math.floor(Math.random() * 50) + 10;

    return {
      id: orderId,
      userId: `user_${Date.now()}`,
      items: [
        {
          id: `item_${Date.now()}`,
          productId,
          quantity,
          unitPrice,
          totalPrice: unitPrice * quantity,
          metadata: {},
        },
      ],
      status: 'pending',
      totalAmount: unitPrice * quantity,
      currency: 'USD',
      paymentMethod: 'telegram_stars',
      paymentStatus: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

// ============================================================================
// Performance Monitor
// ============================================================================

class PerformanceMonitor {
  private static getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    return 0;
  }

  static async measurePerformance<T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number; memory: number }> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = await fn();
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      return {
        result,
        duration: endTime - startTime,
        memory: Math.max(0, endMemory - startMemory),
      };
    } catch (error) {
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      throw Object.assign(error as Error, {
        duration: endTime - startTime,
        memory: Math.max(0, endMemory - startMemory),
      });
    }
  }
}

// ============================================================================
// Test Utilities
// ============================================================================

class TestUtilities {
  static async waitForCondition(condition: () => boolean, timeout: number): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
  }

  static validateDeliveryResult(result: DeliveryResult): string[] {
    const issues: string[] = [];

    if (result.success && !result.deliveryData) {
      issues.push('Successful delivery must include deliveryData');
    }

    if (!result.success && !result.error) {
      issues.push('Failed delivery must include error message');
    }

    if (result.metadata && typeof result.metadata !== 'object') {
      issues.push('Metadata must be an object if provided');
    }

    return issues;
  }

  static validateValidationResult(result: ValidationResult): string[] {
    const issues: string[] = [];

    if (typeof result.isValid !== 'boolean') {
      issues.push('ValidationResult.isValid must be a boolean');
    }

    if (!Array.isArray(result.errors)) {
      issues.push('ValidationResult.errors must be an array');
    }

    if (result.warnings && !Array.isArray(result.warnings)) {
      issues.push('ValidationResult.warnings must be an array if provided');
    }

    if (!result.isValid && result.errors.length === 0) {
      issues.push('Invalid validation must include error details');
    }

    return issues;
  }

  static validateHealthStatus(status: PluginHealthStatus): string[] {
    const issues: string[] = [];

    if (typeof status.isHealthy !== 'boolean') {
      issues.push('PluginHealthStatus.isHealthy must be a boolean');
    }

    if (!(status.lastCheck instanceof Date)) {
      issues.push('PluginHealthStatus.lastCheck must be a Date');
    }

    if (status.responseTime && typeof status.responseTime !== 'number') {
      issues.push('PluginHealthStatus.responseTime must be a number if provided');
    }

    return issues;
  }
}

// ============================================================================
// Core Test Suites
// ============================================================================

export class CoreTestSuites {
  static getBasicPluginTestSuite(): TestSuite {
    return {
      id: 'basic-plugin-tests',
      name: 'Basic Plugin Functionality',
      description: 'Tests fundamental plugin operations and compliance',
      testCases: [
        {
          id: 'plugin-initialization',
          name: 'Plugin Initialization',
          description: 'Verify plugin initializes correctly',
          category: 'validation',
          priority: 'critical',
          timeout: 10000,
          execute: async (plugin: BasePlugin) => {
            const startTime = performance.now();

            try {
              if (!plugin.isInitialized) {
                await plugin.initialize();
              }

              const duration = performance.now() - startTime;

              if (!plugin.isInitialized) {
                return {
                  success: false,
                  duration,
                  message: 'Plugin failed to initialize',
                };
              }

              return {
                success: true,
                duration,
                message: 'Plugin initialized successfully',
              };
            } catch (error) {
              return {
                success: false,
                duration: performance.now() - startTime,
                error: error as Error,
                message: 'Plugin initialization threw error',
              };
            }
          },
        },

        {
          id: 'plugin-metadata',
          name: 'Plugin Metadata Validation',
          description: 'Verify plugin provides required metadata',
          category: 'validation',
          priority: 'high',
          timeout: 1000,
          execute: async (plugin: BasePlugin) => {
            const startTime = performance.now();
            const issues: string[] = [];

            try {
              if (!plugin.getId() || typeof plugin.getId() !== 'string') {
                issues.push('Plugin must provide valid ID');
              }

              if (!plugin.getName() || typeof plugin.getName() !== 'string') {
                issues.push('Plugin must provide valid name');
              }

              if (!plugin.getVersion() || typeof plugin.getVersion() !== 'string') {
                issues.push('Plugin must provide valid version');
              }

              if (!plugin.getDescription() || typeof plugin.getDescription() !== 'string') {
                issues.push('Plugin must provide valid description');
              }

              const duration = performance.now() - startTime;

              return {
                success: issues.length === 0,
                duration,
                message:
                  issues.length === 0
                    ? 'All metadata valid'
                    : `Metadata issues: ${issues.join(', ')}`,
                warnings: issues.length > 0 ? issues : undefined,
              };
            } catch (error) {
              return {
                success: false,
                duration: performance.now() - startTime,
                error: error as Error,
                message: 'Failed to retrieve plugin metadata',
              };
            }
          },
        },

        {
          id: 'health-check',
          name: 'Health Status Check',
          description: 'Verify plugin reports health status correctly',
          category: 'health',
          priority: 'high',
          timeout: 15000,
          execute: async (plugin: BasePlugin) => {
            const { result: healthStatus, duration } = await PerformanceMonitor.measurePerformance(
              () => plugin.getHealthStatus()
            );

            const validationIssues = TestUtilities.validateHealthStatus(healthStatus);

            return {
              success: validationIssues.length === 0,
              duration,
              message:
                validationIssues.length === 0
                  ? `Health check completed (${healthStatus.isHealthy ? 'healthy' : 'unhealthy'})`
                  : `Health status validation failed: ${validationIssues.join(', ')}`,
              data: healthStatus,
              warnings: validationIssues.length > 0 ? validationIssues : undefined,
            };
          },
        },
      ],
    };
  }

  static getValidationTestSuite(): TestSuite {
    return {
      id: 'order-validation-tests',
      name: 'Order Validation Tests',
      description: 'Tests plugin order validation capabilities',
      testCases: [
        {
          id: 'valid-order-validation',
          name: 'Valid Order Validation',
          description: 'Test validation with valid order data',
          category: 'validation',
          priority: 'critical',
          timeout: 5000,
          execute: async (plugin: BasePlugin, context: PluginTestContext) => {
            const { result: validationResult, duration } =
              await PerformanceMonitor.measurePerformance(() =>
                plugin.validateOrder({
                  product: context.mockData.product,
                  order: context.mockData.order,
                  user: context.mockData.user,
                })
              );

            const validationIssues = TestUtilities.validateValidationResult(validationResult);

            return {
              success: validationIssues.length === 0 && validationResult.isValid,
              duration,
              message:
                validationIssues.length === 0
                  ? validationResult.isValid
                    ? 'Valid order accepted'
                    : `Order rejected: ${validationResult.errors.map(e => e.message).join(', ')}`
                  : `Validation result invalid: ${validationIssues.join(', ')}`,
              data: validationResult,
              warnings: validationResult.warnings?.map(w => w.message),
            };
          },
        },

        {
          id: 'invalid-order-validation',
          name: 'Invalid Order Handling',
          description: 'Test validation with invalid order data',
          category: 'validation',
          priority: 'high',
          timeout: 5000,
          execute: async (plugin: BasePlugin, context: PluginTestContext) => {
            // Create invalid order (e.g., invalid user email)
            const invalidUser = { ...context.mockData.user, email: 'invalid-email' };

            const { result: validationResult, duration } =
              await PerformanceMonitor.measurePerformance(() =>
                plugin.validateOrder({
                  product: context.mockData.product,
                  order: context.mockData.order,
                  user: invalidUser,
                })
              );

            const validationIssues = TestUtilities.validateValidationResult(validationResult);

            return {
              success: validationIssues.length === 0,
              duration,
              message:
                validationIssues.length === 0
                  ? validationResult.isValid
                    ? 'WARNING: Invalid order was accepted'
                    : 'Invalid order correctly rejected'
                  : `Validation result invalid: ${validationIssues.join(', ')}`,
              data: validationResult,
              warnings: validationResult.isValid ? ['Plugin accepted invalid order'] : undefined,
            };
          },
        },
      ],
    };
  }

  static getDeliveryTestSuite(): TestSuite {
    return {
      id: 'delivery-tests',
      name: 'Delivery Processing Tests',
      description: 'Tests plugin delivery processing capabilities',
      testCases: [
        {
          id: 'successful-delivery',
          name: 'Successful Delivery Processing',
          description: 'Test delivery with valid order',
          category: 'delivery',
          priority: 'critical',
          timeout: 30000,
          execute: async (plugin: BasePlugin, context: PluginTestContext) => {
            const {
              result: deliveryResult,
              duration,
              memory,
            } = await PerformanceMonitor.measurePerformance(() =>
              plugin.processDelivery({
                product: context.mockData.product,
                order: context.mockData.order,
                user: context.mockData.user,
              })
            );

            const validationIssues = TestUtilities.validateDeliveryResult(deliveryResult);

            return {
              success: validationIssues.length === 0 && deliveryResult.success,
              duration,
              message:
                validationIssues.length === 0
                  ? deliveryResult.success
                    ? 'Delivery completed successfully'
                    : `Delivery failed: ${deliveryResult.error}`
                  : `Delivery result invalid: ${validationIssues.join(', ')}`,
              data: deliveryResult,
              performance: {
                responseTime: duration,
                memoryUsage: memory,
              },
              warnings: validationIssues.length > 0 ? validationIssues : undefined,
            };
          },
        },

        {
          id: 'delivery-idempotency',
          name: 'Delivery Idempotency',
          description: 'Test that duplicate deliveries are handled correctly',
          category: 'delivery',
          priority: 'medium',
          timeout: 60000,
          execute: async (plugin: BasePlugin, context: PluginTestContext) => {
            const deliveryContext = {
              product: context.mockData.product,
              order: context.mockData.order,
              user: context.mockData.user,
            };

            // First delivery
            const firstDelivery = await plugin.processDelivery(deliveryContext);
            if (!firstDelivery.success) {
              return {
                success: false,
                duration: 0,
                message: 'First delivery failed, cannot test idempotency',
              };
            }

            // Second delivery (should handle gracefully)
            const { result: secondDelivery, duration } =
              await PerformanceMonitor.measurePerformance(() =>
                plugin.processDelivery(deliveryContext)
              );

            return {
              success: true, // Both outcomes are acceptable
              duration,
              message: secondDelivery.success
                ? 'Plugin allows duplicate deliveries'
                : 'Plugin prevents duplicate deliveries',
              data: { firstDelivery, secondDelivery },
              warnings: secondDelivery.success
                ? ['Duplicate delivery allowed - ensure this is intentional']
                : undefined,
            };
          },
        },
      ],
    };
  }

  static getPerformanceTestSuite(): TestSuite {
    return {
      id: 'performance-tests',
      name: 'Performance Tests',
      description: 'Tests plugin performance characteristics',
      testCases: [
        {
          id: 'validation-performance',
          name: 'Validation Performance',
          description: 'Measure validation response time',
          category: 'performance',
          priority: 'medium',
          timeout: 10000,
          execute: async (plugin: BasePlugin, context: PluginTestContext) => {
            const measurements: number[] = [];
            const iterations = 10;

            for (let i = 0; i < iterations; i++) {
              const { duration } = await PerformanceMonitor.measurePerformance(() =>
                plugin.validateOrder({
                  product: context.mockData.product,
                  order: context.mockData.order,
                  user: context.mockData.user,
                })
              );
              measurements.push(duration);
            }

            const avgDuration = measurements.reduce((a, b) => a + b, 0) / measurements.length;
            const maxDuration = Math.max(...measurements);
            const minDuration = Math.min(...measurements);

            const performanceIssues: string[] = [];
            if (avgDuration > 1000) performanceIssues.push('Average validation time exceeds 1s');
            if (maxDuration > 3000) performanceIssues.push('Maximum validation time exceeds 3s');

            return {
              success: performanceIssues.length === 0,
              duration: avgDuration,
              message: `Validation performance: avg=${avgDuration.toFixed(2)}ms, min=${minDuration.toFixed(2)}ms, max=${maxDuration.toFixed(2)}ms`,
              data: { avgDuration, minDuration, maxDuration, measurements },
              performance: {
                responseTime: avgDuration,
                memoryUsage: 0,
              },
              warnings: performanceIssues,
            };
          },
        },

        {
          id: 'concurrent-delivery-performance',
          name: 'Concurrent Delivery Performance',
          description: 'Test plugin under concurrent delivery load',
          category: 'performance',
          priority: 'low',
          timeout: 60000,
          execute: async (plugin: BasePlugin, context: PluginTestContext) => {
            const concurrentRequests = 5;
            const startTime = performance.now();

            const deliveryPromises = Array.from({ length: concurrentRequests }, (_, i) => {
              const order = context.helpers.createMockOrder(context.mockData.product.id, 1);
              order.id = `${order.id}_concurrent_${i}`;

              return plugin.processDelivery({
                product: context.mockData.product,
                order,
                user: context.mockData.user,
              });
            });

            try {
              const results = await Promise.all(deliveryPromises);
              const duration = performance.now() - startTime;

              const successCount = results.filter(r => r.success).length;
              const failureCount = results.length - successCount;

              const performanceIssues: string[] = [];
              if (duration > 30000)
                performanceIssues.push('Concurrent deliveries took longer than 30s');
              if (failureCount > concurrentRequests * 0.2)
                performanceIssues.push('More than 20% of concurrent deliveries failed');

              return {
                success: performanceIssues.length === 0,
                duration,
                message: `Concurrent delivery test: ${successCount} succeeded, ${failureCount} failed in ${duration.toFixed(2)}ms`,
                data: { results, successCount, failureCount, concurrentRequests },
                performance: {
                  responseTime: duration,
                  memoryUsage: 0,
                },
                warnings: performanceIssues,
              };
            } catch (error) {
              return {
                success: false,
                duration: performance.now() - startTime,
                error: error as Error,
                message: 'Concurrent delivery test failed with error',
              };
            }
          },
        },
      ],
    };
  }
}

// ============================================================================
// Plugin Test Runner
// ============================================================================

export class PluginTestRunner {
  private logger: Logger;
  private testSuites: Map<string, TestSuite> = new Map();

  constructor() {
    this.logger = new Logger('PluginTestRunner');
    this.initializeCoreTestSuites();
  }

  private initializeCoreTestSuites(): void {
    this.addTestSuite(CoreTestSuites.getBasicPluginTestSuite());
    this.addTestSuite(CoreTestSuites.getValidationTestSuite());
    this.addTestSuite(CoreTestSuites.getDeliveryTestSuite());
    this.addTestSuite(CoreTestSuites.getPerformanceTestSuite());
  }

  addTestSuite(testSuite: TestSuite): void {
    this.testSuites.set(testSuite.id, testSuite);
    this.logger.info('Test suite added', {
      suiteId: testSuite.id,
      testCount: testSuite.testCases.length,
    });
  }

  getTestSuite(suiteId: string): TestSuite | undefined {
    return this.testSuites.get(suiteId);
  }

  getAllTestSuites(): TestSuite[] {
    return Array.from(this.testSuites.values());
  }

  async runTestSuite(plugin: BasePlugin, suiteId: string): Promise<TestReport> {
    const testSuite = this.testSuites.get(suiteId);
    if (!testSuite) {
      throw new Error(`Test suite '${suiteId}' not found`);
    }

    this.logger.info('Starting test suite execution', {
      pluginId: plugin.getId(),
      suiteId: testSuite.id,
      testCount: testSuite.testCases.length,
    });

    const startTime = Date.now();
    const testResults: Array<{ testId: string; testName: string; result: TestResult }> = [];

    // Create test context
    const testContext = this.createTestContext();

    // Setup suite
    if (testSuite.setup) {
      try {
        await testSuite.setup();
      } catch (error) {
        this.logger.error('Test suite setup failed', { error, suiteId });
        throw error;
      }
    }

    // Run tests
    for (const testCase of testSuite.testCases) {
      this.logger.debug('Executing test case', { testId: testCase.id, testName: testCase.name });

      try {
        // Setup test case
        if (testCase.setup) {
          await testCase.setup();
        }

        // Execute test with timeout
        const testResult = await Promise.race([
          testCase.execute(plugin, testContext),
          this.createTimeoutPromise(testCase.timeout, testCase.id),
        ]);

        testResults.push({
          testId: testCase.id,
          testName: testCase.name,
          result: testResult,
        });

        // Cleanup test case
        if (testCase.cleanup) {
          await testCase.cleanup();
        }
      } catch (error) {
        testResults.push({
          testId: testCase.id,
          testName: testCase.name,
          result: {
            success: false,
            duration: 0,
            error: error as Error,
            message: `Test execution failed: ${(error as Error).message}`,
          },
        });
      }
    }

    // Cleanup suite
    if (testSuite.cleanup) {
      try {
        await testSuite.cleanup();
      } catch (error) {
        this.logger.warn('Test suite cleanup failed', { error, suiteId });
      }
    }

    const totalDuration = Date.now() - startTime;
    const report = this.generateTestReport(plugin, testSuite, testResults, totalDuration);

    this.logger.info('Test suite execution completed', {
      pluginId: plugin.getId(),
      suiteId: testSuite.id,
      totalTests: report.totalTests,
      passedTests: report.passedTests,
      failedTests: report.failedTests,
      duration: totalDuration,
    });

    return report;
  }

  async runAllTestSuites(plugin: BasePlugin): Promise<TestReport[]> {
    const reports: TestReport[] = [];

    for (const testSuite of this.testSuites.values()) {
      try {
        const report = await this.runTestSuite(plugin, testSuite.id);
        reports.push(report);
      } catch (error) {
        this.logger.error('Test suite execution failed', {
          error,
          pluginId: plugin.getId(),
          suiteId: testSuite.id,
        });

        // Create failure report
        reports.push({
          pluginId: plugin.getId(),
          pluginName: plugin.getName(),
          pluginVersion: plugin.getVersion(),
          testSuiteId: testSuite.id,
          executionDate: new Date(),
          totalTests: testSuite.testCases.length,
          passedTests: 0,
          failedTests: testSuite.testCases.length,
          skippedTests: 0,
          totalDuration: 0,
          results: testSuite.testCases.map(tc => ({
            testId: tc.id,
            testName: tc.name,
            result: {
              success: false,
              duration: 0,
              error: error as Error,
              message: 'Test suite execution failed',
            },
          })),
          summary: {
            overallStatus: 'failed',
            criticalIssues: testSuite.testCases.filter(tc => tc.priority === 'critical').length,
            performanceIssues: 0,
            recommendations: ['Fix test suite execution issues before proceeding'],
          },
        });
      }
    }

    return reports;
  }

  private createTestContext(): PluginTestContext {
    return {
      mockData: {
        user: MockDataGenerator.createMockUser(),
        product: MockDataGenerator.createMockProduct('software'),
        order: MockDataGenerator.createMockOrder('product_123'),
      },
      helpers: {
        createMockOrder: MockDataGenerator.createMockOrder,
        createMockProduct: MockDataGenerator.createMockProduct,
        createMockUser: MockDataGenerator.createMockUser,
        waitForCondition: TestUtilities.waitForCondition,
        measurePerformance: PerformanceMonitor.measurePerformance,
      },
    };
  }

  private createTimeoutPromise(timeout: number, testId: string): Promise<TestResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Test '${testId}' timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  private generateTestReport(
    plugin: BasePlugin,
    testSuite: TestSuite,
    results: Array<{ testId: string; testName: string; result: TestResult }>,
    totalDuration: number
  ): TestReport {
    const passedTests = results.filter(r => r.result.success).length;
    const failedTests = results.filter(r => !r.result.success).length;
    const criticalFailures = results.filter(
      r =>
        !r.result.success &&
        testSuite.testCases.find(tc => tc.id === r.testId)?.priority === 'critical'
    ).length;

    const performanceIssues = results.filter(
      r => r.result.performance && r.result.performance.responseTime > 5000
    ).length;

    const recommendations: string[] = [];
    if (criticalFailures > 0) {
      recommendations.push('Address critical test failures before production deployment');
    }
    if (performanceIssues > 0) {
      recommendations.push('Optimize plugin performance for better response times');
    }
    if (failedTests > passedTests) {
      recommendations.push('Plugin stability issues detected - comprehensive review needed');
    }

    return {
      pluginId: plugin.getId(),
      pluginName: plugin.getName(),
      pluginVersion: plugin.getVersion(),
      testSuiteId: testSuite.id,
      executionDate: new Date(),
      totalTests: results.length,
      passedTests,
      failedTests,
      skippedTests: 0,
      totalDuration,
      results,
      summary: {
        overallStatus: criticalFailures > 0 ? 'failed' : failedTests > 0 ? 'warning' : 'passed',
        criticalIssues: criticalFailures,
        performanceIssues,
        recommendations,
      },
    };
  }
}

// Export for easy use
export const pluginTestRunner = new PluginTestRunner();
