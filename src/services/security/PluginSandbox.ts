// Browser-compatible Plugin Sandbox using iframes and Web Workers
export interface SandboxConfig {
  timeout: number;
  maxMemory: number;
  allowedOrigins: string[];
  blockedAPIs: string[];
  permissions: PluginPermission[];
  resourceLimits: ResourceLimits;
}

export interface PluginPermission {
  type: 'network' | 'storage' | 'api' | 'dom';
  action: string;
  resource?: string;
  conditions?: Record<string, any>;
}

export interface ResourceLimits {
  maxExecutionTime: number;
  maxMemoryUsage: number;
  maxNetworkRequests: number;
  maxStorageOperations: number;
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
  executionTime: number;
  memoryUsage: number;
  networkRequests: number;
  storageOperations: number;
  apiCalls: number;
}

export class PluginSandbox {
  private executions: Map<string, PluginExecution> = new Map();
  private sandboxFrame?: HTMLIFrameElement;
  private workers: Map<string, Worker> = new Map();
  private defaultConfig: SandboxConfig = {
    timeout: 30000, // 30 seconds
    maxMemory: 128 * 1024 * 1024, // 128MB estimate
    allowedOrigins: ['https://api.mtyb.shop'],
    blockedAPIs: [
      'document.cookie',
      'localStorage',
      'sessionStorage',
      'indexedDB',
      'navigator.geolocation',
      'navigator.camera',
      'navigator.microphone',
    ],
    permissions: [],
    resourceLimits: {
      maxExecutionTime: 10000, // 10 seconds
      maxMemoryUsage: 64 * 1024 * 1024, // 64MB estimate
      maxNetworkRequests: 100,
      maxStorageOperations: 50,
      maxApiCalls: 200,
    },
  };

  constructor() {
    this.initializeSandbox();
  }

  private initializeSandbox(): void {
    // Create a sandboxed iframe for plugin execution
    this.sandboxFrame = document.createElement('iframe');
    this.sandboxFrame.style.display = 'none';
    this.sandboxFrame.setAttribute('sandbox', 'allow-scripts'); // Minimal permissions
    this.sandboxFrame.src = 'about:blank';
    document.body.appendChild(this.sandboxFrame);
  }

  async executePlugin(
    pluginCode: string,
    pluginId: string,
    userId: string,
    permissions: PluginPermission[] = [],
    config?: Partial<SandboxConfig>
  ): Promise<PluginExecution> {
    const executionId = this.generateExecutionId();
    const sandboxConfig = { ...this.defaultConfig, ...config, permissions };

    const execution: PluginExecution = {
      id: executionId,
      pluginId,
      userId,
      startTime: new Date(),
      status: 'running',
      resourceUsage: {
        executionTime: 0,
        memoryUsage: 0,
        networkRequests: 0,
        storageOperations: 0,
        apiCalls: 0,
      },
    };

    this.executions.set(executionId, execution);

    try {
      // Validate plugin code
      await this.validatePluginCode(pluginCode);

      // Execute plugin in isolated environment
      const result = await this.runInSandbox(pluginCode, execution, sandboxConfig);

      execution.result = result;
      execution.status = 'completed';
      execution.endTime = new Date();
    } catch (error) {
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.status =
        error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'failed';
      execution.endTime = new Date();
    }

    return execution;
  }

  private generateExecutionId(): string {
    return crypto.randomUUID();
  }

