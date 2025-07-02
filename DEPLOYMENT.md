# MTYB Shop 部署指南

## 概述

本文档详细介绍了MTYB Shop的部署流程，包括开发、测试、预发布和生产环境的配置。

## 环境要求

### 最低要求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本
- 现代浏览器支持ES2020+

### 推荐要求

- Node.js 20.x LTS
- npm 10.x
- Docker 24.x（用于容器化部署）
- Nginx 1.24+（用于生产环境）

## 环境配置

### 1. 环境变量设置

复制环境变量模板：

```bash
cp .env.example .env.local
```

#### 必需的环境变量

**支付配置**

- `VITE_CURLEC_PUBLIC_KEY`: Curlec支付网关公钥
- `VITE_CURLEC_WEBHOOK_SECRET`: Webhook验证密钥

**安全配置**

- `VITE_ENCRYPTION_KEY`: 32字符加密密钥
- `VITE_JWT_SECRET`: JWT签名密钥

**Telegram配置**

- `VITE_TELEGRAM_BOT_TOKEN`: Telegram机器人令牌

#### 环境特定配置

**开发环境** (`.env.local`)

```bash
VITE_APP_ENVIRONMENT=development
VITE_ENABLE_MOCK_PAYMENTS=true
VITE_ENABLE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

**生产环境** (`.env.production`)

```bash
VITE_APP_ENVIRONMENT=production
VITE_ENABLE_MOCK_PAYMENTS=false
VITE_ENABLE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
```

## 部署方式

### 方式1: 传统部署

#### 1. 准备环境

```bash
# 安装依赖
npm ci

# 运行质量检查
npm run lint
npm run typecheck
```

#### 2. 构建应用

```bash
# 开发构建
npm run build

# 生产构建
npm run build -- --mode production
```

#### 3. 使用部署脚本

```bash
# 部署到测试环境
./scripts/deploy.sh staging

# 部署到生产环境
./scripts/deploy.sh production
```

### 方式2: Docker部署

#### 1. 构建镜像

```bash
# 构建生产镜像
docker build -t mtyb-shop:latest .

# 或使用docker-compose
docker-compose build
```

#### 2. 运行容器

```bash
# 单容器运行
docker run -d \
  --name mtyb-shop \
  -p 80:80 \
  --env-file .env.production \
  mtyb-shop:latest

# 使用docker-compose
docker-compose up -d
```

#### 3. 健康检查

```bash
# 检查容器状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

### 方式3: 静态托管

#### GitHub Pages

```bash
# 配置GitHub Pages部署
npm run deploy
```

#### Vercel

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署到Vercel
vercel --prod
```

## 生产环境配置

### 1. Web服务器配置

#### Nginx配置要点

- 启用Gzip压缩
- 设置适当的缓存策略
- 配置安全头部
- 支持客户端路由

#### Apache配置

```apache
<VirtualHost *:80>
    DocumentRoot /var/www/mtyb-shop

    # 启用压缩
    LoadModule deflate_module modules/mod_deflate.so
    SetOutputFilter DEFLATE

    # 缓存静态资源
    <FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </FilesMatch>

    # 客户端路由支持
    RewriteEngine On
    RewriteRule ^(?!.*\.).*$ /index.html [L]
</VirtualHost>
```

### 2. SSL/TLS配置

#### Let's Encrypt证书

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. 监控配置

#### 健康检查端点

- `/health` - 基本健康状态
- `/api/health` - API健康状态
- `/metrics` - Prometheus指标

#### 日志配置

```nginx
# Nginx访问日志
log_format json_combined escape=json
'{'
  '"time_local":"$time_local",'
  '"remote_addr":"$remote_addr",'
  '"request":"$request",'
  '"status": "$status",'
  '"body_bytes_sent":"$body_bytes_sent",'
  '"request_time":"$request_time",'
  '"http_referrer":"$http_referer",'
  '"http_user_agent":"$http_user_agent"'
'}';

access_log /var/log/nginx/mtyb-shop.log json_combined;
```

## 安全最佳实践

### 1. 环境变量安全

- 使用强密码和密钥
- 定期轮换密钥
- 不要在代码中硬编码密钥
- 使用密钥管理服务

### 2. Web安全

- 启用HTTPS
- 配置安全头部
- 实施CSP策略
- 定期更新依赖

### 3. 监控和警报

- 设置错误监控（Sentry）
- 配置性能监控
- 设置关键指标警报
- 定期安全扫描

## 性能优化

### 1. 构建优化

- 启用代码分割
- 使用懒加载
- 优化资源大小
- 启用压缩

### 2. 缓存策略

- 静态资源长期缓存
- HTML文件禁用缓存
- API响应适当缓存
- 使用CDN加速

### 3. 监控指标

- 首屏加载时间（FCP）
- 最大内容绘制（LCP）
- 累积布局偏移（CLS）
- 首次输入延迟（FID）

## 故障排除

### 常见问题

#### 1. 环境变量未生效

```bash
# 检查环境变量
npm run dev -- --debug

# 验证构建变量
grep "VITE_" dist/assets/*.js
```

#### 2. 支付网关连接失败

- 检查API密钥配置
- 验证网络连接
- 查看错误日志

#### 3. Telegram WebApp问题

- 验证bot token
- 检查webhook配置
- 确认域名白名单

### 日志分析

```bash
# 查看应用日志
docker-compose logs -f app

# 查看nginx日志
tail -f /var/log/nginx/access.log

# 查看错误日志
tail -f /var/log/nginx/error.log
```

## 回滚程序

### 快速回滚

```bash
# 停止当前版本
docker-compose down

# 恢复备份
tar -xzf backups/backup_YYYYMMDD_HHMMSS.tar.gz

# 重新部署
docker-compose up -d
```

### 版本管理

- 使用Git标签标记发布版本
- 保留最近3个版本的备份
- 维护发布changelog

## 维护计划

### 定期维护

- **每日**: 监控日志和指标
- **每周**: 检查安全更新
- **每月**: 备份验证和清理
- **每季度**: 安全审计和性能优化

### 更新流程

1. 在测试环境验证更新
2. 创建生产环境备份
3. 执行更新部署
4. 验证功能正常
5. 监控关键指标

## 联系和支持

### 紧急联系

- 开发团队: dev@mtyb-shop.com
- 运维团队: ops@mtyb-shop.com

### 文档和资源

- API文档: `/docs/api`
- 监控面板: `/monitoring`
- 状态页面: `/status`
