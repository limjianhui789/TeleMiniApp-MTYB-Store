// ============================================================================
// MTYB Virtual Goods Platform - Plugin Interface Definitions
// ============================================================================

import {
  PluginConfig,
  PluginContext,
  ValidationResult,
  DeliveryResult,
  PluginHealthStatus,
  Product
} from './index';

// ============================================================================
// Base Plugin Interface
// ============================================================================

export abstract class BasePlugin {
  abstract config: PluginConfig;

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  /**
   * Initialize the plugin with configuration
   * @param config Plugin configuration object
   */
  abstract initialize(config: Record<string, any>): Promise<void>;

  /**
   * Validate plugin configuration
   * @param config Configuration to validate
   */
  abstract validateConfig(config: Record<string, any>): Promise<ValidationResult>;

  /**
   * Cleanup resources when plugin is disabled/unloaded
   */
  async cleanup(): Promise<void> {
    // Default implementation - can be overridden
  }

  // ============================================================================
  // Core Functionality
  // ============================================================================

  /**
   * Process an order and handle delivery
   * @param context Plugin execution context
   */
  abstract processOrder(context: PluginContext): Promise<DeliveryResult>;

  /**
   * Validate product data for this plugin
   * @param productData Product configuration data
   */
  abstract validateProduct(productData: Record<string, any>): Promise<ValidationResult>;

  // ============================================================================
  // Optional Hooks
  // ============================================================================

  /**
   * Called when an order is created (before payment)
   * @param _context Plugin execution context
   */
  async onOrderCreated?(_context: PluginContext): Promise<void> {
    // Default empty implementation
  }

  /**
   * Called when payment is completed successfully
   * @param _context Plugin execution context
   */
  async onPaymentCompleted?(_context: PluginContext): Promise<void> {
    // Default empty implementation
  }

  /**
   * Called when an order is cancelled
   * @param _context Plugin execution context
   */
  async onOrderCancelled?(_context: PluginContext): Promise<void> {
    // Default empty implementation
  }

  /**
   * Called when a refund is processed
   * @param _context Plugin execution context
   */
  async onRefundProcessed?(_context: PluginContext): Promise<void> {
    // Default empty implementation
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  /**
   * Perform health check for the plugin
   */
  async healthCheck?(): Promise<PluginHealthStatus> {
    return {
      isHealthy: true,
      lastCheck: new Date(),
      responseTime: 0
    };
  }

  // ============================================================================
  // Configuration Management
  // ============================================================================

  /**
   * Get plugin configuration schema for UI generation
   */
  getConfigSchema?(): Record<string, any> {
    return this.config.configSchema || {};
  }

  /**
   * Get default configuration values
   */
  getDefaultConfig?(): Record<string, any> {
    return {};
  }

  // ============================================================================
  // Product Management
  // ============================================================================

  /**
   * Get available products for this plugin
   */
  async getAvailableProducts?(): Promise<Product[]> {
    return [];
  }

  /**
   * Check product availability
   * @param _productId Product identifier
   */
  async checkProductAvailability?(_productId: string): Promise<boolean> {
    return true;
  }

  /**
   * Update product stock information
   * @param _productId Product identifier
   * @param _quantity Quantity to reserve/release
   */
  async updateProductStock?(_productId: string, _quantity: number): Promise<void> {
    // Default empty implementation
  }
}

// ============================================================================
// Plugin Manager Interface
// ============================================================================

export interface IPluginManager {
  // Plugin Registration
  registerPlugin(plugin: BasePlugin): Promise<void>;
  unregisterPlugin(pluginId: string): Promise<void>;
  
  // Plugin Discovery
  getPlugin(pluginId: string): BasePlugin | null;
  getAllPlugins(): BasePlugin[];
  getActivePlugins(): BasePlugin[];
  
  // Plugin Lifecycle
  enablePlugin(pluginId: string): Promise<void>;
  disablePlugin(pluginId: string): Promise<void>;
  reloadPlugin(pluginId: string): Promise<void>;
  
  // Plugin Execution
  executePlugin(pluginId: string, context: PluginContext): Promise<DeliveryResult>;
  
  // Health Monitoring
  checkPluginHealth(pluginId: string): Promise<PluginHealthStatus>;
  checkAllPluginsHealth(): Promise<Record<string, PluginHealthStatus>>;
  
  // Configuration
  updatePluginConfig(pluginId: string, config: Record<string, any>): Promise<void>;
  getPluginConfig(pluginId: string): Record<string, any> | null;
}

// ============================================================================
// Plugin Event System
// ============================================================================

export enum PluginEvent {
  PLUGIN_REGISTERED = 'plugin:registered',
  PLUGIN_UNREGISTERED = 'plugin:unregistered',
  PLUGIN_ENABLED = 'plugin:enabled',
  PLUGIN_DISABLED = 'plugin:disabled',
  PLUGIN_ERROR = 'plugin:error',
  ORDER_PROCESSING = 'order:processing',
  ORDER_COMPLETED = 'order:completed',
  ORDER_FAILED = 'order:failed'
}

export interface PluginEventData {
  pluginId: string;
  event: PluginEvent;
  data?: any;
  timestamp: Date;
}

export interface IPluginEventEmitter {
  on(event: PluginEvent, listener: (data: PluginEventData) => void): void;
  off(event: PluginEvent, listener: (data: PluginEventData) => void): void;
  emit(event: PluginEvent, data: PluginEventData): void;
}

// ============================================================================
// Plugin Development Utilities
// ============================================================================

export interface PluginDevelopmentTools {
  validatePluginStructure(plugin: BasePlugin): ValidationResult;
  generatePluginTemplate(config: Partial<PluginConfig>): string;
  testPlugin(plugin: BasePlugin, testData: any): Promise<ValidationResult>;
}

// ============================================================================
// Plugin Registry
// ============================================================================

export interface PluginRegistryEntry {
  plugin: BasePlugin;
  config: Record<string, any>;
  isEnabled: boolean;
  lastHealthCheck?: PluginHealthStatus;
  registeredAt: Date;
  lastUpdated: Date;
}

export interface IPluginRegistry {
  register(plugin: BasePlugin, config: Record<string, any>): Promise<void>;
  unregister(pluginId: string): Promise<void>;
  get(pluginId: string): PluginRegistryEntry | null;
  getAll(): PluginRegistryEntry[];
  updateConfig(pluginId: string, config: Record<string, any>): Promise<void>;
  setEnabled(pluginId: string, enabled: boolean): Promise<void>;
}
