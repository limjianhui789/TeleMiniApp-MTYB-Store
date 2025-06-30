import { VM } from 'vm2';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';

export interface SandboxConfig {
  timeout: number;
  maxMemory: number;
  allowedModules: string[];
  blockedModules: string[];
  permissions: PluginPermission[];
  resourceLimits: ResourceLimits;
}

export interface PluginPermission {
  type: 'network' | 'file' | 'crypto' | 'storage' | 'api';
  action: string;
  resource?: string;
  conditions?: Record<string, any>;
}

export interface ResourceLimits {
  maxCpuTime: number;
  maxMemoryUsage: number;
  maxNetworkRequests: number;
  maxFileOperations: number;
  maxApiCalls: number;
}

export interface PluginExecution {
  id: string;
  pluginId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'timeout' | 'terminated';
  result?: any;
  error?: string;
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  cpuTime: number;
  memoryUsage: number;
  networkRequests: number;
  fileOperations: number;
  apiCalls: number;
}

export class PluginSandbox {
  private executions: Map<string, PluginExecution> = new Map();
  private defaultConfig: SandboxConfig = {
    timeout: 30000, // 30 seconds
    maxMemory: 128 * 1024 * 1024, // 128MB
    allowedModules: ['crypto', 'util', 'querystring', 'url'],
    blockedModules: ['fs', 'child_process', 'cluster', 'dgram', 'dns', 'http', 'https', 'net', 'os', 'process', 'vm'],
    permissions: [],
    resourceLimits: {
      maxCpuTime: 10000, // 10 seconds
      maxMemoryUsage: 64 * 1024 * 1024, // 64MB
      maxNetworkRequests: 100,
      maxFileOperations: 50,
      maxApiCalls: 200
    }
  };

  async executePlugin(
    pluginCode: string,
    pluginId: string,
    userId: string,
    permissions: PluginPermission[] = [],
    config?: Partial<SandboxConfig>
  ): Promise<PluginExecution> {
    const executionId = crypto.randomUUID();
    const sandboxConfig = { ...this.defaultConfig, ...config, permissions };
    
    const execution: PluginExecution = {
      id: executionId,
      pluginId,
      userId,
      startTime: new Date(),
      status: 'running',
      resourceUsage: {
        cpuTime: 0,
        memoryUsage: 0,
        networkRequests: 0,
        fileOperations: 0,
        apiCalls: 0
      }
    };

    this.executions.set(executionId, execution);

    try {
      // Validate plugin code
      await this.validatePluginCode(pluginCode);
      
      // Create secure sandbox environment
      const vm = this.createSecureVM(sandboxConfig, execution);
      
      // Execute plugin with monitoring
      const result = await this.runWithResourceMonitoring(
        vm,
        pluginCode,
        execution,
        sandboxConfig
      );

      execution.result = result;
      execution.status = 'completed';
      execution.endTime = new Date();

    } catch (error) {
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.status = error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'failed';
      execution.endTime = new Date();
    }

    return execution;
  }

