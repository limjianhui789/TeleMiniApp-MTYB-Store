// ============================================================================
// MTYB Virtual Goods Platform - Plugin System Demo
// ============================================================================

import { pluginManager } from './PluginManager';
import { demoPlugin } from './plugins/DemoPlugin';
import { mockDataGenerator } from './PluginDevTools';
import { Logger } from '../utils/Logger';

// ============================================================================
// Plugin System Demo
// ============================================================================

async function runPluginSystemDemo() {
  const logger = new Logger('PluginDemo');

  try {
    logger.info('🚀 Starting Plugin System Demo...');

    // 1. Initialize Plugin Manager
    logger.info('📋 Initializing Plugin Manager...');
    await pluginManager.initialize();

    // 2. Register Demo Plugin
    logger.info('🔌 Registering Demo Plugin...');
    await pluginManager.registerPlugin(demoPlugin);

    // 3. Enable Demo Plugin
    logger.info('✅ Enabling Demo Plugin...');
    await pluginManager.enablePlugin('demo-plugin');

    // 4. Check Plugin Status
    logger.info('🔍 Checking Plugin Status...');
    const stats = pluginManager.getManagerStats();
    logger.info('Plugin Manager Stats:', stats);

    // 5. Create Test Context
    logger.info('📝 Creating Test Context...');
    const testContext = mockDataGenerator.createMockContext({
      product: {
        id: 'demo-product-001',
        name: 'Demo Digital Product',
        pluginId: 'demo-plugin',
      },
    });

    // 6. Execute Plugin
    logger.info('⚡ Executing Plugin...');
    const result = await pluginManager.executePlugin('demo-plugin', testContext);
    logger.info('Execution Result:', result);

    // 7. Check Plugin Health
    logger.info('🏥 Checking Plugin Health...');
    const healthStatus = await pluginManager.checkPluginHealth('demo-plugin');
    logger.info('Health Status:', healthStatus);

    // 8. Check All Plugins Health
    logger.info('🏥 Checking All Plugins Health...');
    const allHealthStatus = await pluginManager.checkAllPluginsHealth();
    logger.info('All Health Status:', allHealthStatus);

    logger.info('✨ Plugin System Demo Completed Successfully!');
  } catch (error) {
    logger.error('❌ Plugin System Demo Failed:', error as Error);
  } finally {
    // Cleanup
    try {
      await pluginManager.shutdown();
      logger.info('🧹 Plugin Manager shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown:', error as Error);
    }
  }
}

// ============================================================================
// Export Demo Function
// ============================================================================

export { runPluginSystemDemo };
