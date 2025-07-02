export interface SandboxOptions {
  timeout: number;
  memoryLimit: number; // in MB
  allowAsync: boolean;
  allowedAPIs: string[];
  blockedAPIs: string[];
  permissions: PluginPermission[];
  maxRequestSize: number; // in bytes
  maxNetworkRequests: number;
  resourceLimits: ResourceLimits;
}

export interface PluginPermission {
  type: 'api' | 'network' | 'storage' | 'ui';
  resource: string;
  action: string[];
  conditions?: Record<string, any>;
}

export interface ResourceLimits {
  maxExecutionTime: number; // in milliseconds
  maxMemoryUsage: number; // in bytes
  maxNetworkCalls: number;
  maxStorageOperations: number;
  maxDOMOperations: number;
}

export interface ExecutionContext {
  pluginId: string;
  userId: string;
  version: string;
  permissions: PluginPermission[];
  environment: 'sandbox' | 'restricted' | 'trusted';
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  memoryUsed: number;
  resourceUsage: ResourceUsage;
  violations: SecurityViolation[];
}

export interface ResourceUsage {
  executionTime: number;
  memoryEstimate: number;
  networkCalls: number;
  storageOperations: number;
  domOperations: number;
}

export interface SecurityViolation {
  type: 'permission' | 'resource' | 'api' | 'malicious';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PluginEventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }

  removeListener(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }
}

export class PluginSandbox extends PluginEventEmitter {
  private activeSandboxes: Map<string, SandboxInstance> = new Map();
  private securityAnalyzer: SecurityAnalyzer;

  constructor() {
    super();
    this.securityAnalyzer = new SecurityAnalyzer();
  }

