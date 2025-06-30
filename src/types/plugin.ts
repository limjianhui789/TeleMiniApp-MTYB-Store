// ============================================================================
// MTYB Virtual Goods Platform - Plugin Interface Definitions
// ============================================================================

import {
  type PluginConfig,
  type PluginContext,
  type ValidationResult,
  type DeliveryResult,
  type PluginHealthStatus,
  type Product,
  type ProductCategory,
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
      responseTime: 0,
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
  ORDER_FAILED = 'order:failed',
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

// ============================================================================
// Plugin Security & Sandbox
// ============================================================================

export interface PluginSandbox {
  execute<T = any>(pluginId: string, method: string, args: any[], timeout?: number): Promise<T>;

  createContext(pluginId: string): PluginSandboxContext;
  destroyContext(pluginId: string): Promise<void>;

  setResourceLimits(pluginId: string, limits: PluginResourceLimits): void;
  getResourceUsage(pluginId: string): PluginResourceUsage;
}

export interface PluginSandboxContext {
  id: string;
  pluginId: string;
  isolatedGlobals: Record<string, any>;
  allowedModules: string[];
  restrictions: PluginRestrictions;
}

export interface PluginResourceLimits {
  maxMemoryMB: number;
  maxExecutionTimeMs: number;
  maxNetworkRequests: number;
  maxFileOperations: number;
}

export interface PluginResourceUsage {
  memoryUsageMB: number;
  executionTimeMs: number;
  networkRequests: number;
  fileOperations: number;
  lastMeasured: Date;
}

export interface PluginRestrictions {
  allowFileAccess: boolean;
  allowNetworkAccess: boolean;
  allowedDomains: string[];
  allowedAPIs: string[];
  disallowedAPIs: string[];
}

// ============================================================================
// Plugin Templates & Scaffolding
// ============================================================================

export interface PluginTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  sourceCode: string;
  configSchema: Record<string, any>;
  dependencies: string[];
  examples: PluginExample[];
}

export interface PluginExample {
  name: string;
  description: string;
  config: Record<string, any>;
  expectedResult: any;
}

export interface PluginScaffoldOptions {
  templateId: string;
  pluginName: string;
  pluginDescription: string;
  author: string;
  category: ProductCategory;
  customFields?: Record<string, any>;
}

// ============================================================================
// Plugin Marketplace
// ============================================================================

export interface PluginMarketplace {
  searchPlugins(query: string, filters?: PluginSearchFilters): Promise<PluginSearchResult[]>;
  getPlugin(pluginId: string): Promise<PluginMarketplaceEntry | null>;
  installPlugin(pluginId: string, version?: string): Promise<void>;
  uninstallPlugin(pluginId: string): Promise<void>;
  updatePlugin(pluginId: string, version?: string): Promise<void>;
  getInstalledPlugins(): Promise<PluginMarketplaceEntry[]>;
}

export interface PluginSearchFilters {
  category?: ProductCategory;
  priceRange?: [number, number];
  rating?: number;
  compatibility?: string;
  license?: string;
}

export interface PluginSearchResult {
  id: string;
  name: string;
  description: string;
  author: string;
  category: ProductCategory;
  version: string;
  rating: number;
  downloads: number;
  price: number;
  currency: string;
  thumbnailUrl?: string;
}

export interface PluginMarketplaceEntry extends PluginSearchResult {
  longDescription: string;
  documentation: string;
  changelog: PluginChangelogEntry[];
  screenshots: string[];
  license: string;
  dependencies: PluginDependency[];
  compatibility: PluginCompatibility;
  support: PluginSupport;
}

export interface PluginChangelogEntry {
  version: string;
  releaseDate: Date;
  changes: string[];
  breaking: boolean;
}

export interface PluginDependency {
  name: string;
  version: string;
  optional: boolean;
}

export interface PluginCompatibility {
  minVersion: string;
  maxVersion?: string;
  platforms: string[];
}

export interface PluginSupport {
  email?: string;
  website?: string;
  documentation?: string;
  issueTracker?: string;
}
