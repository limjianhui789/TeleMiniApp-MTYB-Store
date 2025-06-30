// ============================================================================
// MTYB Plugin SDK - Type Definitions
// ============================================================================

export interface PluginContext {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly config: PluginConfig;
  readonly runtime: PluginRuntime;
}

export interface PluginConfig {
  readonly apiEndpoint: string;
  readonly debugMode: boolean;
  readonly permissions: PluginPermission[];
  readonly features: PluginFeature[];
  readonly theme: 'light' | 'dark' | 'auto';
  readonly locale: string;
}

export interface PluginRuntime {
  readonly platform: string;
  readonly version: string;
  readonly device: 'mobile' | 'desktop' | 'tablet';
  readonly userAgent: string;
  readonly capabilities: string[];
}

export type PluginPermission =
  | 'storage.read'
  | 'storage.write'
  | 'network.http'
  | 'network.websocket'
  | 'ui.notifications'
  | 'ui.toast'
  | 'ui.modal'
  | 'system.clipboard'
  | 'system.files'
  | 'crypto.hash'
  | 'crypto.encrypt';

export type PluginFeature =
  | 'payments'
  | 'analytics'
  | 'authentication'
  | 'social'
  | 'location'
  | 'camera'
  | 'microphone';

// Plugin Lifecycle Events
export type PluginLifecycleEvent =
  | 'install'
  | 'activate'
  | 'deactivate'
  | 'uninstall'
  | 'update'
  | 'configure';

export interface PluginLifecycleHandler {
  (context: PluginContext, event: PluginLifecycleEvent, data?: any): Promise<void> | void;
}

// Plugin API Interfaces
export interface PluginAPI {
  readonly storage: StorageAPI;
  readonly ui: UIApi;
  readonly network: NetworkAPI;
  readonly system: SystemAPI;
  readonly crypto: CryptoAPI;
  readonly analytics: AnalyticsAPI;
}

// Storage API
export interface StorageAPI {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  has(key: string): Promise<boolean>;
  size(): Promise<number>;
}

// UI API
export interface UIApi {
  showToast(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void;
  showModal(options: ModalOptions): Promise<ModalResult>;
  showNotification(options: NotificationOptions): Promise<void>;
  createComponent(type: UIComponentType, props: any): UIComponent;
  navigate(path: string, options?: NavigationOptions): void;
  setTheme(theme: 'light' | 'dark'): void;
}

export interface ModalOptions {
  title: string;
  content: string | UIComponent;
  buttons?: ModalButton[];
  closable?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export interface ModalButton {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  action: () => void | Promise<void>;
}

export interface ModalResult {
  action: string;
  data?: any;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  actions?: NotificationAction[];
  timeout?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export type UIComponentType =
  | 'button'
  | 'input'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'card'
  | 'list'
  | 'grid'
  | 'chart';

export interface UIComponent {
  readonly type: UIComponentType;
  readonly id: string;
  props: any;
  render(): HTMLElement;
  update(props: any): void;
  destroy(): void;
  on(event: string, handler: Function): void;
  off(event: string, handler?: Function): void;
}

export interface NavigationOptions {
  replace?: boolean;
  params?: Record<string, any>;
  query?: Record<string, any>;
}

// Network API
export interface NetworkAPI {
  http: HTTPClient;
  websocket: WebSocketClient;
}

export interface HTTPClient {
  get(url: string, options?: RequestOptions): Promise<Response>;
  post(url: string, data?: any, options?: RequestOptions): Promise<Response>;
  put(url: string, data?: any, options?: RequestOptions): Promise<Response>;
  delete(url: string, options?: RequestOptions): Promise<Response>;
  patch(url: string, data?: any, options?: RequestOptions): Promise<Response>;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  credentials?: 'omit' | 'same-origin' | 'include';
}

export interface Response {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly ok: boolean;
  json(): Promise<any>;
  text(): Promise<string>;
  blob(): Promise<Blob>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface WebSocketClient {
  connect(url: string, protocols?: string[]): Promise<WebSocketConnection>;
}

export interface WebSocketConnection {
  readonly url: string;
  readonly readyState: number;
  send(data: string | ArrayBuffer | Blob): void;
  close(code?: number, reason?: string): void;
  on(event: 'open' | 'message' | 'error' | 'close', handler: Function): void;
  off(event: 'open' | 'message' | 'error' | 'close', handler?: Function): void;
}

// System API
export interface SystemAPI {
  clipboard: ClipboardAPI;
  files: FilesAPI;
  device: DeviceAPI;
}

export interface ClipboardAPI {
  read(): Promise<string>;
  write(text: string): Promise<void>;
  readImage(): Promise<Blob | null>;
  writeImage(image: Blob): Promise<void>;
}

export interface FilesAPI {
  read(path: string): Promise<Blob>;
  write(path: string, data: Blob | string): Promise<void>;
  exists(path: string): Promise<boolean>;
  list(path: string): Promise<FileInfo[]>;
  delete(path: string): Promise<void>;
  createDirectory(path: string): Promise<void>;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: 'file' | 'directory';
  lastModified: Date;
}

export interface DeviceAPI {
  getInfo(): Promise<DeviceInfo>;
  vibrate(pattern?: number | number[]): void;
  openURL(url: string): void;
  share(data: ShareData): Promise<void>;
}

export interface DeviceInfo {
  platform: string;
  version: string;
  model: string;
  manufacturer: string;
  isVirtual: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
}

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

// Crypto API
export interface CryptoAPI {
  hash(data: string | ArrayBuffer, algorithm?: 'SHA-1' | 'SHA-256' | 'SHA-512'): Promise<string>;
  encrypt(data: string, key: string): Promise<string>;
  decrypt(encryptedData: string, key: string): Promise<string>;
  generateKey(length?: number): Promise<string>;
  randomBytes(length: number): Uint8Array;
  uuid(): string;
}

// Analytics API
export interface AnalyticsAPI {
  track(event: string, properties?: Record<string, any>): void;
  identify(userId: string, traits?: Record<string, any>): void;
  page(name: string, properties?: Record<string, any>): void;
  group(groupId: string, traits?: Record<string, any>): void;
  alias(newId: string, previousId?: string): void;
}

// Plugin Manifest
export interface PluginManifest {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: {
    name: string;
    email: string;
    url?: string;
  };
  license: string;
  homepage?: string;
  repository?: string;
  keywords: string[];

