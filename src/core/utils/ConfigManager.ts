// ============================================================================
// MTYB Virtual Goods Platform - Configuration Manager
// ============================================================================

import { logger } from './Logger';
import { STORAGE_KEYS } from '../constants';

export interface ConfigValue {
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  encrypted?: boolean;
  lastUpdated: Date;
}

export interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    default?: any;
    encrypted?: boolean;
    validator?: (value: any) => boolean;
  };
}

export class ConfigManager {
  private configs: Map<string, ConfigValue> = new Map();
  private schemas: Map<string, ConfigSchema> = new Map();
  private storageKey: string;

  constructor(storageKey: string = STORAGE_KEYS.PLUGIN_CONFIGS) {
    this.storageKey = storageKey;
    this.loadFromStorage();
  }

  // Schema management
  registerSchema(namespace: string, schema: ConfigSchema): void {
    this.schemas.set(namespace, schema);
    logger.debug(`Registered config schema for namespace: ${namespace}`);
  }

  getSchema(namespace: string): ConfigSchema | null {
    return this.schemas.get(namespace) || null;
  }

  // Configuration management
  set(key: string, value: any, encrypted: boolean = false): void {
    const namespace = this.extractNamespace(key);
    const schema = this.schemas.get(namespace);
    
    if (schema) {
      const fieldName = this.extractFieldName(key);
      const fieldSchema = schema[fieldName];
      
      if (fieldSchema) {
        // Validate type
        if (!this.validateType(value, fieldSchema.type)) {
          throw new Error(`Invalid type for ${key}. Expected ${fieldSchema.type}`);
        }
        
        // Run custom validator if provided
        if (fieldSchema.validator && !fieldSchema.validator(value)) {
          throw new Error(`Validation failed for ${key}`);
        }
      }
    }

    const configValue: ConfigValue = {
      value: encrypted ? this.encrypt(value) : value,
      type: this.getValueType(value),
      encrypted,
      lastUpdated: new Date()
    };

    this.configs.set(key, configValue);
    this.saveToStorage();
    
    logger.debug(`Config set: ${key}`, { encrypted });
  }

  get<T = any>(key: string, defaultValue?: T): T | undefined {
    const config = this.configs.get(key);
    
    if (!config) {
      // Try to get default from schema
      const namespace = this.extractNamespace(key);
      const schema = this.schemas.get(namespace);
      
      if (schema) {
        const fieldName = this.extractFieldName(key);
        const fieldSchema = schema[fieldName];
        
        if (fieldSchema && fieldSchema.default !== undefined) {
          return fieldSchema.default;
        }
      }
      
      return defaultValue;
    }

    const value = config.encrypted ? this.decrypt(config.value) : config.value;
    return value as T;
  }

  has(key: string): boolean {
    return this.configs.has(key);
  }

  delete(key: string): boolean {
    const deleted = this.configs.delete(key);
    if (deleted) {
      this.saveToStorage();
      logger.debug(`Config deleted: ${key}`);
    }
    return deleted;
  }

  clear(namespace?: string): void {
    if (namespace) {
      const keysToDelete = Array.from(this.configs.keys())
        .filter(key => key.startsWith(`${namespace}.`));
      
      keysToDelete.forEach(key => this.configs.delete(key));
      logger.debug(`Cleared configs for namespace: ${namespace}`);
    } else {
      this.configs.clear();
      logger.debug('Cleared all configs');
    }
    
    this.saveToStorage();
  }

  // Bulk operations
  setMultiple(configs: Record<string, any>, namespace?: string): void {
    Object.entries(configs).forEach(([key, value]) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      this.set(fullKey, value);
    });
  }

  getMultiple(keys: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    keys.forEach(key => {
      result[key] = this.get(key);
    });
    return result;
  }

  getNamespaceConfigs(namespace: string): Record<string, any> {
    const result: Record<string, any> = {};
    const prefix = `${namespace}.`;
    
    for (const [key, config] of this.configs.entries()) {
      if (key.startsWith(prefix)) {
        const fieldName = key.substring(prefix.length);
        result[fieldName] = config.encrypted ? this.decrypt(config.value) : config.value;
      }
    }
    
    return result;
  }

  // Validation
  validateNamespace(namespace: string): { isValid: boolean; errors: string[] } {
    const schema = this.schemas.get(namespace);
    if (!schema) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];
    const configs = this.getNamespaceConfigs(namespace);

    // Check required fields
    Object.entries(schema).forEach(([field, fieldSchema]) => {
      if (fieldSchema.required && !(field in configs)) {
        errors.push(`Required field missing: ${field}`);
      }
    });

    // Validate existing configs
    Object.entries(configs).forEach(([field, value]) => {
      const fieldSchema = schema[field];
      if (fieldSchema) {
        if (!this.validateType(value, fieldSchema.type)) {
          errors.push(`Invalid type for ${field}. Expected ${fieldSchema.type}`);
        }
        
        if (fieldSchema.validator && !fieldSchema.validator(value)) {
          errors.push(`Validation failed for ${field}`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Storage operations
  private saveToStorage(): void {
    try {
      const data = Object.fromEntries(this.configs.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save configs to storage', error as Error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.configs = new Map(Object.entries(parsed).map(([key, value]: [string, any]) => [
          key,
          {
            ...value,
            lastUpdated: new Date(value.lastUpdated)
          }
        ]));
      }
    } catch (error) {
      logger.error('Failed to load configs from storage', error as Error);
    }
  }

  // Utility methods
  private extractNamespace(key: string): string {
    const parts = key.split('.');
    return parts.length > 1 ? parts[0] : '';
  }

  private extractFieldName(key: string): string {
    const parts = key.split('.');
    return parts.length > 1 ? parts.slice(1).join('.') : key;
  }

  private getValueType(value: any): ConfigValue['type'] {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'object';
    return typeof value as ConfigValue['type'];
  }

  private validateType(value: any, expectedType: ConfigValue['type']): boolean {
    const actualType = this.getValueType(value);
    return actualType === expectedType;
  }

  // Simple encryption/decryption (for demo purposes - use proper encryption in production)
  private encrypt(value: any): string {
    return btoa(JSON.stringify(value));
  }

  private decrypt(encryptedValue: string): any {
    try {
      return JSON.parse(atob(encryptedValue));
    } catch {
      return encryptedValue;
    }
  }
}

// Global config manager instance
export const configManager = new ConfigManager();
