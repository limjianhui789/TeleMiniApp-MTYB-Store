// ============================================================================
// MTYB Virtual Goods Platform - Plugin Manager
// ============================================================================

import { BasePlugin, type IPluginManager } from '../../types/plugin';
import { type PluginContext, type DeliveryResult, type PluginHealthStatus } from '../../types';
import { Logger } from '../utils/Logger';
import { pluginRegistry } from './PluginRegistry';
import { pluginEventEmitter } from './PluginEventEmitter';
import { PLUGIN_CONFIG } from '../constants';

// ============================================================================
// Plugin Manager Implementation
// ============================================================================

export class PluginManager implements IPluginManager {
  private logger: Logger;
  private healthCheckInterval: number | null = null;
  private isInitialized = false;

  constructor() {
    this.logger = new Logger('PluginManager');
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('PluginManager is already initialized');
      return;
    }

    try {
      this.logger.info('Initializing Plugin Manager...');

      // Start health check interval
      this.startHealthCheckInterval();

      // Setup event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      this.logger.info('Plugin Manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Plugin Manager:', error as Error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    this.logger.info('Shutting down Plugin Manager...');

    // Stop health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Cleanup all plugins
    await pluginRegistry.cleanup();

    this.isInitialized = false;
    this.logger.info('Plugin Manager shutdown completed');
  }

  // ============================================================================
  // Plugin Registration
  // ============================================================================

  async registerPlugin(plugin: BasePlugin): Promise<void> {
    try {
      this.logger.info(`Registering plugin: ${plugin.config.id}`);

      // Register with default configuration
      await pluginRegistry.register(plugin, plugin.config.metadata || {});

      this.logger.info(`Plugin registered successfully: ${plugin.config.id}`);
    } catch (error) {
      this.logger.error(`Failed to register plugin ${plugin.config.id}:`, error as Error);
      throw error;
    }
  }