  async validatePluginCode(code: string): Promise<void> {
    // Static analysis for malicious patterns
    const dangerousPatterns = [
      /require\s*\(\s*['"`]child_process['"`]\s*\)/,
      /require\s*\(\s*['"`]fs['"`]\s*\)/,
      /require\s*\(\s*['"`]vm['"`]\s*\)/,
      /process\s*\.\s*exit/,
      /process\s*\.\s*kill/,
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /global\s*\./,
      /__dirname/,
      /__filename/,
      /Buffer\s*\./,
      /console\s*\.\s*log/
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        throw new Error(`Potentially dangerous code pattern detected: ${pattern.source}`);
      }
    }

    // Check for excessive complexity
    if (code.length > 100000) {
      throw new Error('Plugin code exceeds maximum size limit');
    }

    // Check for infinite loops (basic detection)
    const loopPatterns = [
      /while\s*\(\s*true\s*\)/,
      /for\s*\(\s*;\s*;\s*\)/,
      /while\s*\(\s*1\s*\)/
    ];

    for (const pattern of loopPatterns) {
      if (pattern.test(code)) {
        throw new Error('Potential infinite loop detected');
      }
    }
  }

  private createSecureVM(config: SandboxConfig, execution: PluginExecution): VM {
    const vm = new VM({
      timeout: config.timeout,
      sandbox: this.createSandboxContext(config, execution),
      require: {
        external: config.allowedModules,
        mock: this.createModuleMocks(config, execution)
      },
      eval: false,
      wasm: false
    });

    return vm;
  }

  private createSandboxContext(config: SandboxConfig, execution: PluginExecution): any {
    return {
      // Safe globals
      console: this.createSecureConsole(execution),
      setTimeout: this.createSecureTimeout(execution),
      setInterval: this.createSecureInterval(execution),
      clearTimeout: (id: any) => clearTimeout(id),
      clearInterval: (id: any) => clearInterval(id),
      
      // Plugin API
      PluginAPI: this.createPluginAPI(config, execution),
      
      // Crypto utilities (limited)
      crypto: {
        randomUUID: crypto.randomUUID,
        createHash: (algorithm: string) => {
          if (!['sha256', 'sha512', 'md5'].includes(algorithm)) {
            throw new Error(`Hash algorithm ${algorithm} not allowed`);
          }
          return crypto.createHash(algorithm);
        }
      },

      // JSON utilities
      JSON: {
        parse: JSON.parse,
        stringify: JSON.stringify
      },

      // Date utilities
      Date: Date,
      Math: Math,
      
      // Array and Object methods
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      RegExp: RegExp
    };
  }

  private createModuleMocks(config: SandboxConfig, execution: PluginExecution): Record<string, any> {
    const mocks: Record<string, any> = {};

    // Mock blocked modules to prevent access
    for (const module of config.blockedModules) {
      mocks[module] = () => {
        throw new Error(`Module '${module}' is not allowed in sandbox`);
      };
    }

    // Provide limited HTTP client
    mocks['http-client'] = {
      request: this.createSecureHttpClient(config, execution)
    };

    return mocks;
  }

  private createSecureConsole(execution: PluginExecution): any {
    return {
      log: (...args: any[]) => {
        // Log to execution context instead of global console
        if (!execution.result) {
          execution.result = { logs: [] };
        }
        if (!execution.result.logs) {
          execution.result.logs = [];
        }
        execution.result.logs.push(args.join(' '));
      },
      error: (...args: any[]) => {
        if (!execution.result) {
          execution.result = { errors: [] };
        }
        if (!execution.result.errors) {
          execution.result.errors = [];
        }
        execution.result.errors.push(args.join(' '));
      }
    };
  }

  private createSecureTimeout(execution: PluginExecution): any {
    return (callback: Function, delay: number) => {
      if (delay > 10000) {
        throw new Error('Timeout delay cannot exceed 10 seconds');
      }
      
      execution.resourceUsage.cpuTime += delay;
      
      if (execution.resourceUsage.cpuTime > this.defaultConfig.resourceLimits.maxCpuTime) {
        throw new Error('CPU time limit exceeded');
      }
      
      return setTimeout(callback, delay);
    };
  }

  private createSecureInterval(execution: PluginExecution): any {
    return (callback: Function, delay: number) => {
      if (delay < 1000) {
        throw new Error('Interval delay cannot be less than 1 second');
      }
      if (delay > 60000) {
        throw new Error('Interval delay cannot exceed 60 seconds');
      }
      
      return setInterval(callback, delay);
    };
  }

  private createPluginAPI(config: SandboxConfig, execution: PluginExecution): any {
    return {
      // Storage API
      storage: {
        get: async (key: string) => {
          this.checkPermission(config.permissions, 'storage', 'read', key);
          execution.resourceUsage.apiCalls++;
          return this.getStorageValue(execution.pluginId, key);
        },
        set: async (key: string, value: any) => {
          this.checkPermission(config.permissions, 'storage', 'write', key);
          execution.resourceUsage.apiCalls++;
          return this.setStorageValue(execution.pluginId, key, value);
        },
        delete: async (key: string) => {
          this.checkPermission(config.permissions, 'storage', 'delete', key);
          execution.resourceUsage.apiCalls++;
          return this.deleteStorageValue(execution.pluginId, key);
        }
      },

      // Network API
      network: {
        fetch: async (url: string, options?: any) => {
          this.checkPermission(config.permissions, 'network', 'request', url);
          execution.resourceUsage.networkRequests++;
          
          if (execution.resourceUsage.networkRequests > config.resourceLimits.maxNetworkRequests) {
            throw new Error('Network request limit exceeded');
          }
          
          return this.secureNetworkRequest(url, options);
        }
      },

      // User API
      user: {
        getCurrentUser: async () => {
          this.checkPermission(config.permissions, 'api', 'user.read');
          execution.resourceUsage.apiCalls++;
          return this.getCurrentUser(execution.userId);
        }
      },

      // Platform API
      platform: {
        log: (level: string, message: string) => {
          this.checkPermission(config.permissions, 'api', 'platform.log');
          execution.resourceUsage.apiCalls++;
          this.logPluginMessage(execution.pluginId, level, message);
        },
        notify: async (message: string) => {
          this.checkPermission(config.permissions, 'api', 'platform.notify');
          execution.resourceUsage.apiCalls++;
          return this.sendNotification(execution.userId, message);
        }
      }
    };
  }

  private checkPermission(permissions: PluginPermission[], type: string, action: string, resource?: string): void {
    const hasPermission = permissions.some(permission => 
      permission.type === type && 
      permission.action === action &&
      (!resource || !permission.resource || permission.resource === resource)
    );

    if (!hasPermission) {
      throw new Error(`Permission denied: ${type}.${action}${resource ? ` on ${resource}` : ''}`);
    }
  }

  private async runWithResourceMonitoring(
    vm: VM,
    code: string,
    execution: PluginExecution,
    config: SandboxConfig
  ): Promise<any> {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    // Monitor memory usage
    const memoryMonitor = setInterval(() => {
      const currentMemory = process.memoryUsage().heapUsed;
      execution.resourceUsage.memoryUsage = Math.max(
        execution.resourceUsage.memoryUsage,
        currentMemory - startMemory
      );

      if (execution.resourceUsage.memoryUsage > config.resourceLimits.maxMemoryUsage) {
        clearInterval(memoryMonitor);
        throw new Error('Memory usage limit exceeded');
      }
    }, 100);

    try {
      const result = await Promise.race([
        vm.run(code),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Plugin execution timeout')), config.timeout)
        )
      ]);

      return result;
    } finally {
      clearInterval(memoryMonitor);
      execution.resourceUsage.cpuTime = Date.now() - startTime;
    }
  }

  // Mock implementations for sandbox APIs
  private async getStorageValue(pluginId: string, key: string): Promise<any> {
    // In a real implementation, this would interact with a secure storage system
    return null;
  }

  private async setStorageValue(pluginId: string, key: string, value: any): Promise<void> {
    // In a real implementation, this would store data securely
  }

  private async deleteStorageValue(pluginId: string, key: string): Promise<void> {
    // In a real implementation, this would delete data securely
  }

  private async secureNetworkRequest(url: string, options?: any): Promise<any> {
    // Validate URL
    const allowedDomains = ['api.example.com', 'safe-api.com'];
    const urlObj = new URL(url);
    
    if (!allowedDomains.some(domain => urlObj.hostname.endsWith(domain))) {
      throw new Error(`Network requests to ${urlObj.hostname} are not allowed`);
    }

    // In a real implementation, make the actual request with proper security
    return { data: 'mock response' };
  }

  private async getCurrentUser(userId: string): Promise<any> {
    // Return limited user information
    return {
      id: userId,
      // Only expose necessary user data
    };
  }

  private logPluginMessage(pluginId: string, level: string, message: string): void {
    console.log(`[Plugin ${pluginId}] [${level}] ${message}`);
  }

  private async sendNotification(userId: string, message: string): Promise<void> {
    // In a real implementation, send notification to user
    console.log(`Notification to ${userId}: ${message}`);
  }

  // Public methods for execution management
  getExecution(executionId: string): PluginExecution | undefined {
    return this.executions.get(executionId);
  }

  terminateExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'running') {
      return false;
    }

    execution.status = 'terminated';
    execution.endTime = new Date();
    return true;
  }

  getActiveExecutions(): PluginExecution[] {
    return Array.from(this.executions.values()).filter(e => e.status === 'running');
  }

  getExecutionStats(pluginId?: string): any {
    const executions = Array.from(this.executions.values());
    const filtered = pluginId ? executions.filter(e => e.pluginId === pluginId) : executions;

    return {
      total: filtered.length,
      completed: filtered.filter(e => e.status === 'completed').length,
      failed: filtered.filter(e => e.status === 'failed').length,
      timeout: filtered.filter(e => e.status === 'timeout').length,
      terminated: filtered.filter(e => e.status === 'terminated').length,
      averageExecutionTime: this.calculateAverageExecutionTime(filtered),
      totalResourceUsage: this.calculateTotalResourceUsage(filtered)
    };
  }

  private calculateAverageExecutionTime(executions: PluginExecution[]): number {
    const completed = executions.filter(e => e.endTime);
    if (completed.length === 0) return 0;

    const total = completed.reduce((sum, e) => 
      sum + (e.endTime!.getTime() - e.startTime.getTime()), 0);
    return total / completed.length;
  }

  private calculateTotalResourceUsage(executions: PluginExecution[]): ResourceUsage {
    return executions.reduce((total, e) => ({
      cpuTime: total.cpuTime + e.resourceUsage.cpuTime,
      memoryUsage: total.memoryUsage + e.resourceUsage.memoryUsage,
      networkRequests: total.networkRequests + e.resourceUsage.networkRequests,
      fileOperations: total.fileOperations + e.resourceUsage.fileOperations,
      apiCalls: total.apiCalls + e.resourceUsage.apiCalls
    }), {
      cpuTime: 0,
      memoryUsage: 0,
      networkRequests: 0,
      fileOperations: 0,
      apiCalls: 0
    });
  }

  // Cleanup old executions
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge);
    
    for (const [id, execution] of this.executions.entries()) {
      if (execution.startTime < cutoff && execution.status !== 'running') {
        this.executions.delete(id);
      }
    }
  }
}

export const pluginSandbox = new PluginSandbox();