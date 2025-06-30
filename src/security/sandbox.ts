// ============================================================================
// MTYB Plugin Security Sandbox - Core Implementation
// ============================================================================

import { PluginPermission, PluginContext, PluginAPI } from '../sdk/types';

// Security Policy Definitions
export interface SecurityPolicy {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly permissions: PluginPermission[];
  readonly restrictions: SecurityRestriction[];
  readonly resources: ResourceLimits;
  readonly network: NetworkPolicy;
  readonly storage: StoragePolicy;
  readonly execution: ExecutionPolicy;
}

export interface SecurityRestriction {
  readonly type: RestrictionType;
  readonly target: string;
  readonly action: 'deny' | 'allow' | 'limit';
  readonly parameters?: Record<string, any>;
}

export type RestrictionType =
  | 'api_access'
  | 'dom_access'
  | 'eval_execution'
  | 'module_import'
  | 'file_access'
  | 'network_access'
  | 'storage_access'
  | 'crypto_access';

export interface ResourceLimits {
  readonly memory: number; // MB
  readonly storage: number; // MB
  readonly cpu: number; // percentage
  readonly networkRequests: number; // per minute
  readonly fileOperations: number; // per minute
  readonly executionTime: number; // seconds
}

export interface NetworkPolicy {
  readonly allowedDomains: string[];
  readonly blockedDomains: string[];
  readonly allowedPorts: number[];
  readonly blockedPorts: number[];
  readonly requireHttps: boolean;
  readonly maxRequestSize: number; // bytes
  readonly maxResponseSize: number; // bytes
}

export interface StoragePolicy {
  readonly maxKeys: number;
  readonly maxKeySize: number; // bytes
  readonly maxValueSize: number; // bytes
  readonly allowedPrefixes: string[];
  readonly encryption: boolean;
}

export interface ExecutionPolicy {
  readonly allowEval: boolean;
  readonly allowDynamicImports: boolean;
  readonly allowWorkers: boolean;
  readonly allowTimers: boolean;
  readonly maxExecutionTime: number; // ms
  readonly maxCallStackDepth: number;
}

// Sandbox Error Types
export class SandboxViolationError extends Error {
  constructor(
    message: string,
    public readonly violation: SecurityViolation
  ) {
    super(message);
    this.name = 'SandboxViolationError';
  }
}

export interface SecurityViolation {
  readonly pluginId: string;
  readonly type: RestrictionType;
  readonly action: string;
  readonly details: any;
  readonly timestamp: Date;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
}

// Resource Monitor
export class ResourceMonitor {
  private usage = new Map<string, ResourceUsage>();
  private limits = new Map<string, ResourceLimits>();
  private violations: SecurityViolation[] = [];

  setLimits(pluginId: string, limits: ResourceLimits): void {
    this.limits.set(pluginId, limits);
    this.usage.set(pluginId, {
      memory: 0,
      storage: 0,
      cpu: 0,
      networkRequests: 0,
      fileOperations: 0,
      executionTime: 0,
      startTime: Date.now(),
    });
  }

  trackMemoryUsage(pluginId: string, bytes: number): void {
    const usage = this.usage.get(pluginId);
    const limits = this.limits.get(pluginId);

    if (!usage || !limits) return;

    usage.memory = Math.max(usage.memory, bytes / (1024 * 1024)); // Convert to MB

    if (usage.memory > limits.memory) {
      this.recordViolation(
        pluginId,
        'api_access',
        'memory_exceeded',
        {
          current: usage.memory,
          limit: limits.memory,
        },
        'high'
      );
    }
  }

  trackNetworkRequest(pluginId: string): boolean {
    const usage = this.usage.get(pluginId);
    const limits = this.limits.get(pluginId);

    if (!usage || !limits) return false;

    // Reset counter every minute
    const now = Date.now();
    if (now - usage.networkRequestsReset > 60000) {
      usage.networkRequests = 0;
      usage.networkRequestsReset = now;
    }

    usage.networkRequests++;

    if (usage.networkRequests > limits.networkRequests) {
      this.recordViolation(
        pluginId,
        'network_access',
        'request_limit_exceeded',
        {
          current: usage.networkRequests,
          limit: limits.networkRequests,
        },
        'medium'
      );
      return false;
    }

    return true;
  }

  trackExecutionTime(pluginId: string, executionTimeMs: number): boolean {
    const usage = this.usage.get(pluginId);
    const limits = this.limits.get(pluginId);

    if (!usage || !limits) return true;

    const executionTimeSeconds = executionTimeMs / 1000;
    usage.executionTime += executionTimeSeconds;

    if (executionTimeSeconds > limits.executionTime) {
      this.recordViolation(
        pluginId,
        'api_access',
        'execution_time_exceeded',
        {
          current: executionTimeSeconds,
          limit: limits.executionTime,
        },
        'high'
      );
      return false;
    }

    return true;
  }

