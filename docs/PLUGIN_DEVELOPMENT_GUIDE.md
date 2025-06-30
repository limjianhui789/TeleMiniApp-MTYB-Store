# Plugin Development Guide

## 插件开发指南

### 概述

MTYB Virtual Goods
Platform 采用插件化架构，允许开发者为不同类型的虚拟商品创建专用的处理插件。每个插件负责处理特定产品的订单交付逻辑。

## 插件架构

### 基础插件接口

```typescript
export abstract class BasePlugin {
  abstract config: PluginConfig;

  // 必需方法
  abstract initialize(config: Record<string, any>): Promise<void>;
  abstract validateConfig(
    config: Record<string, any>
  ): Promise<PluginValidationResult>;
  abstract processOrder(context: PluginContext): Promise<DeliveryResult>;
  abstract validateProduct(
    productData: Record<string, any>
  ): Promise<PluginValidationResult>;

  // 可选钩子方法
  async onOrderCreated?(context: PluginContext): Promise<void> {}
  async onPaymentCompleted?(context: PluginContext): Promise<void> {}
  async onOrderCancelled?(context: PluginContext): Promise<void> {}

  // 健康检查
  async healthCheck?(): Promise<boolean> {
    return true;
  }
}
```

### 插件配置

```typescript
interface PluginConfig {
  id: string; // 唯一标识符
  name: string; // 显示名称
  version: string; // 版本号
  description: string; // 描述
  author: string; // 作者
  category: ProductCategory; // 产品分类
  configSchema: Record<string, any>; // 配置模式
  isActive: boolean; // 是否激活
}
```

## 插件开发示例

### 1. VPN 插件示例

```typescript
import {
  BasePlugin,
  PluginConfig,
  PluginContext,
  DeliveryResult,
  ProductCategory,
} from '@/types';

export class VPNPlugin extends BasePlugin {
  config: PluginConfig = {
    id: 'vpn-plugin',
    name: 'VPN Service Plugin',
    version: '1.0.0',
    description: 'Automatically creates VPN accounts via API',
    author: 'MTYB Team',
    category: ProductCategory.VPN,
    configSchema: {
      apiEndpoint: { type: 'string', required: true },
      apiKey: { type: 'string', required: true },
      serverRegions: { type: 'array', required: true },
    },
    isActive: true,
  };

  private apiEndpoint: string = '';
  private apiKey: string = '';
  private serverRegions: string[] = [];

  async initialize(config: Record<string, any>): Promise<void> {
    this.apiEndpoint = config.apiEndpoint;
    this.apiKey = config.apiKey;
    this.serverRegions = config.serverRegions || [];

    // 测试 API 连接
    await this.testConnection();
  }

  async validateConfig(
    config: Record<string, any>
  ): Promise<PluginValidationResult> {
    const errors: string[] = [];

    if (!config.apiEndpoint) errors.push('API endpoint is required');
    if (!config.apiKey) errors.push('API key is required');
    if (!config.serverRegions?.length)
      errors.push('At least one server region is required');

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  async processOrder(context: PluginContext): Promise<DeliveryResult> {
    try {
      // 从产品元数据获取配置
      const { duration, region } = context.productMetadata;

      // 调用 VPN 服务 API 创建账户
      const account = await this.createVPNAccount({
        duration,
        region: region || this.serverRegions[0],
        orderId: context.orderId,
      });

      return {
        success: true,
        deliveryData: {
          username: account.username,
          password: account.password,
          serverConfig: account.serverConfig,
          expiryDate: account.expiryDate,
          downloadLinks: account.downloadLinks,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create VPN account: ${error.message}`,
      };
    }
  }

  async validateProduct(
    productData: Record<string, any>
  ): Promise<PluginValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!productData.duration) {
      errors.push('VPN duration is required');
    }

    if (
      productData.region &&
      !this.serverRegions.includes(productData.region)
    ) {
      warnings.push(
        `Region ${productData.region} not available, will use default`
      );
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.testConnection();
      return true;
    } catch {
      return false;
    }
  }

  private async createVPNAccount(params: {
    duration: number;
    region: string;
    orderId: string;
  }) {
    const response = await fetch(`${this.apiEndpoint}/accounts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        duration_days: params.duration,
        server_region: params.region,
        reference_id: params.orderId,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  private async testConnection(): Promise<void> {
    const response = await fetch(`${this.apiEndpoint}/health`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!response.ok) {
      throw new Error('VPN API connection failed');
    }
  }
}
```

### 2. 邮件集成插件模板

```typescript
export class EmailIntegrationPlugin extends BasePlugin {
  config: PluginConfig = {
    id: 'email-integration-plugin',
    name: 'Email Integration Plugin',
    version: '1.0.0',
    description: 'Retrieves account information via email',
    author: 'MTYB Team',
    category: ProductCategory.STREAMING,
    configSchema: {
      emailProvider: { type: 'string', required: true },
      emailCredentials: { type: 'object', required: true },
      accountPool: { type: 'array', required: true },
    },
    isActive: true,
  };

  async processOrder(context: PluginContext): Promise<DeliveryResult> {
    try {
      // 从账户池中分配账户
      const account = await this.allocateAccount(context.productMetadata);

      // 通过邮件获取验证码或账户信息
      const accountDetails = await this.retrieveAccountDetails(account);

      return {
        success: true,
        deliveryData: {
          email: account.email,
          password: account.password,
          additionalInfo: accountDetails,
          instructions: 'Please change password after first login',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to process email integration: ${error.message}`,
      };
    }
  }

  private async allocateAccount(productMetadata: Record<string, any>) {
    // 账户分配逻辑
    // 可以基于产品类型、地区等进行智能分配
  }

  private async retrieveAccountDetails(account: any) {
    // 邮件集成逻辑
    // 连接邮件服务器，获取验证码或账户详情
  }
}
```

### 3. KeyAuth 集成插件模板

```typescript
export class KeyAuthPlugin extends BasePlugin {
  config: PluginConfig = {
    id: 'keyauth-plugin',
    name: 'KeyAuth Integration Plugin',
    version: '1.0.0',
    description: 'Retrieves license keys from KeyAuth system',
    author: 'MTYB Team',
    category: ProductCategory.GAMING,
    configSchema: {
      keyauthEndpoint: { type: 'string', required: true },
      applicationId: { type: 'string', required: true },
      applicationSecret: { type: 'string', required: true },
    },
    isActive: true,
  };

