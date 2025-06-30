// ============================================================================
// MTYB Plugin SDK - Core Implementation
// ============================================================================

import {
  PluginContext,
  PluginAPI,
  PluginConfig,
  PluginRuntime,
  PluginPermission,
  PluginLifecycleEvent,
  PluginLifecycleHandler,
  PluginEvent,
  PluginEventHandler,
  PluginError,
  PermissionError,
  StorageAPI,
  UIApi,
  NetworkAPI,
  SystemAPI,
  CryptoAPI,
  AnalyticsAPI,
  Plugin,
} from './types';

// SDK Version
export const SDK_VERSION = '1.0.0';

// Plugin Registry
class PluginRegistry {
  private plugins = new Map<string, Plugin>();
  private contexts = new Map<string, PluginContext>();
  private lifecycleHandlers = new Map<string, PluginLifecycleHandler>();
  private eventHandlers = new Map<string, PluginEventHandler[]>();

  register(id: string, plugin: Plugin, context: PluginContext): void {
    this.plugins.set(id, plugin);
    this.contexts.set(id, context);
  }

  unregister(id: string): void {
    this.plugins.delete(id);
    this.contexts.delete(id);
    this.lifecycleHandlers.delete(id);
    this.eventHandlers.delete(id);
  }

  get(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  getContext(id: string): PluginContext | undefined {
    return this.contexts.get(id);
  }

  setLifecycleHandler(id: string, handler: PluginLifecycleHandler): void {
    this.lifecycleHandlers.set(id, handler);
  }

  addEventHandler(id: string, handler: PluginEventHandler): void {
    const handlers = this.eventHandlers.get(id) || [];
    handlers.push(handler);
    this.eventHandlers.set(id, handlers);
  }

  removeEventHandler(id: string, handler: PluginEventHandler): void {
    const handlers = this.eventHandlers.get(id) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.eventHandlers.set(id, handlers);
    }
  }

  async fireLifecycleEvent(id: string, event: PluginLifecycleEvent, data?: any): Promise<void> {
    const handler = this.lifecycleHandlers.get(id);
    const context = this.contexts.get(id);

    if (handler && context) {
      await handler(context, event, data);
    }
  }

  async fireEvent(event: PluginEvent): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [id, handlers] of this.eventHandlers) {
      for (const handler of handlers) {
        promises.push(
          Promise.resolve(handler(event)).catch(error => {
            console.error(`Plugin ${id} event handler error:`, error);
          })
        );
      }
    }

    await Promise.allSettled(promises);
  }

  list(): string[] {
    return Array.from(this.plugins.keys());
  }
}

// Global plugin registry
export const pluginRegistry = new PluginRegistry();

// Permission Manager
class PermissionManager {
  private permissions = new Map<string, Set<PluginPermission>>();

  setPermissions(pluginId: string, permissions: PluginPermission[]): void {
    this.permissions.set(pluginId, new Set(permissions));
  }

  hasPermission(pluginId: string, permission: PluginPermission): boolean {
    const pluginPermissions = this.permissions.get(pluginId);
    return pluginPermissions?.has(permission) || false;
  }

  checkPermission(pluginId: string, permission: PluginPermission): void {
    if (!this.hasPermission(pluginId, permission)) {
      throw new PermissionError(permission);
    }
  }

  removePermissions(pluginId: string): void {
    this.permissions.delete(pluginId);
  }
}

export const permissionManager = new PermissionManager();

// Storage API Implementation
class StorageAPIImpl implements StorageAPI {
  constructor(private pluginId: string) {}

  private getKey(key: string): string {
    return `plugin:${this.pluginId}:${key}`;
  }

  async get(key: string): Promise<any> {
    permissionManager.checkPermission(this.pluginId, 'storage.read');

    try {
      const item = localStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : null;
    } catch (error) {
      throw new PluginError('Failed to read from storage', 'STORAGE_READ_ERROR', { key, error });
    }
  }