  /**
   * Execute plugin code in secure browser sandbox
   */
  async execute(
    code: string,
    context: ExecutionContext,
    options: Partial<SandboxOptions> = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const resourceMonitor = new ResourceMonitor();
    const violations: SecurityViolation[] = [];

    try {
      // Security pre-analysis
      const preAnalysis = await this.securityAnalyzer.analyzeCode(code);
      if (preAnalysis.threats.length > 0) {
        violations.push(
          ...preAnalysis.threats.map(threat => ({
            type: 'malicious' as const,
            severity: threat.severity,
            description: threat.description,
            timestamp: new Date(),
            metadata: { threat: threat.type },
          }))
        );

        if (preAnalysis.threats.some(t => t.severity === 'critical')) {
          throw new Error('Critical security threats detected in plugin code');
        }
      }

      // Create secure sandbox
      const sandboxInstance = this.createSecureSandbox(context, options);
      const sandboxId = this.generateSandboxId(context);

      this.activeSandboxes.set(sandboxId, sandboxInstance);

      // Start resource monitoring
      resourceMonitor.start();

      // Execute code with timeout and security restrictions
      const result = await this.executeInSandbox(sandboxInstance, code, context, options);

      // Stop monitoring and collect stats
      const resourceUsage = resourceMonitor.stop();

      // Check for resource violations
      const resourceViolations = this.checkResourceViolations(resourceUsage, options);
      violations.push(...resourceViolations);

      // Cleanup
      this.cleanupSandbox(sandboxId);

      return {
        success: true,
        result,
        executionTime: Date.now() - startTime,
        memoryUsed: resourceUsage.memoryEstimate,
        resourceUsage,
        violations,
      };
    } catch (error) {
      const resourceUsage = resourceMonitor.stop();
      this.cleanupSandbox(this.generateSandboxId(context));

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error',
        executionTime: Date.now() - startTime,
        memoryUsed: resourceUsage?.memoryEstimate || 0,
        resourceUsage: resourceUsage || this.getEmptyResourceUsage(),
        violations,
      };
    }
  }

  /**
   * Validate plugin permissions
   */
  async validatePermissions(
    requestedPermissions: PluginPermission[],
    context: ExecutionContext
  ): Promise<{ valid: boolean; violations: string[] }> {
    const violations: string[] = [];

    for (const permission of requestedPermissions) {
      if (!(await this.isPermissionAllowed(permission, context))) {
        violations.push(`Permission ${permission.type}:${permission.resource} not allowed`);
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Create isolated browser-based sandbox
   */
  private createSecureSandbox(
    context: ExecutionContext,
    options: Partial<SandboxOptions>
  ): SandboxInstance {
    const defaultOptions: SandboxOptions = {
      timeout: 30000, // 30 seconds
      memoryLimit: 128, // 128 MB
      allowAsync: true,
      allowedAPIs: ['console', 'fetch', 'localStorage'],
      blockedAPIs: ['eval', 'Function', 'document.write'],
      permissions: context.permissions,
      maxRequestSize: 1024 * 1024, // 1 MB
      maxNetworkRequests: 10,
      resourceLimits: {
        maxExecutionTime: 10000,
        maxMemoryUsage: 128 * 1024 * 1024,
        maxNetworkCalls: 10,
        maxStorageOperations: 20,
        maxDOMOperations: 50,
      },
    };

    const config = { ...defaultOptions, ...options };

    // Create secure iframe-based sandbox
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.setAttribute('sandbox', 'allow-scripts');
    document.body.appendChild(iframe);

    const sandboxWindow = iframe.contentWindow;
    if (!sandboxWindow) {
      throw new Error('Failed to create sandbox environment');
    }

    // Create secure API for the sandbox
    const secureAPI = this.createSandboxAPI(context, config);

    return {
      iframe,
      window: sandboxWindow,
      api: secureAPI,
      config,
    };
  }

  /**
   * Create secure API for plugins
   */
  private createSandboxAPI(
    context: ExecutionContext,
    options: SandboxOptions
  ): Record<string, any> {
    return {
      // Safe console implementation
      console: {
        log: (...args: any[]) => this.secureLog('log', context, args),
        warn: (...args: any[]) => this.secureLog('warn', context, args),
        error: (...args: any[]) => this.secureLog('error', context, args),
        info: (...args: any[]) => this.secureLog('info', context, args),
      },

      // Secure HTTP client
      fetch: this.createSecureFetch(context, options),

      // Secure storage API
      storage: this.createSecureStorage(context, options),

      // Plugin metadata
      plugin: {
        id: context.pluginId,
        version: context.version,
        userId: context.userId,
      },

      // Secure utility functions
      utils: {
        hash: (data: string) => this.simpleHash(data),
        uuid: () => this.generateUUID(),
        timestamp: () => Date.now(),
      },

      // Resource monitoring
      getResourceUsage: () => this.getEmptyResourceUsage(),
    };
  }

  /**
   * Execute code in sandbox with monitoring
   */
  private async executeInSandbox(
    sandbox: SandboxInstance,
    code: string,
    context: ExecutionContext,
    options: Partial<SandboxOptions>
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || 30000;

      // Set timeout for execution
      const timeoutId = setTimeout(() => {
        reject(new Error('Plugin execution timeout'));
      }, timeout);

      try {
        // Create secure execution environment
        const secureCode = this.wrapCodeForSandbox(code, sandbox.api);

        // Execute in iframe context using script injection
        const script = sandbox.iframe.contentDocument!.createElement('script');
        script.textContent = `
           try {
             const result = ${secureCode};
             window.parent.postMessage({ type: 'plugin_result', result }, '*');
           } catch (error) {
             window.parent.postMessage({ type: 'plugin_error', error: error.message }, '*');
           }
         `;

        // Set up message listener for result
        const messageHandler = (event: MessageEvent) => {
          if (event.data.type === 'plugin_result') {
            window.removeEventListener('message', messageHandler);
            clearTimeout(timeoutId);
            resolve(event.data.result);
          } else if (event.data.type === 'plugin_error') {
            window.removeEventListener('message', messageHandler);
            clearTimeout(timeoutId);
            reject(new Error(event.data.error));
          }
        };

        window.addEventListener('message', messageHandler);
        sandbox.iframe.contentDocument!.head.appendChild(script);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Wrap plugin code with security restrictions
   */
  private wrapCodeForSandbox(code: string, api: Record<string, any>): string {
    const apiKeys = Object.keys(api);
    const apiAssignments = apiKeys.map(key => `var ${key} = arguments[0].${key};`).join('\n');

    return `
      (function(secureAPI) {
        'use strict';
        
        // Disable dangerous globals
        var eval = undefined;
        var Function = undefined;
        var window = undefined;
        var document = undefined;
        var XMLHttpRequest = undefined;
        
        // Assign secure API
        ${apiAssignments}
        
        // Execute plugin code
        try {
          ${code}
        } catch (error) {
          throw new Error('Plugin execution error: ' + error.message);
        }
      })(arguments[0]);
    `;
  }

  /**
   * Secure logging with filtering
   */
  private secureLog(level: string, context: ExecutionContext, args: any[]): void {
    const filteredArgs = args.map(arg => {
      if (typeof arg === 'string') {
        // Remove potential sensitive data patterns
        return arg.replace(/(?:password|token|key|secret)=[\w\-\.]+/gi, '[REDACTED]');
      }
      return arg;
    });

    this.emit('log', {
      level,
      pluginId: context.pluginId,
      userId: context.userId,
      message: filteredArgs.join(' '),
      timestamp: new Date(),
    });
  }

  /**
   * Secure fetch implementation with permission checks
   */
  private createSecureFetch(context: ExecutionContext, options: SandboxOptions) {
    let requestCount = 0;

    return async (url: string, init?: RequestInit): Promise<Response> => {
      if (requestCount >= options.maxNetworkRequests) {
        throw new Error('Network request limit exceeded');
      }

      if (!this.isUrlAllowed(url, context.permissions)) {
        throw new Error('Network access to this URL is not permitted');
      }

      requestCount++;

      // Use the native fetch with security restrictions
      const response = await fetch(url, {
        ...init,
        // Remove timeout property as it's not standard
        mode: 'cors',
        credentials: 'same-origin',
      });

      return response;
    };
  }

  /**
   * Secure storage implementation
   */
  private createSecureStorage(context: ExecutionContext, options: SandboxOptions) {
    let operationCount = 0;

    return {
      get: async (key: string): Promise<string | null> => {
        if (operationCount >= options.resourceLimits.maxStorageOperations) {
          throw new Error('Storage operation limit exceeded');
        }

        operationCount++;

        // Implement namespaced storage access
        const namespacedKey = `plugin:${context.pluginId}:${context.userId}:${key}`;
        return localStorage.getItem(namespacedKey);
      },

      set: async (key: string, value: string): Promise<void> => {
        if (operationCount >= options.resourceLimits.maxStorageOperations) {
          throw new Error('Storage operation limit exceeded');
        }

        if (value.length > options.maxRequestSize) {
          throw new Error('Storage value too large');
        }

        operationCount++;

        // Implement namespaced storage with size limits
        const namespacedKey = `plugin:${context.pluginId}:${context.userId}:${key}`;
        localStorage.setItem(namespacedKey, value);
      },
    };
  }

  private async isPermissionAllowed(
    permission: PluginPermission,
    context: ExecutionContext
  ): Promise<boolean> {
    return context.permissions.some(
      p =>
        p.type === permission.type &&
        p.resource === permission.resource &&
        permission.action.every(action => p.action.includes(action))
    );
  }

  private isUrlAllowed(url: string, permissions: PluginPermission[]): boolean {
    const networkPermissions = permissions.filter(p => p.type === 'network');

    if (networkPermissions.length === 0) {
      return false;
    }

    return networkPermissions.some(p => {
      if (p.resource === '*') return true;
      try {
        const urlObj = new URL(url);
        return urlObj.hostname.includes(p.resource);
      } catch {
        return false;
      }
    });
  }

  private checkResourceViolations(
    usage: ResourceUsage,
    options: Partial<SandboxOptions>
  ): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    const limits = options.resourceLimits;

    if (!limits) return violations;

    if (usage.executionTime > limits.maxExecutionTime) {
      violations.push({
        type: 'resource',
        severity: 'high',
        description: `Execution time limit exceeded: ${usage.executionTime}ms > ${limits.maxExecutionTime}ms`,
        timestamp: new Date(),
      });
    }

    return violations;
  }

  private generateSandboxId(context: ExecutionContext): string {
    return `${context.pluginId}:${context.userId}:${Date.now()}`;
  }

  private cleanupSandbox(sandboxId: string): void {
    const sandbox = this.activeSandboxes.get(sandboxId);
    if (sandbox && sandbox.iframe) {
      document.body.removeChild(sandbox.iframe);
    }
    this.activeSandboxes.delete(sandboxId);
  }

  private getEmptyResourceUsage(): ResourceUsage {
    return {
      executionTime: 0,
      memoryEstimate: 0,
      networkCalls: 0,
      storageOperations: 0,
      domOperations: 0,
    };
  }

  private simpleHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

interface SandboxInstance {
  iframe: HTMLIFrameElement;
  window: Window | null;
  api: Record<string, any>;
  config: SandboxOptions;
}

/**
 * Resource monitoring for browser environment
 */
class ResourceMonitor {
  private startTime: number = 0;
  private networkCalls: number = 0;
  private storageOperations: number = 0;
  private domOperations: number = 0;

  start(): void {
    this.startTime = Date.now();
  }

  stop(): ResourceUsage {
    return {
      executionTime: Date.now() - this.startTime,
      memoryEstimate: this.estimateMemoryUsage(),
      networkCalls: this.networkCalls,
      storageOperations: this.storageOperations,
      domOperations: this.domOperations,
    };
  }

  incrementNetworkCalls(): void {
    this.networkCalls++;
  }

  incrementStorageOperations(): void {
    this.storageOperations++;
  }

  incrementDOMOperations(): void {
    this.domOperations++;
  }

  private estimateMemoryUsage(): number {
    // Rough estimation since precise memory monitoring isn't available in browsers
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }
}

/**
 * Security analyzer for static code analysis
 */
class SecurityAnalyzer {
  private dangerousPatterns = [
    { pattern: /eval\s*\(/, type: 'code_injection', severity: 'critical' as const },
    { pattern: /Function\s*\(/, type: 'code_injection', severity: 'high' as const },
    { pattern: /document\.write/, type: 'dom_injection', severity: 'high' as const },
    { pattern: /innerHTML\s*=/, type: 'dom_injection', severity: 'medium' as const },
    { pattern: /while\s*\(\s*true\s*\)/, type: 'infinite_loop', severity: 'medium' as const },
    {
      pattern: /setInterval\s*\(.*,\s*0\s*\)/,
      type: 'cpu_exhaustion',
      severity: 'medium' as const,
    },
  ];

  async analyzeCode(
    code: string
  ): Promise<{
    threats: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
    }>;
  }> {
    const threats = [];

    for (const { pattern, type, severity } of this.dangerousPatterns) {
      if (pattern.test(code)) {
        threats.push({
          type,
          severity,
          description: `Potentially dangerous pattern detected: ${type}`,
        });
      }
    }

    return { threats };
  }
}

export const pluginSandbox = new PluginSandbox();