  // Plugin specific
  category: string;
  icon?: string;
  screenshots?: string[];

  // Runtime requirements
  engines: {
    mtyb: string;
  };

  // Permissions and features
  permissions: PluginPermission[];
  features?: PluginFeature[];

  // Entry points
  main: string;
  ui?: string;
  background?: string;

  // Dependencies
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;

  // Configuration schema
  configSchema?: JSONSchema;

  // Pricing
  pricing?: {
    type: 'free' | 'paid' | 'freemium';
    price?: number;
    currency?: string;
    features?: {
      free: string[];
      premium: string[];
    };
  };
}

export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

// Plugin Events
export type PluginEventType =
  | 'storage.changed'
  | 'ui.theme.changed'
  | 'network.online'
  | 'network.offline'
  | 'system.resume'
  | 'system.pause';

export interface PluginEvent {
  type: PluginEventType;
  data?: any;
  timestamp: Date;
}

export interface PluginEventHandler {
  (event: PluginEvent): void | Promise<void>;
}

// Plugin Base Class
export abstract class Plugin {
  protected context: PluginContext;
  protected api: PluginAPI;

  constructor(context: PluginContext, api: PluginAPI) {
    this.context = context;
    this.api = api;
  }

  // Lifecycle methods
  abstract onInstall?(): Promise<void> | void;
  abstract onActivate?(): Promise<void> | void;
  abstract onDeactivate?(): Promise<void> | void;
  abstract onUninstall?(): Promise<void> | void;
  abstract onUpdate?(oldVersion: string, newVersion: string): Promise<void> | void;
  abstract onConfigure?(config: any): Promise<void> | void;

  // Event handling
  abstract onEvent?(event: PluginEvent): Promise<void> | void;

  // Main execution
  abstract run(): Promise<void> | void;
}

// Plugin Error Types
export class PluginError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PluginError';
  }
}

export class PermissionError extends PluginError {
  constructor(permission: PluginPermission) {
    super(`Permission denied: ${permission}`, 'PERMISSION_DENIED', { permission });
    this.name = 'PermissionError';
  }
}

export class NetworkError extends PluginError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class StorageError extends PluginError {
  constructor(message: string, details?: any) {
    super(message, 'STORAGE_ERROR', details);
    this.name = 'StorageError';
  }
}

// Plugin Development Utilities
export interface PluginTestContext {
  readonly plugin: Plugin;
  readonly mockAPI: MockPluginAPI;
  readonly simulator: PluginSimulator;
}

export interface MockPluginAPI extends PluginAPI {
  // Mock-specific methods
  reset(): void;
  getCalls(method: string): any[];
  setMockResponse(method: string, response: any): void;
}

export interface PluginSimulator {
  fireEvent(event: PluginEvent): Promise<void>;
  setConfig(config: PluginConfig): void;
  setPermissions(permissions: PluginPermission[]): void;
  simulateError(error: Error): void;
}

// Plugin Builder Configuration
export interface PluginBuildConfig {
  entry: string;
  output: {
    path: string;
    filename: string;
  };
  manifest: string;
  target: 'web' | 'mobile';
  mode: 'development' | 'production';
  sourceMaps: boolean;
  minify: boolean;
  externals?: string[];
  plugins?: any[];
}

// CLI Command Types
export type CLICommand = 'create' | 'build' | 'test' | 'publish' | 'install' | 'dev' | 'validate';

export interface CLIOptions {
  command: CLICommand;
  args: string[];
  flags: Record<string, any>;
  cwd: string;
}

export interface CLIResult {
  success: boolean;
  message?: string;
  data?: any;
  errors?: string[];
}