  async processOrder(context: PluginContext): Promise<DeliveryResult> {
    try {
      // 从 KeyAuth 获取许可证密钥
      const licenseKey = await this.generateLicenseKey({
        productId: context.productId,
        userId: context.userId,
        orderId: context.orderId,
        duration: context.productMetadata.duration,
      });

      return {
        success: true,
        deliveryData: {
          licenseKey: licenseKey.key,
          expiryDate: licenseKey.expiryDate,
          downloadUrl: licenseKey.downloadUrl,
          instructions: 'Use this key to activate your software',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate license key: ${error.message}`,
      };
    }
  }

  private async generateLicenseKey(params: {
    productId: string;
    userId: string;
    orderId: string;
    duration: number;
  }) {
    // KeyAuth API 调用逻辑
    const response = await fetch(`${this.keyauthEndpoint}/licenses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.applicationSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: this.applicationId,
        duration_days: params.duration,
        user_id: params.userId,
        order_reference: params.orderId,
      }),
    });

    return await response.json();
  }
}
```

## 插件注册和使用

### 注册插件

```typescript
import { pluginManager } from '@/core/PluginManager';
import { VPNPlugin } from '@/plugins/VPNPlugin';

// 注册插件
await pluginManager.registerPlugin(new VPNPlugin());
```

### 使用插件处理订单

```typescript
// 处理订单
const result = await pluginManager.processOrder('vpn-plugin', {
  orderId: 'order-123',
  userId: 'user-456',
  productId: 'vpn-monthly',
  productMetadata: { duration: 30, region: 'us-east' },
  orderMetadata: {},
  config: {},
});

