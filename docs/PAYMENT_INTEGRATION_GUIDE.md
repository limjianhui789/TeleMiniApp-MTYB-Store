# 支付系统集成指南

## 概述

MTYB 平台的支付系统基于 Curlec 支付网关构建，提供完整的支付处理、订单管理和安全机制。

## 核心组件

### 1. Curlec 支付网关 (`CurlecGateway`)

负责与 Curlec API 直接通信，处理支付请求和响应。

```typescript
import { curlecGateway } from '@/services/payment';

// 创建支付
const response = await curlecGateway.createPayment({
  orderId: 'ord_123',
  amount: 100.0,
  currency: 'MYR',
  method: PaymentMethod.CURLEC,
});

// 查询支付状态
const status = await curlecGateway.getPaymentStatus('pay_456');
```

### 2. 支付服务 (`PaymentService`)

高级支付管理服务，提供支付生命周期管理。

```typescript
import { paymentService } from '@/services/payment';

// 创建支付
const paymentResponse = await paymentService.createPayment({
  orderId: 'ord_123',
  amount: 100.0,
  currency: 'MYR',
  method: PaymentMethod.CURLEC,
});

// 获取支付信息
const payment = await paymentService.getPayment('pay_456');

// 退款
const refunded = await paymentService.refundPayment('pay_456');
```

### 3. Webhook 处理器 (`WebhookHandler`)

处理来自 Curlec 的 webhook 通知，确保支付状态同步。

```typescript
import { webhookHandler } from '@/services/payment';

// 处理 Curlec webhook
const result = await webhookHandler.handleCurlecWebhook(payload, signature);

if (result.success) {
  console.log('Webhook processed successfully');
}
```

### 4. 支付状态同步服务 (`PaymentSyncService`)

定期同步支付状态，确保数据一致性。

```typescript
import { paymentSyncService } from '@/services/payment';

// 启动自动同步
paymentSyncService.start();

// 手动同步单个支付
const syncResult = await paymentSyncService.syncPayment('pay_456');

// 批量同步所有待处理支付
const results = await paymentSyncService.performSync();
```

### 5. 支付安全服务 (`PaymentSecurityService`)

提供支付安全验证和审计功能。

```typescript
import { paymentSecurityService } from '@/services/payment';

// 验证支付请求
const validation = paymentSecurityService.validatePaymentRequest(
  paymentRequest,
  { userId: 'user_123', ipAddress: '192.168.1.1' }
);

if (!validation.isValid) {
  console.error('Payment validation failed:', validation.errors);
}

// 验证 webhook 签名
const isValid = paymentSecurityService.verifyWebhookSignature(
  payload,
  signature,
  secret
);
```

### 6. 订单服务 (`OrderService`)

管理订单生命周期，与支付系统紧密集成。

```typescript
import { orderService } from '@/services/order';

// 创建订单
const order = await orderService.createOrder({
  userId: 'user_123',
  items: [
    {
      productId: 'prod_456',
      quantity: 1,
    },
  ],
  paymentMethod: PaymentMethod.CURLEC,
});

// 发起支付
const paymentResult = await orderService.initiatePayment(order.id);

if (paymentResult.success) {
  // 重定向到支付页面
  window.location.href = paymentResult.redirectUrl;
}
```

## 使用流程

### 完整的支付流程

