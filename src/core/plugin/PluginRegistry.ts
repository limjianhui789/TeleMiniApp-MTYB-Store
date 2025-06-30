// ============================================================================
// MTYB Virtual Goods Platform - Plugin Registry
// ============================================================================

import { BasePlugin, type IPluginRegistry, type PluginRegistryEntry } from '../../types/plugin';
import { type PluginHealthStatus } from '../../types';
import { Logger } from '../utils/Logger';
import { Validator } from '../utils/Validator';
import { pluginEventEmitter } from './PluginEventEmitter';

// ============================================================================
// Plugin Registry Implementation
// ============================================================================

export class PluginRegistry implements IPluginRegistry {
  private plugins: Map<string, PluginRegistryEntry> = new Map();
  private logger: Logger;
  constructor() {
    this.logger = new Logger('PluginRegistry');
  }

  // ============================================================================
  // Plugin Registration
  // ============================================================================

  async register(plugin: BasePlugin, config: Record<string, any>): Promise<void> {
    try {
      // Validate plugin
      await this.validatePlugin(plugin);

      // Validate configuration
      const configValidation = await plugin.validateConfig(config);
      if (!configValidation.isValid) {
        throw new Error(
          `Plugin configuration validation failed: ${configValidation.errors.join(', ')}`
        );
      }

      // Check if plugin already exists
      if (this.plugins.has(plugin.config.id)) {
        throw new Error(`Plugin with ID '${plugin.config.id}' is already registered`);
      }

      // Create registry entry
      const entry: PluginRegistryEntry = {
        plugin,
        config,
        isEnabled: false,
        registeredAt: new Date(),
        lastUpdated: new Date(),
      };

      // Store in registry
      this.plugins.set(plugin.config.id, entry);

      // Emit registration event
      pluginEventEmitter.emitPluginRegistered(plugin.config.id);

      this.logger.info(
        `Plugin registered successfully: ${plugin.config.id} v${plugin.config.version}`
      );
    } catch (error) {
      this.logger.error(`Failed to register plugin ${plugin.config.id}:`, error as Error);
      throw error;
    }
  }

