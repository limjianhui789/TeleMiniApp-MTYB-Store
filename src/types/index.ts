// ============================================================================
// MTYB Virtual Goods Platform - Core Type Definitions
// ============================================================================

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  email?: string;
  phoneNumber?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  language: string;
  currency: string;
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'auto';
}

export interface NotificationSettings {
  orderUpdates: boolean;
  promotions: boolean;
  systemMessages: boolean;
}

// ============================================================================
// Product Types
// ============================================================================

export enum ProductCategory {
  VPN = 'vpn',
  STREAMING = 'streaming',
  GAMING = 'gaming',
  SOFTWARE = 'software',
  DIGITAL_GOODS = 'digital_goods',
  OTHER = 'other',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}

export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  category: ProductCategory;
  pluginId: string;
  status: ProductStatus;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  images: ProductImage[];
  metadata: Record<string, any>;
  stock?: ProductStock;
  deliveryInfo: DeliveryInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface ProductStock {
  available: number;
  reserved: number;
  total: number;
  lowStockThreshold: number;
}

export interface DeliveryInfo {
  type: 'instant' | 'manual' | 'scheduled';
  estimatedTime?: string;
  instructions?: string;
}

// ============================================================================
// Order Types
// ============================================================================

export enum OrderStatus {
  PENDING = 'pending', // 待支付
  PROCESSING = 'processing', // 处理中
  COMPLETED = 'completed', // 已完成
  FAILED = 'failed', // 失败
  CANCELLED = 'cancelled', // 已取消
  REFUNDED = 'refunded', // 已退款
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentId?: string;
  paymentMethod?: string;
  deliveryData?: Record<string, any>;
  notes?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveryData?: Record<string, any>;
  status: OrderStatus;
}

// ============================================================================
// Payment Types
// ============================================================================

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CURLEC = 'curlec',
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  E_WALLET = 'e_wallet',
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, any>;
  failureReason?: string;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  returnUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  redirectUrl?: string;
  error?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Plugin System Types
// ============================================================================

export enum PluginStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  LOADING = 'loading',
}

export interface PluginConfig {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: ProductCategory;
  status: PluginStatus;
  isEnabled: boolean;
  dependencies?: string[];
  configSchema?: Record<string, any>;
  metadata: Record<string, any>;
}

export interface PluginContext {
  order: Order;
  product: Product;
  user: User;
  config: Record<string, any>;
  logger: PluginLogger;
}

export interface PluginLogger {
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: Error): void;
  debug(message: string, data?: any): void;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface DeliveryResult {
  success: boolean;
  deliveryData?: Record<string, any>;
  error?: string;
  retryable?: boolean;
  metadata?: Record<string, any>;
}

export interface PluginHealthStatus {
  isHealthy: boolean;
  lastCheck: Date;
  error?: string;
  responseTime?: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: Record<string, any>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============================================================================
// Event Types
// ============================================================================

export interface AppEvent {
  type: string;
  payload?: any;
  timestamp: Date;
  source: string;
}

export interface EventEmitter {
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AppConfig {
  apiBaseUrl: string;
  paymentGateway: PaymentGatewayConfig;
  features: FeatureFlags;
  ui: UIConfig;
  logging: LoggingConfig;
}

export interface PaymentGatewayConfig {
  curlec: {
    baseUrl: string;
    publicKey: string;
    webhookSecret: string;
  };
}

export interface FeatureFlags {
  pluginSandbox: boolean;
  orderNotifications: boolean;
  analytics: boolean;
  mockPayments: boolean;
}

export interface UIConfig {
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  layout: {
    maxWidth: number;
    gridColumns: number;
  };
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableRemote: boolean;
  remoteUrl?: string;
}

// ============================================================================
// State Management Types
// ============================================================================

export interface AppState {
  user: UserState;
  products: ProductState;
  orders: OrderState;
  cart: CartState;
  plugins: PluginState;
  ui: UIState;
}

export interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ProductState {
  products: Product[];
  categories: ProductCategory[];
  currentProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  filters: ProductFilters;
}

export interface ProductFilters {
  category?: ProductCategory;
  priceRange?: [number, number];
  searchQuery?: string;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'created' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
}

export interface CartState {
  items: CartItem[];
  total: number;
  currency: string;
  isLoading: boolean;
  error: string | null;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  addedAt: Date;
}

export interface PluginState {
  plugins: PluginConfig[];
  activePlugins: string[];
  isLoading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  isLoading: boolean;
  notifications: Notification[];
  modals: ModalState[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  createdAt: Date;
}

export interface ModalState {
  id: string;
  type: string;
  isOpen: boolean;
  data?: any;
}

// ============================================================================
// Telegram Mini App Types
// ============================================================================

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramWebAppInitData;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  MainButton: TelegramMainButton;
  BackButton: TelegramBackButton;
  HapticFeedback: TelegramHapticFeedback;
}

export interface TelegramWebAppInitData {
  user?: TelegramUser;
  receiver?: TelegramUser;
  chat?: TelegramChat;
  start_param?: string;
  can_send_after?: number;
  auth_date: number;
  hash: string;
}

export interface TelegramChat {
  id: number;
  type: 'group' | 'supergroup' | 'channel';
  title: string;
  username?: string;
  photo_url?: string;
}

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

export interface TelegramMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText(text: string): void;
  onClick(callback: () => void): void;
  show(): void;
  hide(): void;
  enable(): void;
  disable(): void;
  showProgress(leaveActive: boolean): void;
  hideProgress(): void;
}

export interface TelegramBackButton {
  isVisible: boolean;
  onClick(callback: () => void): void;
  show(): void;
  hide(): void;
}

export interface TelegramHapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  selectionChanged(): void;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};

export type WithId<T> = T & {
  id: string;
};

export type ApiEndpoint<TRequest = any, TResponse = any> = {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requestType?: TRequest;
  responseType?: TResponse;
};

// ============================================================================
// Generic Action Types
// ============================================================================

export interface Action<T = any> {
  type: string;
  payload?: T;
  error?: boolean;
  meta?: any;
}

export interface AsyncAction<T = any> extends Action<T> {
  loading?: boolean;
}

// ============================================================================
// Search and Filter Types
// ============================================================================

export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: SortOptions;
  pagination?: PaginationOptions;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  offset?: number;
}

// ============================================================================
// File and Media Types
// ============================================================================

export interface FileUpload {
  file: File;
  url?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnailUrl?: string;
  name: string;
  size: number;
  mimeType: string;
  metadata?: Record<string, any>;
}
