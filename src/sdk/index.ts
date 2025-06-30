// ============================================================================
// MTYB Plugin SDK - Main Entry Point
// ============================================================================

// Core SDK exports
export { sdk, PluginSDK, pluginRegistry, permissionManager, SDK_VERSION } from './core';

// Type definitions
export type {
  PluginContext,
  PluginConfig,
  PluginRuntime,
  PluginPermission,
  PluginFeature,
  PluginLifecycleEvent,
  PluginLifecycleHandler,
  PluginAPI,
  StorageAPI,
  UIApi,
  NetworkAPI,
  SystemAPI,
  CryptoAPI,
  AnalyticsAPI,
  PluginManifest,
  PluginEvent,
  PluginEventType,
  PluginEventHandler,
  PluginTestContext,
  MockPluginAPI,
  PluginSimulator,
  PluginBuildConfig,
  CLICommand,
  CLIOptions,
  CLIResult,

  // UI Types
  ModalOptions,
  ModalButton,
  ModalResult,
  NotificationOptions,
  NotificationAction,
  UIComponentType,
  UIComponent,
  NavigationOptions,

  // Network Types
  HTTPClient,
  RequestOptions,
  Response,
  WebSocketClient,
  WebSocketConnection,

  // System Types
  ClipboardAPI,
  FilesAPI,
  DeviceAPI,
  FileInfo,
  DeviceInfo,
  ShareData,

  // Schema Types
  JSONSchema,
} from './types';

// Base Plugin class
export { Plugin } from './types';

// Error types
export { PluginError, PermissionError, NetworkError, StorageError } from './types';

// CLI Tools
export { PluginCLI, PluginTemplateGenerator } from './cli';

// Utility functions
export const createPlugin = (
  id: string,
  name: string,
  version: string,
  author: string,
  permissions: PluginPermission[] = [],
  features: PluginFeature[] = []
) => {
  const config: PluginConfig = {
    apiEndpoint: process.env.MTYB_API_ENDPOINT || 'https://api.mtyb.shop',
    debugMode: process.env.NODE_ENV === 'development',
    permissions,
    features,
    theme: 'auto',
    locale: 'en',
  };

  const runtime: PluginRuntime = {
    platform: 'web',
    version: SDK_VERSION,
    device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    userAgent: navigator.userAgent,
    capabilities: [
      'storage',
      'network',
      'ui',
      ...(navigator.clipboard ? ['clipboard'] : []),
      ...(window.crypto ? ['crypto'] : []),
      ...(window.Notification ? ['notifications'] : []),
    ],
  };

  const context = sdk.createContext(id, name, version, author, config, runtime);
  const api = sdk.createAPI(id);

  return { context, api, sdk };
};

export const registerPlugin = (plugin: Plugin, context: PluginContext) => {
  sdk.registerPlugin(plugin, context);
};

export const unregisterPlugin = (pluginId: string) => {
  sdk.unregisterPlugin(pluginId);
};

export const executePlugin = async (pluginId: string) => {
  return await sdk.executePlugin(pluginId);
};

export const fireEvent = async (event: PluginEvent) => {
  return await sdk.fireEvent(event);
};

export const getInstalledPlugins = () => {
  return sdk.getRegisteredPlugins();
};

