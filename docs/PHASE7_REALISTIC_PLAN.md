# Phase 7 现实版实战计划 - 让系统真正可用

> **现状**：架构优秀但实现不完整，当前不可部署  
> **目标**：3周内让系统真正可用并可部署  
> **核心原则**：修复 > 完善 > 优化

## 📊 当前系统评估

### 完成度总览

- 🟢 **插件系统**: 85% (架构完善，安全沙箱优秀)
- 🟢 **产品服务**: 90% (功能完整)
- 🟡 **用户界面**: 80% (缺少关键支付UI)
- 🔴 **支付系统**: 60% (架构完整但实现不完整)
- 🔴 **核心业务流程**: 75% (支付环节断链)

### 🚨 阻断性问题

1. **支付网关未实现** - `src/services/payment/CurlecGateway.ts` 空壳
2. **订单服务缺陷** - `src/services/order/OrderService.ts:304` 产品获取返回null
3. **安全漏洞** - `src/core/config/environment.ts:84-85` 生产默认密钥
4. **路由不完整** - 缺少关键业务流程路由

## 🎯 3周实战计划

### Week 1: 修复核心功能 (让系统能用)

#### Day 1-2: 支付系统修复

- [ ] **实现CurlecGateway.ts**
  - 文件: `src/services/payment/CurlecGateway.ts`
  - 添加实际的支付接口调用
  - 实现支付状态查询和回调处理
- [ ] **修复OrderService产品获取**
  - 文件: `src/services/order/OrderService.ts:304-307`
  - 实现`getProduct`方法，集成ProductService

#### Day 3-4: 安全漏洞修复

- [ ] **更换生产环境密钥**

  - 文件: `src/core/config/environment.ts:84-85`
  - 生成安全的加密密钥和JWT秘钥
  - 添加环境变量配置说明

- [ ] **添加CSRF保护**
  - 文件: `src/services/payment/PaymentService.ts`
  - 为支付接口添加CSRF令牌验证

#### Day 5: 支付UI组件

- [ ] **创建支付表单组件**
  - 新文件: `src/components/payment/PaymentForm.tsx`
  - 集成Curlec支付接口
  - 添加支付状态显示

### Week 2: 完善业务流程 (让系统稳定)

#### Day 1-2: 完整业务流程

- [ ] **补全结账到支付流程**

  - 文件: `src/components/checkout/EnhancedCheckoutFlow.tsx`
  - 集成支付表单组件
  - 添加订单确认和支付状态页面

- [ ] **修复路由配置**
  - 文件: `src/navigation/routes.tsx`
  - 添加支付、订单状态等关键路由

#### Day 3-4: 错误处理和用户体验

- [ ] **完善错误边界**

  - 文件: `src/components/common/ErrorBoundary.tsx`
  - 添加支付失败、网络错误等特定处理

- [ ] **添加加载状态**
  - 文件: `src/components/common/LoadingStates.tsx`
  - 为支付流程添加详细的加载提示

#### Day 5: 基础测试

- [ ] **核心服务单元测试**
  - 新文件: `src/services/payment/__tests__/PaymentService.test.ts`
  - 新文件: `src/services/order/__tests__/OrderService.test.ts`
  - 测试支付和订单的关键流程

### Week 3: 质量提升 (让系统更好)

#### Day 1-2: 代码清理

- [ ] **清理调试代码**

  - 全局搜索并替换console.log为Logger调用
  - 涉及18个文件的调试代码清理

- [ ] **完成TODO项目**
  - 处理24个文件中的未完成实现
  - 优先处理核心功能相关TODO

#### Day 3-4: 性能优化

- [ ] **关键页面性能优化**
  - 文件: `src/pages/ProductsPage/ProductsPage.tsx`
  - 文件: `src/components/cart/CartPage.tsx`
  - 添加懒加载和防抖搜索

#### Day 5: 部署准备

- [ ] **环境配置完善**
  - 文件: `src/core/config/environment.ts`
  - 创建生产环境配置模板
  - 添加健康检查接口

## 🔧 关键文件清单

### 必须修复的文件

```bash
# 支付系统核心
src/services/payment/CurlecGateway.ts          # 🚨 空实现
src/services/order/OrderService.ts:304        # 🚨 返回null
src/core/config/environment.ts:84-85          # 🚨 默认密钥

# 业务流程关键
src/components/checkout/EnhancedCheckoutFlow.tsx  # 需要集成支付
src/navigation/routes.tsx                         # 缺少关键路由

# 新建必需文件
src/components/payment/PaymentForm.tsx            # 支付UI组件
src/components/payment/PaymentStatus.tsx          # 支付状态页面
```

### 需要测试的文件

```bash
# 核心服务测试
src/services/payment/__tests__/
src/services/order/__tests__/
src/core/plugin/__tests__/
```

## 📋 每日执行清单

### 开始前检查

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 检查依赖
npm install

# 3. 运行类型检查
npm run typecheck

# 4. 运行代码检查
npm run lint
```

### 完成后验证

```bash
# 1. 运行构建
npm run build

# 2. 运行测试
npm test

# 3. 启动开发服务器验证
npm run dev
```

## 🎯 成功指标

### Week 1 目标

- [ ] 支付流程能够完整执行
- [ ] 安全漏洞全部修复
- [ ] 基本的支付UI可用

### Week 2 目标

- [ ] 完整的购买流程可用
- [ ] 错误处理完善
- [ ] 核心功能有测试覆盖

### Week 3 目标

- [ ] 代码质量达到生产标准
- [ ] 性能指标合格
- [ ] 可以部署到生产环境

## 🚀 快速启动命令

```bash
# 查看当前问题文件
grep -r "TODO\|FIXME\|console\.log" src/ --include="*.ts" --include="*.tsx"

# 检查安全配置
grep -r "default-key\|default-secret" src/

# 运行完整检查
npm run check
```

## 📞 遇到问题时

1. **支付问题** → 检查 `src/services/payment/` 目录
2. **订单问题** → 检查 `src/services/order/OrderService.ts:304`
3. **安全问题** → 检查 `src/core/config/environment.ts`
4. **路由问题** → 检查 `src/navigation/routes.tsx`

---

**记住**: 这不是理想的开发计划，这是现实的修复计划。每天专注1-2个关键问题，确保每天都有可见的进展。

_最后更新: 2025-06-21_