  async unregisterPlugin(pluginId: string): Promise<void> {
    try {
      this.logger.info(`Unregistering plugin: ${pluginId}`);
      await pluginRegistry.unregister(pluginId);
      this.logger.info(`Plugin unregistered successfully: ${pluginId}`);
    } catch (error) {
      this.logger.error(`Failed to unregister plugin ${pluginId}:`, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // Plugin Discovery
  // ============================================================================

  getPlugin(pluginId: string): BasePlugin | null {
    const entry = pluginRegistry.get(pluginId);
    return entry ? entry.plugin : null;
  }

  getAllPlugins(): BasePlugin[] {
    return pluginRegistry.getAll().map(entry => entry.plugin);
  }

  getActivePlugins(): BasePlugin[] {
    return pluginRegistry.getEnabled().map(entry => entry.plugin);
  }

  getPluginsByCategory(category: string): BasePlugin[] {
    return pluginRegistry.getByCategory(category).map(entry => entry.plugin);
  }

  // ============================================================================
  // Plugin Lifecycle Management
  // ============================================================================

  async enablePlugin(pluginId: string): Promise<void> {
    try {
      this.logger.info(`Enabling plugin: ${pluginId}`);
      await pluginRegistry.setEnabled(pluginId, true);
      this.logger.info(`Plugin enabled successfully: ${pluginId}`);
    } catch (error) {
      this.logger.error(`Failed to enable plugin ${pluginId}:`, error as Error);
      throw error;
    }
  }

  async disablePlugin(pluginId: string): Promise<void> {
    try {
      this.logger.info(`Disabling plugin: ${pluginId}`);
      await pluginRegistry.setEnabled(pluginId, false);
      this.logger.info(`Plugin disabled successfully: ${pluginId}`);
    } catch (error) {
      this.logger.error(`Failed to disable plugin ${pluginId}:`, error as Error);
      throw error;
    }
  }

  async reloadPlugin(pluginId: string): Promise<void> {
    try {
      this.logger.info(`Reloading plugin: ${pluginId}`);

      const entry = pluginRegistry.get(pluginId);
      if (!entry) {
        throw new Error(`Plugin '${pluginId}' is not registered`);
      }

      const wasEnabled = entry.isEnabled;

      // Disable if enabled
      if (wasEnabled) {
        await this.disablePlugin(pluginId);
      }

      // Re-enable if it was enabled
      if (wasEnabled) {
        await this.enablePlugin(pluginId);
      }

      pluginEventEmitter.emitSystemReload(pluginId);
      this.logger.info(`Plugin reloaded successfully: ${pluginId}`);
    } catch (error) {
      this.logger.error(`Failed to reload plugin ${pluginId}:`, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // Plugin Execution
  // ============================================================================

  async executePlugin(pluginId: string, context: PluginContext): Promise<DeliveryResult> {
    const entry = pluginRegistry.get(pluginId);
    if (!entry) {
      throw new Error(`Plugin '${pluginId}' is not registered`);
    }

    if (!entry.isEnabled) {
      throw new Error(`Plugin '${pluginId}' is not enabled`);
    }

    // Emit execution start event
    pluginEventEmitter.emitExecutionStart(pluginId, context);

    try {
      // Execute plugin with timeout
      const result = await this.executeWithTimeout(
        () => entry.plugin.processOrder(context),
        PLUGIN_CONFIG.PLUGIN_TIMEOUT
      );

      // Emit success event
      pluginEventEmitter.emitExecutionSuccess(pluginId, result);

      this.logger.debug(`Plugin execution successful: ${pluginId}`);
      return result;
    } catch (error) {
      // Emit error event
      pluginEventEmitter.emitExecutionError(pluginId, error as Error);

      this.logger.error(`Plugin execution failed: ${pluginId}`, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // Plugin Health Monitoring
  // ============================================================================

  async checkPluginHealth(pluginId: string): Promise<PluginHealthStatus> {
    const entry = pluginRegistry.get(pluginId);
    if (!entry) {
      throw new Error(`Plugin '${pluginId}' is not registered`);
    }

    try {
      let status: PluginHealthStatus;

      // Check if plugin has health check method
      if (entry.plugin.healthCheck) {
        status = await this.executeWithTimeout(
          () => entry.plugin.healthCheck!(),
          5000 // 5 second timeout for health checks
        );
      } else {
        // Default healthy status if no health check method
        status = {
          isHealthy: true,
          lastCheck: new Date(),
          responseTime: 0,
        };
      }

      // Update health status in registry
      await pluginRegistry.updateHealthStatus(pluginId, status);

      return status;
    } catch (error) {
      const errorStatus: PluginHealthStatus = {
        isHealthy: false,
        lastCheck: new Date(),
        error: (error as Error).message,
        responseTime: 0,
      };

      // Update health status in registry
      await pluginRegistry.updateHealthStatus(pluginId, errorStatus);

      return errorStatus;
    }
  }

  async checkAllPluginsHealth(): Promise<Record<string, PluginHealthStatus>> {
    this.logger.debug('Checking health of all plugins...');

    const results: Record<string, PluginHealthStatus> = {};
    const plugins = pluginRegistry.getAll();

    // Emit system health check event
    pluginEventEmitter.emitSystemHealthCheckAll();

    // Check health of all plugins in parallel
    const healthCheckPromises = plugins.map(async entry => {
      try {
        const status = await this.checkPluginHealth(entry.plugin.config.id);
        results[entry.plugin.config.id] = status;
      } catch (error) {
        this.logger.error(
          `Health check failed for plugin ${entry.plugin.config.id}:`,
          error as Error
        );
        results[entry.plugin.config.id] = {
          isHealthy: false,
          lastCheck: new Date(),
          error: `Health check failed: ${(error as Error).message}`,
          responseTime: 0,
        };
      }
    });

    await Promise.all(healthCheckPromises);

    this.logger.debug(`Health check completed for ${Object.keys(results).length} plugins`);
    return results;
  }

  // ============================================================================
  // Plugin Configuration Management
  // ============================================================================

  async updatePluginConfig(pluginId: string, config: Record<string, any>): Promise<void> {
    try {
      this.logger.info(`Updating configuration for plugin: ${pluginId}`);
      await pluginRegistry.updateConfig(pluginId, config);
      this.logger.info(`Plugin configuration updated successfully: ${pluginId}`);
    } catch (error) {
      this.logger.error(`Failed to update plugin configuration ${pluginId}:`, error as Error);
      throw error;
    }
  }

  getPluginConfig(pluginId: string): Record<string, any> | null {
    const entry = pluginRegistry.get(pluginId);
    return entry ? entry.config : null;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private async executeWithTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  private startHealthCheckInterval(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkAllPluginsHealth();
      } catch (error) {
        this.logger.error('Error during scheduled health check:', error as Error);
      }
    }, PLUGIN_CONFIG.HEALTH_CHECK_INTERVAL);

    this.logger.debug(`Health check interval started: ${PLUGIN_CONFIG.HEALTH_CHECK_INTERVAL}ms`);
  }

  private setupEventListeners(): void {
    // Listen for plugin errors and handle them
    pluginEventEmitter.on('plugin:error', (data: any) => {
      this.logger.error(`Plugin error detected: ${data.pluginId}`, data.error);
      // Could implement automatic plugin disabling on repeated errors
    });

    // Listen for execution timeouts
    pluginEventEmitter.on('plugin:execution:timeout', (data: any) => {
      this.logger.warn(`Plugin execution timeout: ${data.pluginId} (${data.timeout}ms)`);
      // Could implement automatic plugin health degradation
    });
  }

  // ============================================================================
  // Manager Statistics
  // ============================================================================

  getManagerStats(): {
    isInitialized: boolean;
    totalPlugins: number;
    activePlugins: number;
    healthyPlugins: number;
    registryStats: ReturnType<typeof pluginRegistry.getStats>;
    eventStats: ReturnType<typeof pluginEventEmitter.getEventStats>;
  } {
    const registryStats = pluginRegistry.getStats();
    const eventStats = pluginEventEmitter.getEventStats();

    return {
      isInitialized: this.isInitialized,
      totalPlugins: registryStats.totalPlugins,
      activePlugins: registryStats.enabledPlugins,
      healthyPlugins: registryStats.healthyPlugins,
      registryStats,
      eventStats,
    };
  }
}

// ============================================================================
// Global Plugin Manager Instance
// ============================================================================

export const pluginManager = new PluginManager();