if (result.success) {
  console.log('Order processed successfully:', result.deliveryData);
} else {
  console.error('Order processing failed:', result.error);
}
```

## 最佳实践

### 1. 错误处理

- 始终使用 try-catch 包装异步操作
- 提供有意义的错误消息
- 区分可重试和不可重试的错误

### 2. 配置管理

- 验证所有必需的配置参数
- 提供默认值和回退选项
- 支持配置热重载

### 3. 日志记录

- 记录关键操作和错误
- 避免记录敏感信息
- 使用结构化日志格式

### 4. 性能优化

- 实现连接池和缓存
- 避免阻塞操作
- 设置合理的超时时间

### 5. 安全考虑

- 验证所有输入数据
- 安全存储敏感配置
- 实现访问控制和审计

## 插件测试框架

MTYB平台提供了完整的插件测试和验证框架，帮助开发者确保插件的质量和可靠性。

### 自动化测试套件

框架包含以下预定义的测试套件：

#### 1. 基础插件功能测试 (`basic-plugin-tests`)

- 插件初始化测试
- 插件元数据验证
- 健康状态检查

#### 2. 订单验证测试 (`order-validation-tests`)

- 有效订单验证
- 无效订单处理
- 边界条件测试

#### 3. 交付处理测试 (`delivery-tests`)

- 成功交付处理
- 交付幂等性测试
- 错误恢复测试

#### 4. 性能测试 (`performance-tests`)

- 验证响应时间
- 并发交付测试
- 内存使用分析

### 使用测试框架

#### 快速开始

```typescript
import { pluginTestRunner, testReportGenerator } from '@/plugins/testing';
import { myPlugin } from './MyPlugin';

async function testMyPlugin() {
  // 初始化插件
  await myPlugin.initialize();

  // 运行所有测试套件
  const reports = await pluginTestRunner.runAllTestSuites(myPlugin);

  // 生成控制台报告
  const consoleReport = testReportGenerator.generateConsolidatedReport(
    reports,
    {
      format: 'console',
      includeDetails: true,
      includePerformanceMetrics: true,
      includeRecommendations: true,
    }
  );

  console.log(consoleReport);
}
```

#### 创建自定义测试

```typescript
import { TestSuite, TestCase } from '@/plugins/testing';

const customTestSuite: TestSuite = {
  id: 'my-custom-tests',
  name: 'My Custom Test Suite',
  description: 'Custom tests for specific plugin functionality',
  testCases: [
    {
      id: 'custom-api-test',
      name: 'API Integration Test',
      description: 'Test API connectivity and response',
      category: 'integration',
      priority: 'high',
      timeout: 10000,
      execute: async (plugin, context) => {
        // 自定义测试逻辑
        const startTime = performance.now();

        try {
          // 测试API调用
          const result = await plugin.processDelivery({
            product: context.mockData.product,
            order: context.mockData.order,
            user: context.mockData.user,
          });

          const duration = performance.now() - startTime;

          return {
            success: result.success,
            duration,
            message: result.success ? 'API test passed' : 'API test failed',
            data: result,
          };
        } catch (error) {
          return {
            success: false,
            duration: performance.now() - startTime,
            error: error as Error,
            message: 'API test threw exception',
          };
        }
      },
    },
  ],
};

// 添加到测试运行器
pluginTestRunner.addTestSuite(customTestSuite);
```

#### 生成测试报告

测试框架支持多种报告格式：

```typescript
// HTML报告 (适合CI/CD和文档)
const htmlReport = testReportGenerator.generateSingleReport(report, {
  format: 'html',
  includeDetails: true,
  includePerformanceMetrics: true,
  includeRecommendations: true,
  theme: 'telegram',
});

// Markdown报告 (适合GitHub等)
const markdownReport = testReportGenerator.generateSingleReport(report, {
  format: 'markdown',
  includeDetails: true,
  includePerformanceMetrics: true,
  includeRecommendations: true,
});

// JSON报告 (适合API集成)
const jsonReport = testReportGenerator.generateSingleReport(report, {
  format: 'json',
  includeDetails: true,
  includePerformanceMetrics: true,
  includeRecommendations: false,
});