  getUsage(pluginId: string): ResourceUsage | null {
    return this.usage.get(pluginId) || null;
  }

  getViolations(pluginId?: string): SecurityViolation[] {
    if (pluginId) {
      return this.violations.filter(v => v.pluginId === pluginId);
    }
    return [...this.violations];
  }

  private recordViolation(
    pluginId: string,
    type: RestrictionType,
    action: string,
    details: any,
    severity: SecurityViolation['severity']
  ): void {
    const violation: SecurityViolation = {
      pluginId,
      type,
      action,
      details,
      timestamp: new Date(),
      severity,
    };

    this.violations.push(violation);

    // Emit violation event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('plugin:security:violation', {
          detail: violation,
        })
      );
    }
  }
}

interface ResourceUsage {
  memory: number;
  storage: number;
  cpu: number;
  networkRequests: number;
  fileOperations: number;
  executionTime: number;
  startTime: number;
  networkRequestsReset?: number;
}

// Security Context
export class SecurityContext {
  private policies = new Map<string, SecurityPolicy>();
  private resourceMonitor = new ResourceMonitor();
  private activePlugins = new Set<string>();

  registerPlugin(pluginId: string, policy: SecurityPolicy): void {
    this.policies.set(pluginId, policy);
    this.resourceMonitor.setLimits(pluginId, policy.resources);
    this.activePlugins.add(pluginId);
  }

  unregisterPlugin(pluginId: string): void {
    this.policies.delete(pluginId);
    this.activePlugins.delete(pluginId);
  }

  checkPermission(pluginId: string, permission: PluginPermission): boolean {
    const policy = this.policies.get(pluginId);
    if (!policy) return false;

    return policy.permissions.includes(permission);
  }

  checkRestriction(pluginId: string, type: RestrictionType, target: string): boolean {
    const policy = this.policies.get(pluginId);
    if (!policy) return false;

    const restriction = policy.restrictions.find(
      r => r.type === type && (r.target === target || r.target === '*')
    );

    if (!restriction) return true; // No restriction = allowed

    return restriction.action === 'allow';
  }

  validateNetworkRequest(pluginId: string, url: string): boolean {
    const policy = this.policies.get(pluginId);
    if (!policy) return false;

    // Check if network access is allowed
    if (!this.resourceMonitor.trackNetworkRequest(pluginId)) {
      return false;
    }

    try {
      const urlObj = new URL(url);

      // Check HTTPS requirement
      if (policy.network.requireHttps && urlObj.protocol !== 'https:') {
        this.recordViolation(pluginId, 'network_access', 'https_required', { url });
        return false;
      }

      // Check allowed domains
      if (policy.network.allowedDomains.length > 0) {
        const isAllowed = policy.network.allowedDomains.some(
          domain => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
        );
        if (!isAllowed) {
          this.recordViolation(pluginId, 'network_access', 'domain_not_allowed', {
            url,
            domain: urlObj.hostname,
          });
          return false;
        }
      }

      // Check blocked domains
      const isBlocked = policy.network.blockedDomains.some(
        domain => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
      if (isBlocked) {
        this.recordViolation(pluginId, 'network_access', 'domain_blocked', {
          url,
          domain: urlObj.hostname,
        });
        return false;
      }

      // Check ports
      const port = parseInt(urlObj.port) || (urlObj.protocol === 'https:' ? 443 : 80);

      if (policy.network.allowedPorts.length > 0 && !policy.network.allowedPorts.includes(port)) {
        this.recordViolation(pluginId, 'network_access', 'port_not_allowed', { url, port });
        return false;
      }

      if (policy.network.blockedPorts.includes(port)) {
        this.recordViolation(pluginId, 'network_access', 'port_blocked', { url, port });
        return false;
      }

      return true;
    } catch (error) {
      this.recordViolation(pluginId, 'network_access', 'invalid_url', {
        url,
        error: error.message,
      });
      return false;
    }
  }

  validateStorageOperation(
    pluginId: string,
    operation: 'get' | 'set' | 'remove',
    key: string,
    value?: any
  ): boolean {
    const policy = this.policies.get(pluginId);
    if (!policy) return false;

    const storagePolicy = policy.storage;

    // Check key prefix
    if (storagePolicy.allowedPrefixes.length > 0) {
      const isAllowed = storagePolicy.allowedPrefixes.some(prefix => key.startsWith(prefix));
      if (!isAllowed) {
        this.recordViolation(pluginId, 'storage_access', 'key_prefix_not_allowed', { key });
        return false;
      }
    }

    // Check key size
    if (key.length > storagePolicy.maxKeySize) {
      this.recordViolation(pluginId, 'storage_access', 'key_too_large', {
        key,
        size: key.length,
        limit: storagePolicy.maxKeySize,
      });
      return false;
    }

    // Check value size for set operations
    if (operation === 'set' && value !== undefined) {
      const valueSize = JSON.stringify(value).length;
      if (valueSize > storagePolicy.maxValueSize) {
        this.recordViolation(pluginId, 'storage_access', 'value_too_large', {
          key,
          size: valueSize,
          limit: storagePolicy.maxValueSize,
        });
        return false;
      }
    }

    return true;
  }

  getResourceMonitor(): ResourceMonitor {
    return this.resourceMonitor;
  }

  private recordViolation(
    pluginId: string,
    type: RestrictionType,
    action: string,
    details: any
  ): void {
    // Implementation delegated to ResourceMonitor
    // This is just a placeholder for potential future direct violations
  }
}

// Sandboxed API Wrapper
export class SandboxedAPI implements PluginAPI {
  private securityContext: SecurityContext;
  private pluginId: string;
  private originalAPI: PluginAPI;