  async set(key: string, value: any): Promise<void> {
    permissionManager.checkPermission(this.pluginId, 'storage.write');

    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      throw new PluginError('Failed to write to storage', 'STORAGE_WRITE_ERROR', {
        key,
        value,
        error,
      });
    }
  }

  async remove(key: string): Promise<void> {
    permissionManager.checkPermission(this.pluginId, 'storage.write');

    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      throw new PluginError('Failed to remove from storage', 'STORAGE_REMOVE_ERROR', {
        key,
        error,
      });
    }
  }

  async clear(): Promise<void> {
    permissionManager.checkPermission(this.pluginId, 'storage.write');

    try {
      const prefix = `plugin:${this.pluginId}:`;
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      throw new PluginError('Failed to clear storage', 'STORAGE_CLEAR_ERROR', { error });
    }
  }

  async keys(): Promise<string[]> {
    permissionManager.checkPermission(this.pluginId, 'storage.read');

    try {
      const prefix = `plugin:${this.pluginId}:`;
      const keys: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          keys.push(key.substring(prefix.length));
        }
      }

      return keys;
    } catch (error) {
      throw new PluginError('Failed to get storage keys', 'STORAGE_KEYS_ERROR', { error });
    }
  }

  async has(key: string): Promise<boolean> {
    permissionManager.checkPermission(this.pluginId, 'storage.read');

    try {
      return localStorage.getItem(this.getKey(key)) !== null;
    } catch (error) {
      throw new PluginError('Failed to check storage key', 'STORAGE_HAS_ERROR', { key, error });
    }
  }

  async size(): Promise<number> {
    permissionManager.checkPermission(this.pluginId, 'storage.read');

    try {
      const keys = await this.keys();
      return keys.length;
    } catch (error) {
      throw new PluginError('Failed to get storage size', 'STORAGE_SIZE_ERROR', { error });
    }
  }
}

// UI API Implementation (simplified)
class UIApiImpl implements UIApi {
  constructor(private pluginId: string) {}

  showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    permissionManager.checkPermission(this.pluginId, 'ui.toast');

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `plugin-toast plugin-toast--${type}`;
    toast.textContent = message;

    // Style toast
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 16px',
      borderRadius: '8px',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      zIndex: '10000',
      maxWidth: '300px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      animation: 'slideInRight 0.3s ease-out',
    });

    // Set background color based on type
    const colors = {
      info: '#007bff',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
    };
    toast.style.backgroundColor = colors[type];

    // Add to DOM
    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  async showModal(options: any): Promise<any> {
    permissionManager.checkPermission(this.pluginId, 'ui.modal');

    return new Promise(resolve => {
      // Simple modal implementation
      const modal = document.createElement('div');
      modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10001; display: flex; align-items: center; justify-content: center;">
          <div style="background: white; padding: 24px; border-radius: 8px; max-width: 400px; width: 90%;">
            <h3 style="margin: 0 0 16px 0;">${options.title}</h3>
            <p style="margin: 0 0 20px 0;">${options.content}</p>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button class="cancel-btn" style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
              <button class="ok-btn" style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">OK</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const cleanup = () => {
        if (modal.parentNode) {
          document.body.removeChild(modal);
        }
      };

      modal.querySelector('.cancel-btn')?.addEventListener('click', () => {
        cleanup();
        resolve({ action: 'cancel' });
      });

      modal.querySelector('.ok-btn')?.addEventListener('click', () => {
        cleanup();
        resolve({ action: 'ok' });
      });
    });
  }

  async showNotification(options: any): Promise<void> {
    permissionManager.checkPermission(this.pluginId, 'ui.notifications');

    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(options.title, {
          body: options.body,
          icon: options.icon,
        });
      }
    }
  }

  createComponent(type: any, props: any): any {
    // Simplified component creation
    const element = document.createElement('div');
    element.className = `plugin-component plugin-component--${type}`;
    return {
      type,
      id: `component-${Date.now()}`,
      props,
      render: () => element,
      update: (newProps: any) => Object.assign(props, newProps),
      destroy: () => element.remove(),
      on: (event: string, handler: Function) =>
        element.addEventListener(event, handler as EventListener),
      off: (event: string, handler?: Function) =>
        element.removeEventListener(event, handler as EventListener),
    };
  }

  navigate(path: string, options?: any): void {
    if (window.history) {
      if (options?.replace) {
        window.history.replaceState(null, '', path);
      } else {
        window.history.pushState(null, '', path);
      }
    }
  }

  setTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// Network API Implementation (simplified)