// Plugin development helpers
export const createMockAPI = (): MockPluginAPI => {
  const calls = new Map<string, any[]>();
  const responses = new Map<string, any>();

  const mockAPI: MockPluginAPI = {
    storage: {
      async get(key: string) {
        calls.set('storage.get', [...(calls.get('storage.get') || []), { key }]);
        const mockResponse = responses.get('storage.get');
        return mockResponse !== undefined ? mockResponse : null;
      },
      async set(key: string, value: any) {
        calls.set('storage.set', [...(calls.get('storage.set') || []), { key, value }]);
        const mockResponse = responses.get('storage.set');
        if (mockResponse instanceof Error) throw mockResponse;
      },
      async remove(key: string) {
        calls.set('storage.remove', [...(calls.get('storage.remove') || []), { key }]);
        const mockResponse = responses.get('storage.remove');
        if (mockResponse instanceof Error) throw mockResponse;
      },
      async clear() {
        calls.set('storage.clear', [...(calls.get('storage.clear') || []), {}]);
        const mockResponse = responses.get('storage.clear');
        if (mockResponse instanceof Error) throw mockResponse;
      },
      async keys() {
        calls.set('storage.keys', [...(calls.get('storage.keys') || []), {}]);
        const mockResponse = responses.get('storage.keys');
        return mockResponse !== undefined ? mockResponse : [];
      },
      async has(key: string) {
        calls.set('storage.has', [...(calls.get('storage.has') || []), { key }]);
        const mockResponse = responses.get('storage.has');
        return mockResponse !== undefined ? mockResponse : false;
      },
      async size() {
        calls.set('storage.size', [...(calls.get('storage.size') || []), {}]);
        const mockResponse = responses.get('storage.size');
        return mockResponse !== undefined ? mockResponse : 0;
      },
    } as StorageAPI,

    ui: {
      showToast(message: string, type?: any) {
        calls.set('ui.showToast', [...(calls.get('ui.showToast') || []), { message, type }]);
      },
      async showModal(options: any) {
        calls.set('ui.showModal', [...(calls.get('ui.showModal') || []), { options }]);
        const mockResponse = responses.get('ui.showModal');
        return mockResponse !== undefined ? mockResponse : { action: 'ok' };
      },
      async showNotification(options: any) {
        calls.set('ui.showNotification', [
          ...(calls.get('ui.showNotification') || []),
          { options },
        ]);
        const mockResponse = responses.get('ui.showNotification');
        if (mockResponse instanceof Error) throw mockResponse;
      },
      createComponent(type: any, props: any) {
        calls.set('ui.createComponent', [
          ...(calls.get('ui.createComponent') || []),
          { type, props },
        ]);
        const mockResponse = responses.get('ui.createComponent');
        return mockResponse !== undefined
          ? mockResponse
          : {
              type,
              id: 'mock-component',
              props,
              render: () => document.createElement('div'),
              update: () => {},
              destroy: () => {},
              on: () => {},
              off: () => {},
            };
      },
      navigate(path: string, options?: any) {
        calls.set('ui.navigate', [...(calls.get('ui.navigate') || []), { path, options }]);
      },
      setTheme(theme: any) {
        calls.set('ui.setTheme', [...(calls.get('ui.setTheme') || []), { theme }]);
      },
    } as UIApi,

    network: {
      http: {
        async get(url: string, options?: any) {
          calls.set('network.http.get', [
            ...(calls.get('network.http.get') || []),
            { url, options },
          ]);
          const mockResponse = responses.get('network.http.get');
          return mockResponse !== undefined
            ? mockResponse
            : { ok: true, status: 200, json: async () => ({}) };
        },
        async post(url: string, data?: any, options?: any) {
          calls.set('network.http.post', [
            ...(calls.get('network.http.post') || []),
            { url, data, options },
          ]);
          const mockResponse = responses.get('network.http.post');
          return mockResponse !== undefined
            ? mockResponse
            : { ok: true, status: 200, json: async () => ({}) };
        },
        async put(url: string, data?: any, options?: any) {
          calls.set('network.http.put', [
            ...(calls.get('network.http.put') || []),
            { url, data, options },
          ]);
          const mockResponse = responses.get('network.http.put');
          return mockResponse !== undefined
            ? mockResponse
            : { ok: true, status: 200, json: async () => ({}) };
        },
        async delete(url: string, options?: any) {
          calls.set('network.http.delete', [
            ...(calls.get('network.http.delete') || []),
            { url, options },
          ]);
          const mockResponse = responses.get('network.http.delete');
          return mockResponse !== undefined
            ? mockResponse
            : { ok: true, status: 200, json: async () => ({}) };
        },
        async patch(url: string, data?: any, options?: any) {
          calls.set('network.http.patch', [
            ...(calls.get('network.http.patch') || []),
            { url, data, options },
          ]);
          const mockResponse = responses.get('network.http.patch');
          return mockResponse !== undefined
            ? mockResponse
            : { ok: true, status: 200, json: async () => ({}) };
        },
      },
      websocket: {
        async connect(url: string, protocols?: string[]) {
          calls.set('network.websocket.connect', [
            ...(calls.get('network.websocket.connect') || []),
            { url, protocols },
          ]);
          const mockResponse = responses.get('network.websocket.connect');
          return mockResponse !== undefined
            ? mockResponse
            : {
                url,
                readyState: 1,
                send: () => {},
                close: () => {},
                on: () => {},
                off: () => {},
              };
        },
      },
    } as NetworkAPI,

    system: {
      clipboard: {
        async read() {
          calls.set('system.clipboard.read', [...(calls.get('system.clipboard.read') || []), {}]);
          const mockResponse = responses.get('system.clipboard.read');
          return mockResponse !== undefined ? mockResponse : '';
        },
        async write(text: string) {
          calls.set('system.clipboard.write', [
            ...(calls.get('system.clipboard.write') || []),
            { text },
          ]);
          const mockResponse = responses.get('system.clipboard.write');
          if (mockResponse instanceof Error) throw mockResponse;
        },
        async readImage() {
          calls.set('system.clipboard.readImage', [
            ...(calls.get('system.clipboard.readImage') || []),
            {},
          ]);
          const mockResponse = responses.get('system.clipboard.readImage');
          return mockResponse !== undefined ? mockResponse : null;
        },
        async writeImage(image: Blob) {
          calls.set('system.clipboard.writeImage', [
            ...(calls.get('system.clipboard.writeImage') || []),
            { image },
          ]);
          const mockResponse = responses.get('system.clipboard.writeImage');
          if (mockResponse instanceof Error) throw mockResponse;
        },
      },
      files: {
        async read(path: string) {
          calls.set('system.files.read', [...(calls.get('system.files.read') || []), { path }]);
          const mockResponse = responses.get('system.files.read');
          return mockResponse !== undefined ? mockResponse : new Blob();
        },
        async write(path: string, data: Blob | string) {
          calls.set('system.files.write', [
            ...(calls.get('system.files.write') || []),
            { path, data },
          ]);
          const mockResponse = responses.get('system.files.write');
          if (mockResponse instanceof Error) throw mockResponse;
        },
        async exists(path: string) {
          calls.set('system.files.exists', [...(calls.get('system.files.exists') || []), { path }]);
          const mockResponse = responses.get('system.files.exists');
          return mockResponse !== undefined ? mockResponse : false;
        },
        async list(path: string) {
          calls.set('system.files.list', [...(calls.get('system.files.list') || []), { path }]);
          const mockResponse = responses.get('system.files.list');
          return mockResponse !== undefined ? mockResponse : [];
        },
        async delete(path: string) {
          calls.set('system.files.delete', [...(calls.get('system.files.delete') || []), { path }]);
          const mockResponse = responses.get('system.files.delete');
          if (mockResponse instanceof Error) throw mockResponse;
        },
        async createDirectory(path: string) {
          calls.set('system.files.createDirectory', [
            ...(calls.get('system.files.createDirectory') || []),
            { path },
          ]);
          const mockResponse = responses.get('system.files.createDirectory');
          if (mockResponse instanceof Error) throw mockResponse;
        },
      },
      device: {
        async getInfo() {
          calls.set('system.device.getInfo', [...(calls.get('system.device.getInfo') || []), {}]);
          const mockResponse = responses.get('system.device.getInfo');
          return mockResponse !== undefined
            ? mockResponse
            : {
                platform: 'test',
                version: '1.0.0',
                model: 'Test Device',
                manufacturer: 'Test Corp',
                isVirtual: true,
                screenWidth: 1920,
                screenHeight: 1080,
                pixelRatio: 1,
              };
        },
        vibrate(pattern?: number | number[]) {
          calls.set('system.device.vibrate', [
            ...(calls.get('system.device.vibrate') || []),
            { pattern },
          ]);
        },
        openURL(url: string) {
          calls.set('system.device.openURL', [
            ...(calls.get('system.device.openURL') || []),
            { url },
          ]);
        },
        async share(data: any) {
          calls.set('system.device.share', [...(calls.get('system.device.share') || []), { data }]);
          const mockResponse = responses.get('system.device.share');
          if (mockResponse instanceof Error) throw mockResponse;
        },
      },
    } as SystemAPI,

    crypto: {
      async hash(data: string | ArrayBuffer, algorithm?: any) {
        calls.set('crypto.hash', [...(calls.get('crypto.hash') || []), { data, algorithm }]);
        const mockResponse = responses.get('crypto.hash');
        return mockResponse !== undefined ? mockResponse : 'mock-hash';
      },
      async encrypt(data: string, key: string) {
        calls.set('crypto.encrypt', [...(calls.get('crypto.encrypt') || []), { data, key }]);
        const mockResponse = responses.get('crypto.encrypt');
        return mockResponse !== undefined ? mockResponse : 'mock-encrypted-data';
      },
      async decrypt(encryptedData: string, key: string) {
        calls.set('crypto.decrypt', [
          ...(calls.get('crypto.decrypt') || []),
          { encryptedData, key },
        ]);
        const mockResponse = responses.get('crypto.decrypt');
        return mockResponse !== undefined ? mockResponse : 'mock-decrypted-data';
      },
      async generateKey(length?: number) {
        calls.set('crypto.generateKey', [...(calls.get('crypto.generateKey') || []), { length }]);
        const mockResponse = responses.get('crypto.generateKey');
        return mockResponse !== undefined ? mockResponse : 'mock-key';
      },
      randomBytes(length: number) {
        calls.set('crypto.randomBytes', [...(calls.get('crypto.randomBytes') || []), { length }]);
        const mockResponse = responses.get('crypto.randomBytes');
        return mockResponse !== undefined ? mockResponse : new Uint8Array(length);
      },
      uuid() {
        calls.set('crypto.uuid', [...(calls.get('crypto.uuid') || []), {}]);
        const mockResponse = responses.get('crypto.uuid');
        return mockResponse !== undefined ? mockResponse : 'mock-uuid';
      },
    } as CryptoAPI,

    analytics: {
      track(event: string, properties?: any) {
        calls.set('analytics.track', [
          ...(calls.get('analytics.track') || []),
          { event, properties },
        ]);
      },
      identify(userId: string, traits?: any) {
        calls.set('analytics.identify', [
          ...(calls.get('analytics.identify') || []),
          { userId, traits },
        ]);
      },
      page(name: string, properties?: any) {
        calls.set('analytics.page', [...(calls.get('analytics.page') || []), { name, properties }]);
      },
      group(groupId: string, traits?: any) {
        calls.set('analytics.group', [
          ...(calls.get('analytics.group') || []),
          { groupId, traits },
        ]);
      },
      alias(newId: string, previousId?: string) {
        calls.set('analytics.alias', [
          ...(calls.get('analytics.alias') || []),
          { newId, previousId },
        ]);
      },
    } as AnalyticsAPI,

    // Mock-specific methods
    reset() {
      calls.clear();
      responses.clear();
    },

    getCalls(method: string) {
      return calls.get(method) || [];
    },

    setMockResponse(method: string, response: any) {
      responses.set(method, response);
    },
  };

  return mockAPI;
};

