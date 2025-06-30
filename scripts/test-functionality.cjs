#!/usr/bin/env node

// ============================================================================
// MTYB Shop - Functionality Test Script
// ============================================================================

const fs = require('fs');
const path = require('path');

console.log('🧪 MTYB Shop Functionality Test\n');

// Test configurations
const tests = {
  buildOutput: {
    name: 'Build Output Verification',
    test: () => {
      const distPath = path.join(__dirname, '../dist');
      const indexPath = path.join(distPath, 'index.html');
      
      if (!fs.existsSync(distPath)) {
        return { success: false, message: 'Build directory does not exist' };
      }
      
      if (!fs.existsSync(indexPath)) {
        return { success: false, message: 'index.html not found' };
      }
      
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // Check for critical assets
      const checks = [
        { name: 'CSS bundle', pattern: /\.css/ },
        { name: 'JS bundle', pattern: /\.js/ },
        { name: 'Vite manifest', pattern: /type="module"/ }
      ];
      
      for (const check of checks) {
        if (!check.pattern.test(indexContent)) {
          return { success: false, message: `${check.name} not found in index.html` };
        }
      }
      
      return { success: true, message: 'Build output verified' };
    }
  },

  environmentConfig: {
    name: 'Environment Configuration',
    test: () => {
      const envExample = path.join(__dirname, '../.env.example');
      const envProd = path.join(__dirname, '../.env.production');
      
      if (!fs.existsSync(envExample)) {
        return { success: false, message: '.env.example not found' };
      }
      
      if (!fs.existsSync(envProd)) {
        return { success: false, message: '.env.production not found' };
      }
      
      const envContent = fs.readFileSync(envExample, 'utf8');
      const requiredVars = [
        'VITE_CURLEC_PUBLIC_KEY',
        'VITE_ENCRYPTION_KEY',
        'VITE_JWT_SECRET'
      ];
      
      for (const varName of requiredVars) {
        if (!envContent.includes(varName)) {
          return { success: false, message: `${varName} not found in .env.example` };
        }
      }
      
      return { success: true, message: 'Environment configuration verified' };
    }
  },

  paymentComponents: {
    name: 'Payment Components',
    test: () => {
      const paymentForm = path.join(__dirname, '../src/components/payment/PaymentForm.tsx');
      const paymentStatus = path.join(__dirname, '../src/components/payment/PaymentStatus.tsx');
      const paymentService = path.join(__dirname, '../src/services/payment/PaymentService.ts');
      
      const files = [
        { path: paymentForm, name: 'PaymentForm component' },
        { path: paymentStatus, name: 'PaymentStatus component' },
        { path: paymentService, name: 'PaymentService' }
      ];
      
      for (const file of files) {
        if (!fs.existsSync(file.path)) {
          return { success: false, message: `${file.name} not found` };
        }
        
        const content = fs.readFileSync(file.path, 'utf8');
        if (content.length < 100) {
          return { success: false, message: `${file.name} appears to be empty or too small` };
        }
      }
      
      return { success: true, message: 'Payment components verified' };
    }
  },

  orderSystem: {
    name: 'Order System',
    test: () => {
      const orderService = path.join(__dirname, '../src/services/order/OrderService.ts');
      const orderPage = path.join(__dirname, '../src/pages/OrderDetailPage.tsx');
      
      if (!fs.existsSync(orderService)) {
        return { success: false, message: 'OrderService not found' };
      }
      
      if (!fs.existsSync(orderPage)) {
        return { success: false, message: 'OrderDetailPage not found' };
      }
      
      const serviceContent = fs.readFileSync(orderService, 'utf8');
      
      // Check for key methods
      const methods = ['createOrder', 'getOrder', 'updateOrderStatus'];
      for (const method of methods) {
        if (!serviceContent.includes(method)) {
          return { success: false, message: `${method} method not found in OrderService` };
        }
      }
      
      return { success: true, message: 'Order system verified' };
    }
  },

  routes: {
    name: 'Routing Configuration',
    test: () => {
      const routesFile = path.join(__dirname, '../src/navigation/routes.tsx');
      
      if (!fs.existsSync(routesFile)) {
        return { success: false, message: 'routes.tsx not found' };
      }
      
      const content = fs.readFileSync(routesFile, 'utf8');
      
      // Check for critical routes
      const routes = [
        '/cart',
        '/payment/success',
        '/payment/cancel',
        '/orders/:orderId'
      ];
      
      for (const route of routes) {
        if (!content.includes(route)) {
          return { success: false, message: `Route ${route} not found` };
        }
      }
      
      return { success: true, message: 'Routing configuration verified' };
    }
  },

  security: {
    name: 'Security Configuration',
    test: () => {
      const csrfFile = path.join(__dirname, '../src/security/CSRFToken.ts');
      
      if (!fs.existsSync(csrfFile)) {
        return { success: false, message: 'CSRFToken.ts not found' };
      }
      
      const content = fs.readFileSync(csrfFile, 'utf8');
      
      // Check for security methods
      const methods = ['generate', 'validate', 'createProtectedFetch'];
      for (const method of methods) {
        if (!content.includes(method)) {
          return { success: false, message: `${method} method not found in CSRFToken` };
        }
      }
      
      return { success: true, message: 'Security configuration verified' };
    }
  },

  testFramework: {
    name: 'Test Framework Setup',
    test: () => {
      const testDir = path.join(__dirname, '../src/services/__tests__');
      const jestConfig = path.join(__dirname, '../jest.config.js');
      const setupTests = path.join(__dirname, '../src/setupTests.ts');
      
      if (!fs.existsSync(testDir)) {
        return { success: false, message: 'Test directory not found' };
      }
      
      if (!fs.existsSync(jestConfig)) {
        return { success: false, message: 'Jest configuration not found' };
      }
      
      if (!fs.existsSync(setupTests)) {
        return { success: false, message: 'Test setup file not found' };
      }
      
      // Count test files
      const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.test.ts'));
      if (testFiles.length < 3) {
        return { success: false, message: `Only ${testFiles.length} test files found, expected at least 3` };
      }
      
      return { success: true, message: `Test framework verified (${testFiles.length} test files)` };
    }
  },

  deployment: {
    name: 'Deployment Configuration',
    test: () => {
      const deployScript = path.join(__dirname, '../scripts/deploy.sh');
      const dockerfile = path.join(__dirname, '../Dockerfile');
      const dockerCompose = path.join(__dirname, '../docker-compose.yml');
      const deploymentDoc = path.join(__dirname, '../DEPLOYMENT.md');
      
      const files = [
        { path: deployScript, name: 'Deploy script' },
        { path: dockerfile, name: 'Dockerfile' },
        { path: dockerCompose, name: 'Docker Compose' },
        { path: deploymentDoc, name: 'Deployment documentation' }
      ];
      
      for (const file of files) {
        if (!fs.existsSync(file.path)) {
          return { success: false, message: `${file.name} not found` };
        }
      }
      
      return { success: true, message: 'Deployment configuration verified' };
    }
  },

  performance: {
    name: 'Performance Optimizations',
    test: () => {
      const routesFile = path.join(__dirname, '../src/navigation/routes.tsx');
      const preloaderFile = path.join(__dirname, '../src/utils/resourcePreloader.ts');
      
      if (!fs.existsSync(routesFile)) {
        return { success: false, message: 'Routes file not found' };
      }
      
      if (!fs.existsSync(preloaderFile)) {
        return { success: false, message: 'Resource preloader not found' };
      }
      
      const routesContent = fs.readFileSync(routesFile, 'utf8');
      
      // Check for lazy loading
      if (!routesContent.includes('lazy(')) {
        return { success: false, message: 'Lazy loading not implemented in routes' };
      }
      
      if (!routesContent.includes('Suspense')) {
        return { success: false, message: 'Suspense not implemented in routes' };
      }
      
      return { success: true, message: 'Performance optimizations verified' };
    }
  }
};

// Run all tests
let passed = 0;
let failed = 0;

console.log('Running functionality tests...\n');

for (const [key, test] of Object.entries(tests)) {
  process.stdout.write(`${test.name}... `);
  
  try {
    const result = test.test();
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
      passed++;
    } else {
      console.log(`❌ ${result.message}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    failed++;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All functionality tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the issues above.');
  process.exit(1);
}