  constructor(securityContext: SecurityContext, pluginId: string, originalAPI: PluginAPI) {
    this.securityContext = securityContext;
    this.pluginId = pluginId;
    this.originalAPI = originalAPI;
  }

  get storage() {
    return {
      async get(key: string): Promise<any> {
        if (!this.securityContext.checkPermission(this.pluginId, 'storage.read')) {
          throw new SandboxViolationError('Storage read permission denied', {
            pluginId: this.pluginId,
            type: 'storage_access',
            action: 'get',
            details: { key },
            timestamp: new Date(),
            severity: 'medium',
          });
        }

        if (!this.securityContext.validateStorageOperation(this.pluginId, 'get', key)) {
          throw new SandboxViolationError('Storage operation violates security policy', {
            pluginId: this.pluginId,
            type: 'storage_access',
            action: 'get',
            details: { key },
            timestamp: new Date(),
            severity: 'medium',
          });
        }

        return await this.originalAPI.storage.get(key);
      },

      async set(key: string, value: any): Promise<void> {
        if (!this.securityContext.checkPermission(this.pluginId, 'storage.write')) {
          throw new SandboxViolationError('Storage write permission denied', {
            pluginId: this.pluginId,
            type: 'storage_access',
            action: 'set',
            details: { key },
            timestamp: new Date(),
            severity: 'medium',
          });
        }

        if (!this.securityContext.validateStorageOperation(this.pluginId, 'set', key, value)) {
          throw new SandboxViolationError('Storage operation violates security policy', {
            pluginId: this.pluginId,
            type: 'storage_access',
            action: 'set',
            details: { key, valueSize: JSON.stringify(value).length },
            timestamp: new Date(),
            severity: 'medium',
          });
        }

        return await this.originalAPI.storage.set(key, value);
      },

      async remove(key: string): Promise<void> {
        if (!this.securityContext.checkPermission(this.pluginId, 'storage.write')) {
          throw new SandboxViolationError('Storage write permission denied', {
            pluginId: this.pluginId,
            type: 'storage_access',
            action: 'remove',
            details: { key },
            timestamp: new Date(),
            severity: 'medium',
          });
        }

        if (!this.securityContext.validateStorageOperation(this.pluginId, 'remove', key)) {
          throw new SandboxViolationError('Storage operation violates security policy', {
            pluginId: this.pluginId,
            type: 'storage_access',
            action: 'remove',
            details: { key },
            timestamp: new Date(),
            severity: 'medium',
          });
        }

        return await this.originalAPI.storage.remove(key);
      },

      async clear(): Promise<void> {
        if (!this.securityContext.checkPermission(this.pluginId, 'storage.write')) {
          throw new SandboxViolationError('Storage write permission denied', {
            pluginId: this.pluginId,
            type: 'storage_access',
            action: 'clear',
            details: {},
            timestamp: new Date(),
            severity: 'high',
          });
        }

        return await this.originalAPI.storage.clear();
      },

      async keys(): Promise<string[]> {
        if (!this.securityContext.checkPermission(this.pluginId, 'storage.read')) {
          throw new SandboxViolationError('Storage read permission denied', {
            pluginId: this.pluginId,
            type: 'storage_access',
            action: 'keys',
            details: {},
            timestamp: new Date(),
            severity: 'medium',
          });
        }

        return await this.originalAPI.storage.keys();
      },

      async has(key: string): Promise<boolean> {
        if (!this.securityContext.checkPermission(this.pluginId, 'storage.read')) {
          throw new SandboxViolationError('Storage read permission denied', {
            pluginId: this.pluginId,
            type: 'storage_access',
            action: 'has',
            details: { key },
            timestamp: new Date(),
            severity: 'medium',
          });
        }

        return await this.originalAPI.storage.has(key);
      },

      async size(): Promise<number> {
        if (!this.securityContext.checkPermission(this.pluginId, 'storage.read')) {
          throw new SandboxViolationError('Storage read permission denied', {
            pluginId: this.pluginId,
            type: 'storage_access',
            action: 'size',
            details: {},
            timestamp: new Date(),
            severity: 'medium',
          });
        }

        return await this.originalAPI.storage.size();
      },
    };
  }