  async unregister(pluginId: string): Promise<void> {
    try {
      const entry = this.plugins.get(pluginId);
      if (!entry) {
        throw new Error(`Plugin '${pluginId}' is not registered`);
      }

      // Disable plugin if enabled
      if (entry.isEnabled) {
        await this.setEnabled(pluginId, false);
      }

      // Cleanup plugin resources
      await entry.plugin.cleanup();

      // Remove from registry
      this.plugins.delete(pluginId);

      // Emit unregistration event
      pluginEventEmitter.emitPluginUnregistered(pluginId);

      this.logger.info(`Plugin unregistered successfully: ${pluginId}`);
    } catch (error) {
      this.logger.error(`Failed to unregister plugin ${pluginId}:`, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // Plugin Retrieval
  // ============================================================================

  get(pluginId: string): PluginRegistryEntry | null {
    return this.plugins.get(pluginId) || null;
  }

  getAll(): PluginRegistryEntry[] {
    return Array.from(this.plugins.values());
  }

  getEnabled(): PluginRegistryEntry[] {
    return this.getAll().filter(entry => entry.isEnabled);
  }

  getByCategory(category: string): PluginRegistryEntry[] {
    return this.getAll().filter(entry => entry.plugin.config.category === category);
  }

  // ============================================================================
  // Plugin Configuration Management
  // ============================================================================

  async updateConfig(pluginId: string, config: Record<string, any>): Promise<void> {
    try {
      const entry = this.plugins.get(pluginId);
      if (!entry) {
        throw new Error(`Plugin '${pluginId}' is not registered`);
      }

      // Validate new configuration
      const configValidation = await entry.plugin.validateConfig(config);
      if (!configValidation.isValid) {
        throw new Error(
          `Configuration validation failed: ${configValidation.errors.map(e => e.message).join(', ')}`
        );
      }

      // Update configuration
      entry.config = config;
      entry.lastUpdated = new Date();

      // Re-initialize plugin if it's enabled
      if (entry.isEnabled) {
        await entry.plugin.initialize(config);
        pluginEventEmitter.emitPluginInitialized(pluginId);
      }

      this.logger.info(`Plugin configuration updated: ${pluginId}`);
    } catch (error) {
      this.logger.error(`Failed to update plugin configuration ${pluginId}:`, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // Plugin State Management
  // ============================================================================

  async setEnabled(pluginId: string, enabled: boolean): Promise<void> {
    try {
      const entry = this.plugins.get(pluginId);
      if (!entry) {
        throw new Error(`Plugin '${pluginId}' is not registered`);
      }

      if (entry.isEnabled === enabled) {
        this.logger.debug(`Plugin ${pluginId} is already ${enabled ? 'enabled' : 'disabled'}`);
        return;
      }

      if (enabled) {
        // Initialize plugin
        await entry.plugin.initialize(entry.config);
        entry.isEnabled = true;
        pluginEventEmitter.emitPluginEnabled(pluginId);
        pluginEventEmitter.emitPluginInitialized(pluginId);
        this.logger.info(`Plugin enabled: ${pluginId}`);
      } else {
        // Cleanup plugin
        await entry.plugin.cleanup();
        entry.isEnabled = false;
        pluginEventEmitter.emitPluginDisabled(pluginId);
        this.logger.info(`Plugin disabled: ${pluginId}`);
      }

      entry.lastUpdated = new Date();
    } catch (error) {
      this.logger.error(
        `Failed to ${enabled ? 'enable' : 'disable'} plugin ${pluginId}:`,
        error as Error
      );
      pluginEventEmitter.emitPluginError(pluginId, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // Plugin Health Management
  // ============================================================================

  async updateHealthStatus(pluginId: string, status: PluginHealthStatus): Promise<void> {
    const entry = this.plugins.get(pluginId);
    if (!entry) {
      throw new Error(`Plugin '${pluginId}' is not registered`);
    }

    const previousStatus = entry.lastHealthCheck?.isHealthy;
    entry.lastHealthCheck = status;
    entry.lastUpdated = new Date();

    // Emit health events
    pluginEventEmitter.emitHealthCheck(pluginId, status.isHealthy ? 'healthy' : 'unhealthy');

    if (previousStatus === true && !status.isHealthy) {
      pluginEventEmitter.emitHealthDegraded(pluginId, status.error || 'Health check failed');
    } else if (previousStatus !== true && status.isHealthy) {
      pluginEventEmitter.emitHealthRecovered(pluginId);
    }

    this.logger.debug(
      `Plugin health status updated: ${pluginId} - ${status.isHealthy ? 'healthy' : 'unhealthy'}`
    );
  }

  // ============================================================================
  // Plugin Validation
  // ============================================================================

  private async validatePlugin(plugin: BasePlugin): Promise<void> {
    // Validate plugin config
    if (!plugin.config) {
      throw new Error('Plugin must have a config property');
    }

    const config = plugin.config;

    // Validate required fields
    const requiredFields = ['id', 'name', 'version', 'description', 'author', 'category'];
    for (const field of requiredFields) {
      if (!config[field as keyof typeof config]) {
        throw new Error(`Plugin config missing required field: ${field}`);
      }
    }

    // Validate ID format
    if (!Validator.validators.pluginId(config.id)) {
      throw new Error(
        'Plugin ID must be a valid identifier (alphanumeric with hyphens/underscores)'
      );
    }

    // Validate version format (basic check for semantic versioning)
    if (!Validator.validators.pattern(/^\d+\.\d+\.\d+/)(config.version)) {
      throw new Error('Plugin version must follow semantic versioning (e.g., 1.0.0)');
    }

    // Validate required methods exist
    const requiredMethods = ['initialize', 'validateConfig', 'processOrder', 'validateProduct'];
    for (const method of requiredMethods) {
      if (typeof plugin[method as keyof BasePlugin] !== 'function') {
        throw new Error(`Plugin must implement required method: ${method}`);
      }
    }

    this.logger.debug(`Plugin validation passed: ${config.id}`);
  }

  // ============================================================================
  // Registry Statistics
  // ============================================================================

  getStats(): {
    totalPlugins: number;
    enabledPlugins: number;
    disabledPlugins: number;
    pluginsByCategory: Record<string, number>;
    healthyPlugins: number;
    unhealthyPlugins: number;
  } {
    const all = this.getAll();
    const enabled = all.filter(entry => entry.isEnabled);
    const disabled = all.filter(entry => !entry.isEnabled);

    const pluginsByCategory: Record<string, number> = {};
    let healthyPlugins = 0;
    let unhealthyPlugins = 0;

    all.forEach(entry => {
      const category = entry.plugin.config.category;
      pluginsByCategory[category] = (pluginsByCategory[category] || 0) + 1;

      if (entry.lastHealthCheck) {
        if (entry.lastHealthCheck.isHealthy) {
          healthyPlugins++;
        } else {
          unhealthyPlugins++;
        }
      }
    });

    return {
      totalPlugins: all.length,
      enabledPlugins: enabled.length,
      disabledPlugins: disabled.length,
      pluginsByCategory,
      healthyPlugins,
      unhealthyPlugins,
    };
  }

  // ============================================================================
  // Plugin Discovery
  // ============================================================================

  findPlugins(criteria: {
    category?: string;
    enabled?: boolean;
    healthy?: boolean;
    namePattern?: string;
  }): PluginRegistryEntry[] {
    return this.getAll().filter(entry => {
      if (criteria.category && entry.plugin.config.category !== criteria.category) {
        return false;
      }

      if (criteria.enabled !== undefined && entry.isEnabled !== criteria.enabled) {
        return false;
      }

      if (criteria.healthy !== undefined && entry.lastHealthCheck) {
        const isHealthy = entry.lastHealthCheck.isHealthy;
        if (isHealthy !== criteria.healthy) {
          return false;
        }
      }

      if (criteria.namePattern) {
        const pattern = new RegExp(criteria.namePattern, 'i');
        if (!pattern.test(entry.plugin.config.name)) {
          return false;
        }
      }

      return true;
    });
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up plugin registry...');

    const cleanupPromises = Array.from(this.plugins.values()).map(async entry => {
      try {
        if (entry.isEnabled) {
          await entry.plugin.cleanup();
        }
      } catch (error) {
        this.logger.error(`Error cleaning up plugin ${entry.plugin.config.id}:`, error as Error);
      }
    });

    await Promise.all(cleanupPromises);
    this.plugins.clear();

    this.logger.info('Plugin registry cleanup completed');
  }
}

// ============================================================================
// Global Plugin Registry Instance
// ============================================================================

export const pluginRegistry = new PluginRegistry();