export const createTestContext = (plugin: Plugin): PluginTestContext => {
  const mockAPI = createMockAPI();

  const simulator: PluginSimulator = {
    async fireEvent(event: PluginEvent) {
      if (plugin.onEvent) {
        await plugin.onEvent(event);
      }
    },

    setConfig(config: PluginConfig) {
      // Update plugin context config
      (plugin as any).context = {
        ...(plugin as any).context,
        config,
      };
    },

    setPermissions(permissions: PluginPermission[]) {
      // Update plugin context permissions
      (plugin as any).context = {
        ...(plugin as any).context,
        config: {
          ...(plugin as any).context.config,
          permissions,
        },
      };
    },

    simulateError(error: Error) {
      // Simulate various error conditions
      if (error instanceof PermissionError) {
        mockAPI.setMockResponse('storage.get', error);
      } else if (error instanceof NetworkError) {
        mockAPI.setMockResponse('network.http.get', error);
      }
    },
  };

  return {
    plugin,
    mockAPI,
    simulator,
  };
};

// Version info
export const getSDKVersion = () => SDK_VERSION;

// Plugin lifecycle helpers
export const createPluginLifecycle = () => {
  const handlers = new Map<PluginLifecycleEvent, PluginLifecycleHandler[]>();

  return {
    on(event: PluginLifecycleEvent, handler: PluginLifecycleHandler) {
      const eventHandlers = handlers.get(event) || [];
      eventHandlers.push(handler);
      handlers.set(event, eventHandlers);
    },

    off(event: PluginLifecycleEvent, handler: PluginLifecycleHandler) {
      const eventHandlers = handlers.get(event) || [];
      const index = eventHandlers.indexOf(handler);
      if (index > -1) {
        eventHandlers.splice(index, 1);
        handlers.set(event, eventHandlers);
      }
    },

    async fire(event: PluginLifecycleEvent, context: PluginContext, data?: any) {
      const eventHandlers = handlers.get(event) || [];
      for (const handler of eventHandlers) {
        try {
          await handler(context, event, data);
        } catch (error) {
          console.error(`Lifecycle handler error for ${event}:`, error);
        }
      }
    },
  };
};

// Export default SDK instance
export default sdk;