  get ui() {
    return {
      showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => {
        if (!this.securityContext.checkPermission(this.pluginId, 'ui.toast')) {
          throw new SandboxViolationError('UI toast permission denied', {
            pluginId: this.pluginId,
            type: 'api_access',
            action: 'showToast',
            details: { message, type },
            timestamp: new Date(),
            severity: 'low',
          });
        }

        return this.originalAPI.ui.showToast(message, type);
      },

      showModal: async (options: any) => {
        if (!this.securityContext.checkPermission(this.pluginId, 'ui.modal')) {
          throw new SandboxViolationError('UI modal permission denied', {
            pluginId: this.pluginId,
            type: 'api_access',
            action: 'showModal',
            details: { options },
            timestamp: new Date(),
            severity: 'medium',
          });
        }

        return await this.originalAPI.ui.showModal(options);
      },

      showNotification: async (options: any) => {
        if (!this.securityContext.checkPermission(this.pluginId, 'ui.notifications')) {
          throw new SandboxViolationError('UI notification permission denied', {
            pluginId: this.pluginId,
            type: 'api_access',
            action: 'showNotification',
            details: { options },
            timestamp: new Date(),
            severity: 'medium',
          });
        }

        return await this.originalAPI.ui.showNotification(options);
      },

      createComponent: (type: any, props: any) => {
        return this.originalAPI.ui.createComponent(type, props);
      },

      navigate: (path: string, options?: any) => {
        return this.originalAPI.ui.navigate(path, options);
      },

      setTheme: (theme: 'light' | 'dark') => {
        return this.originalAPI.ui.setTheme(theme);
      },
    };
  }

