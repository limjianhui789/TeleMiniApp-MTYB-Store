# MTYB Virtual Goods Platform - Architecture Design

## 项目概述

MTYB Virtual Goods Platform 是一个基于 Telegram Mini App 的虚拟商品购买平台，采用插件化架构设计，支持多种类型的虚拟商品销售和自动化交付。

## 核心特性

- 🔌 **插件化架构** - 支持不同类型产品的独立插件开发
- 💳 **Curlec 支付集成** - 集成 Curlec 支付网关
- 🤖 **自动化交付** - 支付完成后自动处理订单交付
- 📱 **Telegram 原生体验** - 完全集成 Telegram Mini App 功能
- 🔐 **安全可靠** - 完整的订单管理和支付验证系统

## 系统架构

### 1. 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Telegram Mini App                        │
├─────────────────────────────────────────────────────────────┤
│                     Frontend Layer                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Product   │ │   Order     │ │   Payment   │           │
│  │   Pages     │ │   Pages     │ │   Pages     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│                      Core System                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Product   │ │   Order     │ │   Payment   │           │
│  │  Manager    │ │  Manager    │ │  Gateway    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                         │                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Plugin Manager                             │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Plugin Layer                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │     VPN     │ │   Netflix   │ │    Steam    │           │
│  │   Plugin    │ │   Plugin    │ │   Plugin    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│                   External Services                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Curlec    │ │   Target    │ │   KeyAuth   │           │
│  │  Payment    │ │   Servers   │ │   System    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 2. 核心组件

#### 2.1 Frontend Layer (前端层)
- **Product Pages**: 产品展示、分类、搜索
- **Order Pages**: 订单管理、历史记录、状态跟踪
- **Payment Pages**: 支付流程、支付状态、收据

#### 2.2 Core System (核心系统)
- **Product Manager**: 产品管理、库存控制、价格管理
- **Order Manager**: 订单创建、状态管理、交付协调
- **Payment Gateway**: Curlec 支付集成、支付验证、退款处理
- **Plugin Manager**: 插件注册、生命周期管理、通信协调

#### 2.3 Plugin Layer (插件层)
- **Base Plugin Interface**: 统一的插件接口规范
- **Product-Specific Plugins**: 各类产品的专用插件
- **Plugin Registry**: 插件注册和发现机制

## 插件系统设计

### 1. 插件接口规范

```typescript
interface BasePlugin {
  // 插件配置
  config: PluginConfig;
  
  // 生命周期方法
  initialize(config: Record<string, any>): Promise<void>;
  validateConfig(config: Record<string, any>): Promise<ValidationResult>;
  
  // 核心功能
  processOrder(context: PluginContext): Promise<DeliveryResult>;
  validateProduct(productData: Record<string, any>): Promise<ValidationResult>;
  
  // 可选钩子
  onOrderCreated?(context: PluginContext): Promise<void>;
  onPaymentCompleted?(context: PluginContext): Promise<void>;
  onOrderCancelled?(context: PluginContext): Promise<void>;
  
  // 健康检查
  healthCheck?(): Promise<boolean>;
}
```

### 2. 插件类型示例

#### VPN Plugin
- **功能**: 连接到 VPN 服务器 API 创建用户账户
- **配置**: API 端点、认证密钥、服务器列表
- **交付**: 用户名、密码、服务器配置文件

#### Netflix Plugin  
- **功能**: 通过邮件系统获取账户信息
- **配置**: 邮件服务器、账户池管理
- **交付**: 账户邮箱、密码、使用说明

#### Steam Plugin
- **功能**: 集成 KeyAuth 系统获取游戏密钥
- **配置**: KeyAuth API、产品映射
- **交付**: 游戏激活码、安装说明

### 3. 插件开发规范

```typescript
// 插件开发模板
export class CustomPlugin extends BasePlugin {
  config = {
    id: 'custom-plugin',
    name: 'Custom Product Plugin',
    version: '1.0.0',
    category: ProductCategory.OTHER,
    // ... 其他配置
  };

  async initialize(config: Record<string, any>) {
    // 初始化逻辑
  }

  async processOrder(context: PluginContext): Promise<DeliveryResult> {
    // 订单处理逻辑
    return {
      success: true,
      deliveryData: {
        // 交付数据
      }
    };
  }

  // ... 其他必需方法
}
```

## 数据模型设计

### 1. 核心实体

```typescript
// 用户模型
interface User {
  id: string;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 产品模型
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: ProductCategory;
  pluginId: string;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// 订单模型
interface Order {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentId?: string;
  deliveryData?: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. 状态管理

```typescript
enum OrderStatus {
  PENDING = 'pending',           // 待支付
  PROCESSING = 'processing',     // 处理中
  COMPLETED = 'completed',       // 已完成
  FAILED = 'failed',            // 失败
  REFUNDED = 'refunded'         // 已退款
}

enum ProductCategory {
  VPN = 'vpn',
  STREAMING = 'streaming',
  GAMING = 'gaming',
  SOFTWARE = 'software',
  OTHER = 'other'
}
```

## 支付流程设计

### 1. 支付流程图

```
用户选择产品 → 创建订单 → 发起支付 → Curlec处理 → 支付回调 → 插件处理 → 交付完成
     │              │           │           │           │           │           │
     ▼              ▼           ▼           ▼           ▼           ▼           ▼
  产品验证      订单创建    支付页面    支付验证    状态更新    自动交付    用户通知
```

### 2. Curlec 集成要点

- **支付创建**: 调用 Curlec API 创建支付请求
- **回调处理**: 处理支付成功/失败的 Webhook 回调
- **签名验证**: 验证 Webhook 签名确保安全性
- **状态同步**: 实时同步支付状态到订单系统
- **退款处理**: 支持订单退款和部分退款

## 安全考虑

### 1. 数据安全
- 敏感配置信息加密存储
- API 密钥安全管理
- 用户数据隐私保护

### 2. 支付安全
- Webhook 签名验证
- 支付状态双重验证
- 防重复支付机制

### 3. 插件安全
- 插件沙箱执行环境
- 配置验证和清理
- 错误处理和日志记录

## 技术栈

### Frontend
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全
- **Telegram UI** - 原生 Telegram 组件
- **React Router** - 路由管理
- **Vite** - 构建工具

### Core System
- **Plugin Architecture** - 插件化架构
- **State Management** - 状态管理
- **API Integration** - 外部服务集成

### External Services
- **Curlec Payment Gateway** - 支付处理
- **Telegram Bot API** - 消息通知
- **Various Product APIs** - 产品特定服务

## 部署架构

### 1. 开发环境
- 本地开发服务器 (Vite)
- Mock 支付网关
- 插件热重载

### 2. 生产环境
- GitHub Pages 静态托管
- CDN 加速
- 环境变量管理
- 监控和日志

## 扩展性设计

### 1. 水平扩展
- 插件独立开发和部署
- 微服务架构支持
- API 版本管理

### 2. 功能扩展
- 新产品类型快速接入
- 多支付网关支持
- 多语言国际化

### 3. 性能优化
- 组件懒加载
- 数据缓存策略
- 批量操作支持