```typescript
import {
  orderService,
  paymentService,
  paymentSyncService,
  paymentSecurityService,
} from '@/services';

async function processPayment(userId: string, cartItems: any[]) {
  try {
    // 1. 安全验证
    const userContext = {
      userId,
      ipAddress: getUserIP(),
      userAgent: navigator.userAgent,
    };

    // 2. 创建订单
    const order = await orderService.createOrder({
      userId,
      items: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      paymentMethod: PaymentMethod.CURLEC,
    });

    // 3. 安全验证支付请求
    const paymentRequest = {
      orderId: order.id,
      amount: order.totalAmount,
      currency: order.currency,
      method: order.paymentMethod,
    };

    const validation = paymentSecurityService.validatePaymentRequest(
      paymentRequest,
      userContext
    );

    if (!validation.isValid) {
      throw new Error(
        `Payment validation failed: ${validation.errors.join(', ')}`
      );
    }

    // 4. 发起支付
    const paymentResult = await orderService.initiatePayment(order.id);

    if (!paymentResult.success) {
      throw new Error(paymentResult.error);
    }

    // 5. 记录审计日志
    paymentSecurityService.logPaymentEvent(
      'payment_created',
      await paymentService.getPaymentByOrderId(order.id),
      userContext
    );

    // 6. 重定向到支付页面
    return {
      success: true,
      orderId: order.id,
      redirectUrl: paymentResult.redirectUrl,
    };
  } catch (error) {
    console.error('Payment processing failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### Webhook 处理设置

```typescript
// 在你的 Express.js 或类似后端设置中
app.post('/webhooks/curlec', async (req, res) => {
  try {
    const signature = req.headers['x-curlec-signature'];
    const payload = JSON.stringify(req.body);

    const result = await webhookHandler.handleCurlecWebhook(payload, signature);

    if (result.success) {
      res.status(200).json({ received: true });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
```

## 事件监听

支付系统会触发各种事件，你可以监听这些事件来执行相应的业务逻辑：

```typescript
import { eventBus, PAYMENT_EVENTS } from '@/core';

// 监听支付完成事件
eventBus.on(PAYMENT_EVENTS.PAYMENT_COMPLETED, async data => {
  const { payment } = data;
  console.log(`Payment completed: ${payment.id}`);

  // 执行订单交付逻辑
  await deliverOrder(payment.orderId);
});

// 监听支付失败事件
eventBus.on(PAYMENT_EVENTS.PAYMENT_FAILED, async data => {
  const { payment } = data;
  console.log(`Payment failed: ${payment.id}`);

  // 发送失败通知
  await notifyPaymentFailure(payment);
});

// 监听 webhook 处理事件
eventBus.on(PAYMENT_EVENTS.WEBHOOK_PROCESSED, async data => {
  const { payment, event, newStatus } = data;
  console.log(`Webhook processed for payment ${payment.id}: ${newStatus}`);
});
```

## 配置

### 环境变量

```env
# Curlec 配置
VITE_CURLEC_BASE_URL=https://api.curlec.com
VITE_CURLEC_PUBLIC_KEY=your_public_key
VITE_CURLEC_WEBHOOK_SECRET=your_webhook_secret

# 支付加密密钥
PAYMENT_ENCRYPTION_KEY=your_encryption_key
```

### 安全配置

```typescript
import { PaymentSecurityService } from '@/services/payment';

const securityService = new PaymentSecurityService({
  maxPaymentAmount: 10000, // 单笔支付最大金额
  maxDailyAmount: 50000, // 每日支付限额
  maxPaymentsPerHour: 10, // 每小时支付限制
  enableRateLimit: true, // 启用频率限制
  enableAmountValidation: true, // 启用金额验证
  enableDuplicateProtection: true, // 启用重复支付保护
  duplicateWindowMs: 5 * 60 * 1000, // 重复支付检测窗口
});
```

### 同步服务配置

```typescript
import { PaymentSyncService } from '@/services/payment';

const syncService = new PaymentSyncService({
  intervalMs: 30000, // 同步间隔 (30秒)
  maxRetries: 3, // 最大重试次数
  retryDelayMs: 5000, // 重试延迟
  staleThresholdMs: 5 * 60 * 1000, // 过期阈值 (5分钟)
});

// 启动自动同步
syncService.start();
```

## 最佳实践

### 1. 错误处理

```typescript
try {
  const payment = await paymentService.createPayment(request);
} catch (error) {
  if (error.code === 'PAYMENT_VALIDATION_ERROR') {
    // 处理验证错误
  } else if (error.code === 'PAYMENT_GATEWAY_ERROR') {
    // 处理网关错误
  } else {
    // 处理其他错误
  }
}
```

### 2. 状态管理

```typescript
// 始终检查支付状态
const payment = await paymentService.getPayment(paymentId);
if (payment.status === PaymentStatus.COMPLETED) {
  // 执行成功逻辑
} else if (payment.status === PaymentStatus.FAILED) {
  // 执行失败逻辑
}
```

### 3. 安全考虑

- 始终验证 webhook 签名
- 使用 HTTPS 进行所有通信
- 定期轮换 API 密钥
- 监控异常支付活动
- 实施适当的频率限制

### 4. 性能优化

- 使用连接池进行数据库操作
- 缓存常用的支付状态查询
- 批量处理 webhook 事件
- 异步处理非关键操作

## 故障排除

### 常见问题

1. **支付创建失败**

   - 检查 Curlec API 密钥配置
   - 验证支付金额和货币
   - 确认网络连接

2. **Webhook 处理失败**

   - 验证 webhook 签名密钥
   - 检查 webhook URL 配置
   - 确认防火墙设置

3. **支付状态不同步**
   - 启动支付同步服务
   - 检查 API 连接状态
   - 验证支付 ID 正确性

### 调试模式

```typescript
// 启用调试日志
console.log('Payment Service Debug Info:');
console.log('Enabled methods:', paymentService.getEnabledPaymentMethods());
console.log('Security stats:', paymentSecurityService.getSecurityStats());
console.log('Sync stats:', paymentSyncService.getStats());
```

## 总结

MTYB 支付系统提供了完整的支付处理解决方案，包括：

- ✅ Curlec 支付网关集成
- ✅ 完整的订单管理系统
- ✅ Webhook 回调处理
- ✅ 支付状态同步机制
- ✅ 强大的安全机制
- ✅ 审计日志记录

系统设计注重安全性、可靠性和可扩展性，为虚拟商品销售提供了坚实的支付基础。