class NetworkAPIImpl implements NetworkAPI {
  constructor(private pluginId: string) {}

  http = {
    async get(url: string, options: any = {}): Promise<any> {
      permissionManager.checkPermission(this.pluginId, 'network.http');
      return this.request('GET', url, undefined, options);
    },

    async post(url: string, data?: any, options: any = {}): Promise<any> {
      permissionManager.checkPermission(this.pluginId, 'network.http');
      return this.request('POST', url, data, options);
    },

    async put(url: string, data?: any, options: any = {}): Promise<any> {
      permissionManager.checkPermission(this.pluginId, 'network.http');
      return this.request('PUT', url, data, options);
    },

    async delete(url: string, options: any = {}): Promise<any> {
      permissionManager.checkPermission(this.pluginId, 'network.http');
      return this.request('DELETE', url, undefined, options);
    },

    async patch(url: string, data?: any, options: any = {}): Promise<any> {
      permissionManager.checkPermission(this.pluginId, 'network.http');
      return this.request('PATCH', url, data, options);
    },
  };

  private async request(method: string, url: string, data?: any, options: any = {}): Promise<any> {
    try {
      const config: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: options.credentials || 'same-origin',
      };

      if (data) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(url, config);

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok,
        json: () => response.json(),
        text: () => response.text(),
        blob: () => response.blob(),
        arrayBuffer: () => response.arrayBuffer(),
      };
    } catch (error) {
      throw new PluginError('Network request failed', 'NETWORK_ERROR', { method, url, error });
    }
  }

  websocket = {
    async connect(url: string, protocols?: string[]): Promise<any> {
      permissionManager.checkPermission(this.pluginId, 'network.websocket');

      return new Promise((resolve, reject) => {
        try {
          const ws = new WebSocket(url, protocols);
          const handlers = new Map<string, Function[]>();

          const connection = {
            url,
            get readyState() {
              return ws.readyState;
            },
            send: (data: string | ArrayBuffer | Blob) => ws.send(data),
            close: (code?: number, reason?: string) => ws.close(code, reason),
            on: (event: string, handler: Function) => {
              const eventHandlers = handlers.get(event) || [];
              eventHandlers.push(handler);
              handlers.set(event, eventHandlers);
            },
            off: (event: string, handler?: Function) => {
              const eventHandlers = handlers.get(event) || [];
              if (handler) {
                const index = eventHandlers.indexOf(handler);
                if (index > -1) {
                  eventHandlers.splice(index, 1);
                }
              } else {
                handlers.delete(event);
              }
            },
          };

          ws.onopen = () => {
            handlers.get('open')?.forEach(h => h());
            resolve(connection);
          };

          ws.onmessage = event => {
            handlers.get('message')?.forEach(h => h(event));
          };

          ws.onerror = error => {
            handlers.get('error')?.forEach(h => h(error));
            reject(error);
          };

          ws.onclose = event => {
            handlers.get('close')?.forEach(h => h(event));
          };
        } catch (error) {
          reject(error);
        }
      });
    },
  };
}

// System API Implementation (simplified)
class SystemAPIImpl implements SystemAPI {
  constructor(private pluginId: string) {}

  clipboard = {
    async read(): Promise<string> {
      permissionManager.checkPermission(this.pluginId, 'system.clipboard');

      if ('clipboard' in navigator) {
        return await navigator.clipboard.readText();
      }
      throw new PluginError('Clipboard API not available', 'CLIPBOARD_UNAVAILABLE');
    },

    async write(text: string): Promise<void> {
      permissionManager.checkPermission(this.pluginId, 'system.clipboard');

      if ('clipboard' in navigator) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new PluginError('Clipboard API not available', 'CLIPBOARD_UNAVAILABLE');
      }
    },