  async validatePluginCode(code: string): Promise<void> {
    // Static analysis for malicious patterns
    const dangerousPatterns = [
      /document\.cookie/gi,
      /localStorage/gi,
      /sessionStorage/gi,
      /indexedDB/gi,
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /window\.location/gi,
      /document\.location/gi,
      /history\.pushState/gi,
      /history\.replaceState/gi,
      /navigator\.geolocation/gi,
      /XMLHttpRequest/gi,
      /fetch\s*\(/gi,
      /__proto__/gi,
      /constructor\.constructor/gi,
      /import\s*\(/gi,
      /new\s+Worker/gi,
      /new\s+SharedWorker/gi,
      /new\s+ServiceWorker/gi,
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
    const loopPatterns = [/while\s*\(\s*true\s*\)/, /for\s*\(\s*;\s*;\s*\)/, /while\s*\(\s*1\s*\)/];

    for (const pattern of loopPatterns) {
      if (pattern.test(code)) {
        throw new Error('Potential infinite loop detected');
      }
    }
  }

  private async runInSandbox(
    code: string,
    execution: PluginExecution,
    config: SandboxConfig
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Create secure execution context
      const secureCode = this.wrapPluginCode(code, execution, config);
      
      // Execute with timeout
      const timeoutId = setTimeout(() => {
        execution.resourceUsage.executionTime = Date.now() - startTime;
        reject(new Error('Plugin execution timeout'));
      }, config.timeout);

      try {
        // Create isolated execution environment
        const worker = this.createSecureWorker(secureCode, execution, config);
        this.workers.set(execution.id, worker);

        worker.onmessage = (event) => {
          clearTimeout(timeoutId);
          execution.resourceUsage.executionTime = Date.now() - startTime;
          
          if (event.data.type === 'result') {
            resolve(event.data.result);
          } else if (event.data.type === 'error') {
            reject(new Error(event.data.error));
          } else if (event.data.type === 'resourceUpdate') {
            // Update resource usage
            Object.assign(execution.resourceUsage, event.data.usage);
          }
        };

        worker.onerror = (error) => {
          clearTimeout(timeoutId);
          execution.resourceUsage.executionTime = Date.now() - startTime;
          reject(new Error(`Worker error: ${error.message}`));
        };

      } catch (error) {
        clearTimeout(timeoutId);
        execution.resourceUsage.executionTime = Date.now() - startTime;
        reject(error);
      }
    });
  }

  private wrapPluginCode(
    code: string,
    execution: PluginExecution,
    config: SandboxConfig
  ): string {
    return `
      // Secure sandbox environment
      const PluginAPI = ${JSON.stringify(this.createPluginAPIDefinition(config, execution))};
      const secureConsole = {
        log: (...args) => self.postMessage({
          type: 'resourceUpdate',
          usage: { apiCalls: (self.resourceUsage?.apiCalls || 0) + 1 }
        }),
        error: (...args) => self.postMessage({
          type: 'resourceUpdate', 
          usage: { apiCalls: (self.resourceUsage?.apiCalls || 0) + 1 }
        })
      };
      
      // Initialize resource tracking
      self.resourceUsage = {
        executionTime: 0,
        memoryUsage: 0,
        networkRequests: 0,
        storageOperations: 0,
        apiCalls: 0
      };
      
      // Override global objects
      const console = secureConsole;
      
      // Disable dangerous APIs
      const eval = undefined;
      const Function = undefined;
      const XMLHttpRequest = undefined;
      const fetch = undefined;
      
      try {
        // User plugin code
        const result = (function() {
          ${code}
        })();
        
        self.postMessage({ type: 'result', result });
      } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
      }
    `;
  }

  private createSecureWorker(
    code: string,
    execution: PluginExecution,
    config: SandboxConfig
  ): Worker {
    const blob = new Blob([code], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    
    // Monitor worker resource usage
    const resourceMonitor = setInterval(() => {
      // Basic resource monitoring (limited in browsers)
      const currentTime = Date.now() - execution.startTime.getTime();
      execution.resourceUsage.executionTime = currentTime;
      
      // Check limits
      if (currentTime > config.resourceLimits.maxExecutionTime) {
        worker.terminate();
        clearInterval(resourceMonitor);
      }
    }, 100);

    // Cleanup on worker completion
    worker.addEventListener('message', () => {
      clearInterval(resourceMonitor);
    });

    worker.addEventListener('error', () => {
      clearInterval(resourceMonitor);
    });

    return worker;
  }

  private createPluginAPIDefinition(config: SandboxConfig, execution: PluginExecution): any {
    return {
      // Storage API (simulated)
      storage: {
        get: `async function(key) {
          self.resourceUsage.storageOperations++;
          self.resourceUsage.apiCalls++;
          // Simulated storage access
          return null;
        }`,
        set: `async function(key, value) {
          self.resourceUsage.storageOperations++;
          self.resourceUsage.apiCalls++;
          // Simulated storage write
          return true;
        }`,
        delete: `async function(key) {
          self.resourceUsage.storageOperations++;
          self.resourceUsage.apiCalls++;
          // Simulated storage delete
          return true;
        }`,
      },

      // Limited network API
      network: {
        request: `async function(url, options) {
          self.resourceUsage.networkRequests++;
          self.resourceUsage.apiCalls++;
          
          // Check resource limits
          if (self.resourceUsage.networkRequests > ${config.resourceLimits.maxNetworkRequests}) {
            throw new Error('Network request limit exceeded');
          }
          
          // Validate allowed origins
          const allowedOrigins = ${JSON.stringify(config.allowedOrigins)};
          const urlObj = new URL(url);
          if (!allowedOrigins.some(origin => urlObj.origin === origin)) {
            throw new Error('Request to unauthorized origin: ' + urlObj.origin);
          }
          
          // Return mock response for security
          return { data: 'mock response' };
        }`,
      },

      // User API
      user: {
        getCurrentUser: `async function() {
          self.resourceUsage.apiCalls++;
          return { id: '${execution.userId}' };
        }`,
      },

      // Platform API
      platform: {
        log: `function(level, message) {
          self.resourceUsage.apiCalls++;
          console.log('[Plugin ${execution.pluginId}] [' + level + '] ' + message);
        }`,
        notify: `async function(message) {
          self.resourceUsage.apiCalls++;
          console.log('Notification: ' + message);
          return true;
        }`,
      },
    };
  }

  private checkPermission(
    permissions: PluginPermission[],
    type: string,
    action: string,
    resource?: string
  ): void {
    const hasPermission = permissions.some(
      permission =>
        permission.type === type &&
        permission.action === action &&
        (!resource || !permission.resource || permission.resource === resource)
    );

    if (!hasPermission) {
      throw new Error(`Permission denied: ${type}.${action}${resource ? ` on ${resource}` : ''}`);
    }
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

    const worker = this.workers.get(executionId);
    if (worker) {
      worker.terminate();
      this.workers.delete(executionId);
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
      totalResourceUsage: this.calculateTotalResourceUsage(filtered),
    };
  }

  private calculateAverageExecutionTime(executions: PluginExecution[]): number {
    const completed = executions.filter(e => e.endTime);
    if (completed.length === 0) return 0;

    const total = completed.reduce((sum, e) => {
      return sum + (e.endTime!.getTime() - e.startTime.getTime());
    }, 0);

    return total / completed.length;
  }

  private calculateTotalResourceUsage(executions: PluginExecution[]): ResourceUsage {
    return executions.reduce(
      (total, e) => ({
        executionTime: total.executionTime + e.resourceUsage.executionTime,
        memoryUsage: total.memoryUsage + e.resourceUsage.memoryUsage,
        networkRequests: total.networkRequests + e.resourceUsage.networkRequests,
        storageOperations: total.storageOperations + e.resourceUsage.storageOperations,
        apiCalls: total.apiCalls + e.resourceUsage.apiCalls,
      }),
      {
        executionTime: 0,
        memoryUsage: 0,
        networkRequests: 0,
        storageOperations: 0,
        apiCalls: 0,
      }
    );
  }

  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [id, execution] of this.executions) {
      if (execution.endTime && now - execution.endTime.getTime() > maxAge) {
        toDelete.push(id);
        
        // Clean up any remaining workers
        const worker = this.workers.get(id);
        if (worker) {
          worker.terminate();
          this.workers.delete(id);
        }
      }
    }

    toDelete.forEach(id => this.executions.delete(id));
  }

  destroy(): void {
    // Terminate all active workers
    for (const [id, worker] of this.workers) {
      worker.terminate();
    }
    this.workers.clear();
    
    // Remove sandbox frame
    if (this.sandboxFrame && this.sandboxFrame.parentNode) {
      this.sandboxFrame.parentNode.removeChild(this.sandboxFrame);
    }
    
    // Clear executions
    this.executions.clear();
  }
}
