# Plugin Development Guide

## 插件开发指南

### 概述

MTYB Virtual Goods Platform 采用插件化架构，允许开发者为不同类型的虚拟商品创建专用的处理插件。每个插件负责处理特定产品的订单交付逻辑。

## 插件架构

### 基础插件接口

```typescript
export abstract class BasePlugin {
  abstract config: PluginConfig;
  
  // 必需方法
  abstract initialize(config: Record<string, any>): Promise<void>;
  abstract validateConfig(config: Record<string, any>): Promise<PluginValidationResult>;
  abstract processOrder(context: PluginContext): Promise<DeliveryResult>;
  abstract validateProduct(productData: Record<string, any>): Promise<PluginValidationResult>;
  
  // 可选钩子方法
  async onOrderCreated?(context: PluginContext): Promise<void> {}
  async onPaymentCompleted?(context: PluginContext): Promise<void> {}
  async onOrderCancelled?(context: PluginContext): Promise<void> {}
  
  // 健康检查
  async healthCheck?(): Promise<boolean> { return true; }
}
```

### 插件配置

```typescript
interface PluginConfig {
  id: string;                    // 唯一标识符
  name: string;                  // 显示名称
  version: string;               // 版本号
  description: string;           // 描述
  author: string;                // 作者
  category: ProductCategory;     // 产品分类
  configSchema: Record<string, any>; // 配置模式
  isActive: boolean;             // 是否激活
}
```

## 插件开发示例

### 1. VPN 插件示例

```typescript
import { BasePlugin, PluginConfig, PluginContext, DeliveryResult, ProductCategory } from '@/types';

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
      serverRegions: { type: 'array', required: true }
    },
    isActive: true
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

  async validateConfig(config: Record<string, any>): Promise<PluginValidationResult> {
    const errors: string[] = [];
    
    if (!config.apiEndpoint) errors.push('API endpoint is required');
    if (!config.apiKey) errors.push('API key is required');
    if (!config.serverRegions?.length) errors.push('At least one server region is required');
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
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
        orderId: context.orderId
      });

      return {
        success: true,
        deliveryData: {
          username: account.username,
          password: account.password,
          serverConfig: account.serverConfig,
          expiryDate: account.expiryDate,
          downloadLinks: account.downloadLinks
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create VPN account: ${error.message}`
      };
    }
  }

  async validateProduct(productData: Record<string, any>): Promise<PluginValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!productData.duration) {
      errors.push('VPN duration is required');
    }
    
    if (productData.region && !this.serverRegions.includes(productData.region)) {
      warnings.push(`Region ${productData.region} not available, will use default`);
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
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        duration_days: params.duration,
        server_region: params.region,
        reference_id: params.orderId
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  private async testConnection(): Promise<void> {
    const response = await fetch(`${this.apiEndpoint}/health`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
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
      accountPool: { type: 'array', required: true }
    },
    isActive: true
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
          instructions: 'Please change password after first login'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to process email integration: ${error.message}`
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
      applicationSecret: { type: 'string', required: true }
    },
    isActive: true
  };

  async processOrder(context: PluginContext): Promise<DeliveryResult> {
    try {
      // 从 KeyAuth 获取许可证密钥
      const licenseKey = await this.generateLicenseKey({
        productId: context.productId,
        userId: context.userId,
        orderId: context.orderId,
        duration: context.productMetadata.duration
      });

      return {
        success: true,
        deliveryData: {
          licenseKey: licenseKey.key,
          expiryDate: licenseKey.expiryDate,
          downloadUrl: licenseKey.downloadUrl,
          instructions: 'Use this key to activate your software'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate license key: ${error.message}`
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
        'Authorization': `Bearer ${this.applicationSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: this.applicationId,
        duration_days: params.duration,
        user_id: params.userId,
        order_reference: params.orderId
      })
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
  config: {}
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

## 测试指南

### 单元测试示例

```typescript
import { VPNPlugin } from '@/plugins/VPNPlugin';

describe('VPNPlugin', () => {
  let plugin: VPNPlugin;

  beforeEach(() => {
    plugin = new VPNPlugin();
  });

  test('should validate config correctly', async () => {
    const config = {
      apiEndpoint: 'https://api.vpnservice.com',
      apiKey: 'test-key',
      serverRegions: ['us-east', 'eu-west']
    };

    const result = await plugin.validateConfig(config);
    expect(result.isValid).toBe(true);
  });

  test('should process order successfully', async () => {
    await plugin.initialize({
      apiEndpoint: 'https://api.vpnservice.com',
      apiKey: 'test-key',
      serverRegions: ['us-east']
    });

    const context = {
      orderId: 'test-order',
      userId: 'test-user',
      productId: 'vpn-monthly',
      productMetadata: { duration: 30, region: 'us-east' },
      orderMetadata: {},
      config: {}
    };

    const result = await plugin.processOrder(context);
    expect(result.success).toBe(true);
    expect(result.deliveryData).toBeDefined();
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
