// ============================================================================
// MTYB Virtual Goods Platform - Plugin Components Exports
// ============================================================================

export { PluginDashboard } from './PluginDashboard';
export { PluginEventLog } from './PluginEventLog';
export { PluginSettings } from './PluginSettings';
export { PluginManagement } from './PluginManagement';

// Re-export commonly used types for convenience
export type {
  // Common plugin types from main types file
  PluginConfig,
  PluginStatus,
  PluginContext,
  PluginLogger,
  ValidationResult,
  DeliveryResult,
  PluginHealthStatus,
} from '../../types';

// Component-specific types
export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  status: 'enabled' | 'disabled' | 'error' | 'loading';
  isEnabled: boolean;
  lastHealthCheck?: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
    timestamp: Date;
  };
  executionStats?: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    lastExecution?: Date;
  };
  registeredAt: Date;
  lastUpdated: Date;
}

export interface PluginManagerStats {
  totalPlugins: number;
  enabledPlugins: number;
  disabledPlugins: number;
  healthyPlugins: number;
  unhealthyPlugins: number;
  totalExecutions: number;
  successRate: number;
}

export interface PluginEvent {
  id: string;
  pluginId: string;
  pluginName: string;
  type: 'execution' | 'error' | 'health_check' | 'config_change' | 'status_change';
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  duration?: number;
  userId?: string;
  orderId?: string;
}

export interface PluginConfigField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'password';
  required: boolean;
  description?: string;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface PluginConfigSchema {
  pluginId: string;
  pluginName: string;
  version: string;
  fields: PluginConfigField[];
}

export interface PluginConfiguration {
  pluginId: string;
  config: Record<string, any>;
  isValid: boolean;
  lastUpdated: Date;
}