    async readImage(): Promise<Blob | null> {
      permissionManager.checkPermission(this.pluginId, 'system.clipboard');

      if ('clipboard' in navigator) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              return await item.getType(type);
            }
          }
        }
      }
      return null;
    },

    async writeImage(image: Blob): Promise<void> {
      permissionManager.checkPermission(this.pluginId, 'system.clipboard');

      if ('clipboard' in navigator) {
        await navigator.clipboard.write([new ClipboardItem({ [image.type]: image })]);
      } else {
        throw new PluginError('Clipboard API not available', 'CLIPBOARD_UNAVAILABLE');
      }
    },
  };

  files = {
    async read(path: string): Promise<Blob> {
      permissionManager.checkPermission(this.pluginId, 'system.files');
      throw new PluginError(
        'File system access not implemented in web environment',
        'FILES_UNAVAILABLE'
      );
    },

    async write(path: string, data: Blob | string): Promise<void> {
      permissionManager.checkPermission(this.pluginId, 'system.files');
      throw new PluginError(
        'File system access not implemented in web environment',
        'FILES_UNAVAILABLE'
      );
    },

    async exists(path: string): Promise<boolean> {
      permissionManager.checkPermission(this.pluginId, 'system.files');
      return false;
    },

    async list(path: string): Promise<any[]> {
      permissionManager.checkPermission(this.pluginId, 'system.files');
      return [];
    },

    async delete(path: string): Promise<void> {
      permissionManager.checkPermission(this.pluginId, 'system.files');
      throw new PluginError(
        'File system access not implemented in web environment',
        'FILES_UNAVAILABLE'
      );
    },

    async createDirectory(path: string): Promise<void> {
      permissionManager.checkPermission(this.pluginId, 'system.files');
      throw new PluginError(
        'File system access not implemented in web environment',
        'FILES_UNAVAILABLE'
      );
    },
  };

  device = {
    async getInfo(): Promise<any> {
      return {
        platform: navigator.platform,
        version: navigator.appVersion,
        model: 'Unknown',
        manufacturer: 'Unknown',
        isVirtual: false,
        screenWidth: screen.width,
        screenHeight: screen.height,
        pixelRatio: devicePixelRatio,
      };
    },

    vibrate(pattern?: number | number[]): void {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern || 100);
      }
    },

    openURL(url: string): void {
      window.open(url, '_blank');
    },

    async share(data: any): Promise<void> {
      if ('share' in navigator) {
        await (navigator as any).share(data);
      } else {
        throw new PluginError('Web Share API not available', 'SHARE_UNAVAILABLE');
      }
    },
  };
}

// Crypto API Implementation
class CryptoAPIImpl implements CryptoAPI {
  constructor(private pluginId: string) {}