// 控制台报告 (适合开发调试)
const consoleReport = testReportGenerator.generateSingleReport(report, {
  format: 'console',
  includeDetails: true,
  includePerformanceMetrics: false,
  includeRecommendations: true,
});
```

### 测试最佳实践

#### 1. 测试数据管理

```typescript
// 使用模拟数据生成器
const mockUser = context.helpers.createMockUser('test@example.com');
const mockProduct = context.helpers.createMockProduct('vpn', {
  serverRegions: ['us-east'],
  protocols: ['openvpn'],
});
const mockOrder = context.helpers.createMockOrder(mockProduct.id, 2);
```

#### 2. 性能测试

```typescript
// 测试响应时间
const { result, duration, memory } = await context.helpers.measurePerformance(
  () => plugin.processDelivery(pluginContext)
);

// 验证性能指标
if (duration > 5000) {
  return {
    success: false,
    duration,
    message: 'Response time exceeds 5 seconds',
    warnings: ['Performance optimization needed'],
  };
}
```

#### 3. 错误场景测试

```typescript
// 测试网络错误处理
const networkErrorTest = {
  id: 'network-error-handling',
  name: 'Network Error Handling',
  description: 'Test plugin behavior during network failures',
  category: 'error-handling',
  priority: 'high',
  timeout: 15000,
  execute: async (plugin, context) => {
    // 模拟网络错误
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    try {
      const result = await plugin.processDelivery(context);

      // 验证错误处理
      return {
        success: !result.success && result.retryable === true,
        duration: 100,
        message: result.success
          ? 'Plugin should have failed on network error'
          : 'Network error handled correctly',
      };
    } finally {
      global.fetch = originalFetch;
    }
  },
};
```

### 持续集成集成

#### GitHub Actions示例

```yaml
name: Plugin Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run plugin tests
        run: npm run test:plugins

      - name: Generate test report
        run: npm run test:report

      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: reports/
```

#### npm脚本配置

```json
{
  "scripts": {
    "test:plugins": "node scripts/test-plugins.js",
    "test:report": "node scripts/generate-test-reports.js",
    "test:coverage": "nyc npm run test:plugins"
  }
}
```

### 单元测试示例

```typescript
import { VPNPlugin } from '@/plugins/VPNPlugin';
import { pluginTestRunner } from '@/plugins/testing';

describe('VPNPlugin', () => {
  let plugin: VPNPlugin;

  beforeEach(async () => {
    plugin = new VPNPlugin();
    await plugin.initialize({
      apiEndpoint: process.env.TEST_VPN_API_ENDPOINT,
      apiKey: process.env.TEST_VPN_API_KEY,
      serverRegions: ['us-east', 'eu-west'],
    });
  });

  test('should pass all standard plugin tests', async () => {
    const reports = await pluginTestRunner.runAllTestSuites(plugin);

    // 验证没有关键错误
    const criticalIssues = reports.reduce(
      (sum, r) => sum + r.summary.criticalIssues,
      0
    );
    expect(criticalIssues).toBe(0);

    // 验证总体通过率
    const totalTests = reports.reduce((sum, r) => sum + r.totalTests, 0);
    const passedTests = reports.reduce((sum, r) => sum + r.passedTests, 0);
    const passRate = (passedTests / totalTests) * 100;
    expect(passRate).toBeGreaterThanOrEqual(90);
  });

  test('should validate config correctly', async () => {
    const config = {
      apiEndpoint: 'https://api.vpnservice.com',
      apiKey: 'test-key',
      serverRegions: ['us-east', 'eu-west'],
    };

    const result = await plugin.validateConfig(config);
    expect(result.isValid).toBe(true);
  });

  test('should handle VPN-specific scenarios', async () => {
    // 运行VPN特定测试
    const customTestSuite = createVpnSpecificTestSuite();
    pluginTestRunner.addTestSuite(customTestSuite);

    const report = await pluginTestRunner.runTestSuite(
      plugin,
      customTestSuite.id
    );
    expect(report.failedTests).toBe(0);
  });
});
```

## 部署和发布

### 插件打包

```bash
# 构建插件
npm run build:plugin

# 验证插件
npm run validate:plugin

# 发布插件
npm run publish:plugin
```

### 版本管理

- 遵循语义化版本控制
- 维护变更日志
- 提供迁移指南
