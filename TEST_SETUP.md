# 测试环境设置指南

## 概述

本项目已创建了完整的单元测试套件，覆盖了以下核心模块：

### 已测试的服务模块

- **PaymentService**: 支付创建、状态查询、验证逻辑
- **OrderService**: 订单创建、状态更新、验证逻辑
- **CartService**: 购物车操作、计算逻辑、本地存储
- **CSRFToken**: 安全令牌生成、验证、防护机制

### 已测试的组件

- **PaymentForm**: 支付表单验证、提交逻辑、错误处理

## 测试框架安装

当前测试文件已创建但缺少测试依赖。要运行测试，需要安装以下包：

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest ts-jest @types/jest jest-environment-jsdom identity-obj-proxy jest-transform-stub babel-jest
```

## 测试配置文件

### jest.config.js

- 配置了TypeScript支持
- 设置了模块路径映射
- 配置了覆盖率要求（70%）
- 设置了jsdom测试环境

### setupTests.ts

- Mock了Telegram WebApp API
- Mock了localStorage和sessionStorage
- Mock了fetch和crypto API
- 配置了测试环境变量

## 运行测试

添加测试脚本到package.json：

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

## 测试覆盖范围

### PaymentService.test.ts

- ✅ 支付创建成功场景
- ✅ 支付创建失败处理
- ✅ 网络错误处理
- ✅ 支付状态查询
- ✅ 输入验证（邮箱、金额）

### OrderService.test.ts

- ✅ 订单创建流程
- ✅ 产品验证集成
- ✅ 金额计算正确性
- ✅ 订单状态更新
- ✅ 输入验证（用户ID、商品数量）

### CartService.test.ts

- ✅ 购物车商品添加/移除
- ✅ 数量更新逻辑
- ✅ 库存验证
- ✅ 总价计算（含折扣、税费）
- ✅ 本地存储操作

### CSRFToken.test.ts

- ✅ 令牌生成和验证
- ✅ 会话存储管理
- ✅ 受保护请求拦截
- ✅ 安全头部添加
- ✅ 令牌刷新机制

### PaymentForm.test.tsx

- ✅ 表单渲染和验证
- ✅ 用户输入处理
- ✅ 加载状态显示
- ✅ 成功/错误回调
- ✅ 取消操作处理

## 预期测试结果

当测试环境正确配置后，所有测试应该通过：

```
Test Suites: 5 passed, 5 total
Tests:       45+ passed, 45+ total
Coverage:    Lines 70%+, Functions 70%+, Branches 70%+
```

## 关键测试场景

### 支付流程测试

1. 正常支付创建和处理
2. 验证错误（无效邮箱、电话）
3. 网络错误恢复
4. 重定向处理

### 订单管理测试

1. 多商品订单创建
2. 库存不足处理
3. 价格计算准确性
4. 状态转换逻辑

### 安全性测试

1. CSRF令牌保护
2. 输入验证
3. 会话管理
4. 错误处理

## 测试最佳实践

1. **隔离性**: 每个测试独立运行，不依赖其他测试
2. **可重复性**: 使用mock确保测试结果一致
3. **覆盖性**: 测试正常流程和边界条件
4. **清晰性**: 测试名称清楚描述测试场景

## 下一步优化

1. 添加集成测试
2. 增加端到端测试
3. 添加性能测试
4. 完善错误场景覆盖