  async hash(
    data: string | ArrayBuffer,
    algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512' = 'SHA-256'
  ): Promise<string> {
    permissionManager.checkPermission(this.pluginId, 'crypto.hash');

    const encoder = new TextEncoder();
    const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
    const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async encrypt(data: string, key: string): Promise<string> {
    permissionManager.checkPermission(this.pluginId, 'crypto.encrypt');

    // Simplified encryption implementation
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, [
      'encrypt',
    ]);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = encoder.encode(data);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encodedData);

    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode.apply(null, Array.from(result)));
  }

  async decrypt(encryptedData: string, key: string): Promise<string> {
    permissionManager.checkPermission(this.pluginId, 'crypto.encrypt');

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, [
      'decrypt',
    ]);

    const data = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map(c => c.charCodeAt(0))
    );
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, encrypted);

    return decoder.decode(decrypted);
  }

  async generateKey(length: number = 32): Promise<string> {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  randomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// Analytics API Implementation (simplified)
class AnalyticsAPIImpl implements AnalyticsAPI {
  constructor(private pluginId: string) {}

  track(event: string, properties?: Record<string, any>): void {
    console.log(`[Analytics] Plugin ${this.pluginId} tracked event: ${event}`, properties);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    console.log(`[Analytics] Plugin ${this.pluginId} identified user: ${userId}`, traits);
  }

  page(name: string, properties?: Record<string, any>): void {
    console.log(`[Analytics] Plugin ${this.pluginId} tracked page: ${name}`, properties);
  }

  group(groupId: string, traits?: Record<string, any>): void {
    console.log(`[Analytics] Plugin ${this.pluginId} tracked group: ${groupId}`, traits);
  }

  alias(newId: string, previousId?: string): void {
    console.log(`[Analytics] Plugin ${this.pluginId} aliased: ${newId} <- ${previousId}`);
  }
}

// Main SDK class
export class PluginSDK {
  private static instance: PluginSDK;

  static getInstance(): PluginSDK {
    if (!PluginSDK.instance) {
      PluginSDK.instance = new PluginSDK();
    }
    return PluginSDK.instance;
  }

  createAPI(pluginId: string): PluginAPI {
    return {
      storage: new StorageAPIImpl(pluginId),
      ui: new UIApiImpl(pluginId),
      network: new NetworkAPIImpl(pluginId),
      system: new SystemAPIImpl(pluginId),
      crypto: new CryptoAPIImpl(pluginId),
      analytics: new AnalyticsAPIImpl(pluginId),
    };
  }

  createContext(
    id: string,
    name: string,
    version: string,
    author: string,
    config: PluginConfig,
    runtime: PluginRuntime
  ): PluginContext {
    return {
      id,
      name,
      version,
      author,
      config,
      runtime,
    };
  }

  registerPlugin(plugin: Plugin, context: PluginContext): void {
    // Set permissions
    permissionManager.setPermissions(context.id, context.config.permissions);

    // Register plugin
    pluginRegistry.register(context.id, plugin, context);

    // Set up lifecycle handler
    const lifecycleHandler: PluginLifecycleHandler = async (ctx, event, data) => {
      switch (event) {
        case 'install':
          await plugin.onInstall?.();
          break;
        case 'activate':
          await plugin.onActivate?.();
          break;
        case 'deactivate':
          await plugin.onDeactivate?.();
          break;
        case 'uninstall':
          await plugin.onUninstall?.();
          break;
        case 'update':
          await plugin.onUpdate?.(data.oldVersion, data.newVersion);
          break;
        case 'configure':
          await plugin.onConfigure?.(data.config);
          break;
      }
    };

    pluginRegistry.setLifecycleHandler(context.id, lifecycleHandler);

    // Set up event handler
    if (plugin.onEvent) {
      pluginRegistry.addEventHandler(context.id, plugin.onEvent.bind(plugin));
    }
  }

  unregisterPlugin(pluginId: string): void {
    pluginRegistry.unregister(pluginId);
    permissionManager.removePermissions(pluginId);
  }

  async executePlugin(pluginId: string): Promise<void> {
    const plugin = pluginRegistry.get(pluginId);
    if (!plugin) {
      throw new PluginError(`Plugin not found: ${pluginId}`, 'PLUGIN_NOT_FOUND');
    }

    try {
      await plugin.run();
    } catch (error) {
      throw new PluginError(`Plugin execution failed: ${pluginId}`, 'PLUGIN_EXECUTION_ERROR', {
        pluginId,
        error,
      });
    }
  }

  async fireLifecycleEvent(
    pluginId: string,
    event: PluginLifecycleEvent,
    data?: any
  ): Promise<void> {
    await pluginRegistry.fireLifecycleEvent(pluginId, event, data);
  }

  async fireEvent(event: PluginEvent): Promise<void> {
    await pluginRegistry.fireEvent(event);
  }

  getRegisteredPlugins(): string[] {
    return pluginRegistry.list();
  }

  getPluginContext(pluginId: string): PluginContext | undefined {
    return pluginRegistry.getContext(pluginId);
  }
}

// Export the singleton instance
export const sdk = PluginSDK.getInstance();