  get network() {
    return {
      http: {
        get: async (url: string, options?: any) => {
          if (!this.securityContext.checkPermission(this.pluginId, 'network.http')) {
            throw new SandboxViolationError('Network HTTP permission denied', {
              pluginId: this.pluginId,
              type: 'network_access',
              action: 'http.get',
              details: { url },
              timestamp: new Date(),
              severity: 'medium',
            });
          }

          if (!this.securityContext.validateNetworkRequest(this.pluginId, url)) {
            throw new SandboxViolationError('Network request violates security policy', {
              pluginId: this.pluginId,
              type: 'network_access',
              action: 'http.get',
              details: { url },
              timestamp: new Date(),
              severity: 'high',
            });
          }

          return await this.originalAPI.network.http.get(url, options);
        },

        post: async (url: string, data?: any, options?: any) => {
          if (!this.securityContext.checkPermission(this.pluginId, 'network.http')) {
            throw new SandboxViolationError('Network HTTP permission denied', {
              pluginId: this.pluginId,
              type: 'network_access',
              action: 'http.post',
              details: { url },
              timestamp: new Date(),
              severity: 'medium',
            });
          }

          if (!this.securityContext.validateNetworkRequest(this.pluginId, url)) {
            throw new SandboxViolationError('Network request violates security policy', {
              pluginId: this.pluginId,
              type: 'network_access',
              action: 'http.post',
              details: { url },
              timestamp: new Date(),
              severity: 'high',
            });
          }

          return await this.originalAPI.network.http.post(url, data, options);
        },

        put: async (url: string, data?: any, options?: any) => {
          if (!this.securityContext.checkPermission(this.pluginId, 'network.http')) {
            throw new SandboxViolationError('Network HTTP permission denied', {
              pluginId: this.pluginId,
              type: 'network_access',
              action: 'http.put',
              details: { url },
              timestamp: new Date(),
              severity: 'medium',
            });
          }

          if (!this.securityContext.validateNetworkRequest(this.pluginId, url)) {
            throw new SandboxViolationError('Network request violates security policy', {
              pluginId: this.pluginId,
              type: 'network_access',
              action: 'http.put',
              details: { url },
              timestamp: new Date(),
              severity: 'high',
            });
          }

          return await this.originalAPI.network.http.put(url, data, options);
        },

        delete: async (url: string, options?: any) => {
          if (!this.securityContext.checkPermission(this.pluginId, 'network.http')) {
            throw new SandboxViolationError('Network HTTP permission denied', {
              pluginId: this.pluginId,
              type: 'network_access',
              action: 'http.delete',
              details: { url },
              timestamp: new Date(),
              severity: 'medium',
            });
          }

          if (!this.securityContext.validateNetworkRequest(this.pluginId, url)) {
            throw new SandboxViolationError('Network request violates security policy', {
              pluginId: this.pluginId,
              type: 'network_access',
              action: 'http.delete',
              details: { url },
              timestamp: new Date(),
              severity: 'high',
            });
          }

          return await this.originalAPI.network.http.delete(url, options);
        },

        patch: async (url: string, data?: any, options?: any) => {
          if (!this.securityContext.checkPermission(this.pluginId, 'network.http')) {
            throw new SandboxViolationError('Network HTTP permission denied', {
              pluginId: this.pluginId,
              type: 'network_access',
              action: 'http.patch',
              details: { url },
              timestamp: new Date(),
              severity: 'medium',
            });
          }

          if (!this.securityContext.validateNetworkRequest(this.pluginId, url)) {
            throw new SandboxViolationError('Network request violates security policy', {
              pluginId: this.pluginId,
              type: 'network_access',
              action: 'http.patch',
              details: { url },
              timestamp: new Date(),
              severity: 'high',
            });
          }

          return await this.originalAPI.network.http.patch(url, data, options);
        },
      },

      websocket: {
        connect: async (url: string, protocols?: string[]) => {
          if (!this.securityContext.checkPermission(this.pluginId, 'network.websocket')) {
            throw new SandboxViolationError('Network WebSocket permission denied', {
              pluginId: this.pluginId,
              type: 'network_access',
              action: 'websocket.connect',
              details: { url },
              timestamp: new Date(),
              severity: 'medium',
            });
          }

          if (!this.securityContext.validateNetworkRequest(this.pluginId, url)) {
            throw new SandboxViolationError('WebSocket connection violates security policy', {
              pluginId: this.pluginId,
              type: 'network_access',
              action: 'websocket.connect',
              details: { url },
              timestamp: new Date(),
              severity: 'high',
            });
          }

          return await this.originalAPI.network.websocket.connect(url, protocols);
        },
      },
    };
  }

  get system() {
    return this.originalAPI.system;
  }

  get crypto() {
    return {
      hash: async (data: string | ArrayBuffer, algorithm?: 'SHA-1' | 'SHA-256' | 'SHA-512') => {
        if (!this.securityContext.checkPermission(this.pluginId, 'crypto.hash')) {
          throw new SandboxViolationError('Crypto hash permission denied', {
            pluginId: this.pluginId,
            type: 'crypto_access',
            action: 'hash',
            details: { algorithm },
            timestamp: new Date(),
            severity: 'low',
          });
        }

        return await this.originalAPI.crypto.hash(data, algorithm);
      },

      encrypt: async (data: string, key: string) => {
        if (!this.securityContext.checkPermission(this.pluginId, 'crypto.encrypt')) {
          throw new SandboxViolationError('Crypto encrypt permission denied', {
            pluginId: this.pluginId,
            type: 'crypto_access',
            action: 'encrypt',
            details: {},
            timestamp: new Date(),
            severity: 'medium',
          });
        }

        return await this.originalAPI.crypto.encrypt(data, key);
      },

      decrypt: async (encryptedData: string, key: string) => {
        if (!this.securityContext.checkPermission(this.pluginId, 'crypto.encrypt')) {
          throw new SandboxViolationError('Crypto decrypt permission denied', {
            pluginId: this.pluginId,
            type: 'crypto_access',
            action: 'decrypt',
            details: {},
            timestamp: new Date(),
            severity: 'medium',
          });
        }

        return await this.originalAPI.crypto.decrypt(encryptedData, key);
      },

      generateKey: async (length?: number) => {
        return await this.originalAPI.crypto.generateKey(length);
      },

      randomBytes: (length: number) => {
        return this.originalAPI.crypto.randomBytes(length);
      },

      uuid: () => {
        return this.originalAPI.crypto.uuid();
      },
    };
  }

  get analytics() {
    return this.originalAPI.analytics;
  }
}

// Global security context
export const globalSecurityContext = new SecurityContext();
