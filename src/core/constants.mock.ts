// ============================================================================
// MTYB Virtual Goods Platform - Core Constants (Mock)
// ============================================================================

// This file provides mock values for the constants used in the application
// for testing purposes. It replaces the original constants file to avoid
// issues with `import.meta.env` in a Jest environment.

export const APP_CONFIG = {
  NAME: 'MTYB Virtual Goods Platform',
  VERSION: '1.0.0',
  DESCRIPTION: 'Virtual goods platform with plugin-based architecture',
  AUTHOR: 'MTYB Team',
} as const;

export const API_CONFIG = {
  BASE_URL: 'https://api.mtyb.shop',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const PAYMENT_CONFIG = {
  CURLEC: {
    BASE_URL: 'https://api.curlec.com',
    WEBHOOK_PATH: '/webhooks/curlec',
    TIMEOUT: 60000,
  },
  SUPPORTED_CURRENCIES: ['USD', 'EUR', 'MYR', 'SGD'],
  DEFAULT_CURRENCY: 'USD',
} as const;

export const PLUGIN_CONFIG = {
  MAX_PLUGINS: 50,
  HEALTH_CHECK_INTERVAL: 300000,
  PLUGIN_TIMEOUT: 30000,
  MAX_RETRY_ATTEMPTS: 3,
  SANDBOX_ENABLED: true,
} as const;

export const ORDER_CONFIG = {
  EXPIRY_TIME: 3600000,
  MAX_ITEMS_PER_ORDER: 10,
  AUTO_CANCEL_TIMEOUT: 1800000,
  DELIVERY_TIMEOUT: 300000,
} as const;

export const UI_CONFIG = {
  NOTIFICATION_DURATION: 5000,
  LOADING_TIMEOUT: 30000,
  PAGINATION_SIZE: 20,
  MAX_SEARCH_RESULTS: 100,
} as const;

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'mtyb_user_preferences',
  CART_ITEMS: 'mtyb_cart_items',
  PLUGIN_CONFIGS: 'mtyb_plugin_configs',
  APP_STATE: 'mtyb_app_state',
  AUTH_TOKEN: 'mtyb_auth_token',
} as const;

export const EVENTS = {
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_UPDATED: 'user:updated',
  PRODUCT_ADDED: 'product:added',
  PRODUCT_UPDATED: 'product:updated',
  PRODUCT_REMOVED: 'product:removed',
  PRODUCT_STOCK_CHANGED: 'product:stock_changed',
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_COMPLETED: 'order:completed',
  ORDER_CANCELLED: 'order:cancelled',
  ORDER_FAILED: 'order:failed',
  PAYMENT_INITIATED: 'payment:initiated',
  PAYMENT_COMPLETED: 'payment:completed',
  PAYMENT_FAILED: 'payment:failed',
  PAYMENT_CANCELLED: 'payment:cancelled',
  PAYMENT_REFUNDED: 'payment:refunded',
  WEBHOOK_PROCESSED: 'payment:webhook_processed',
  SYNC_STARTED: 'payment:sync_started',
  SYNC_STOPPED: 'payment:sync_stopped',
  SYNC_COMPLETED: 'payment:sync_completed',
  SYNC_FAILED: 'payment:sync_failed',
  CART_ITEM_ADDED: 'cart:item_added',
  CART_ITEM_REMOVED: 'cart:item_removed',
  CART_ITEM_UPDATED: 'cart:item_updated',
  CART_CLEARED: 'cart:cleared',
  PLUGIN_REGISTERED: 'plugin:registered',
  PLUGIN_UNREGISTERED: 'plugin:unregistered',
  PLUGIN_ENABLED: 'plugin:enabled',
  PLUGIN_DISABLED: 'plugin:disabled',
  PLUGIN_ERROR: 'plugin:error',
  UI_NOTIFICATION_ADDED: 'ui:notification_added',
  UI_NOTIFICATION_REMOVED: 'ui:notification_removed',
  UI_MODAL_OPENED: 'ui:modal_opened',
  UI_MODAL_CLOSED: 'ui:modal_closed',
  UI_THEME_CHANGED: 'ui:theme_changed',
} as const;

export const PAYMENT_EVENTS = {
  PAYMENT_INITIATED: EVENTS.PAYMENT_INITIATED,
  PAYMENT_COMPLETED: EVENTS.PAYMENT_COMPLETED,
  PAYMENT_FAILED: EVENTS.PAYMENT_FAILED,
  PAYMENT_CANCELLED: EVENTS.PAYMENT_CANCELLED,
  PAYMENT_REFUNDED: EVENTS.PAYMENT_REFUNDED,
  WEBHOOK_PROCESSED: EVENTS.WEBHOOK_PROCESSED,
  SYNC_STARTED: EVENTS.SYNC_STARTED,
  SYNC_STOPPED: EVENTS.SYNC_STOPPED,
  SYNC_COMPLETED: EVENTS.SYNC_COMPLETED,
  SYNC_FAILED: EVENTS.SYNC_FAILED,
} as const;

export const ERROR_CODES = {
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_UNAVAILABLE: 'PRODUCT_UNAVAILABLE',
  PRODUCT_OUT_OF_STOCK: 'PRODUCT_OUT_OF_STOCK',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_INVALID_STATUS: 'ORDER_INVALID_STATUS',
  ORDER_EXPIRED: 'ORDER_EXPIRED',
  ORDER_LIMIT_EXCEEDED: 'ORDER_LIMIT_EXCEEDED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_CANCELLED: 'PAYMENT_CANCELLED',
  PAYMENT_INVALID_AMOUNT: 'PAYMENT_INVALID_AMOUNT',
  PAYMENT_GATEWAY_ERROR: 'PAYMENT_GATEWAY_ERROR',
  PLUGIN_NOT_FOUND: 'PLUGIN_NOT_FOUND',
  PLUGIN_DISABLED: 'PLUGIN_DISABLED',
  PLUGIN_ERROR: 'PLUGIN_ERROR',
  PLUGIN_TIMEOUT: 'PLUGIN_TIMEOUT',
  PLUGIN_CONFIG_INVALID: 'PLUGIN_CONFIG_INVALID',
} as const;

export const SUCCESS_MESSAGES = {
  ORDER_CREATED: 'Order created successfully',
  ORDER_COMPLETED: 'Order completed successfully',
  PAYMENT_COMPLETED: 'Payment completed successfully',
  PRODUCT_ADDED_TO_CART: 'Product added to cart',
  PLUGIN_ENABLED: 'Plugin enabled successfully',
  PLUGIN_DISABLED: 'Plugin disabled successfully',
} as const;

export const VALIDATION_RULES = {
  PRODUCT_NAME_MIN_LENGTH: 3,
  PRODUCT_NAME_MAX_LENGTH: 100,
  PRODUCT_DESCRIPTION_MAX_LENGTH: 1000,
  PRICE_MIN: 0.01,
  PRICE_MAX: 999999.99,
  QUANTITY_MIN: 1,
  QUANTITY_MAX: 100,
  PLUGIN_ID_PATTERN: /^[a-z0-9-_]+$/,
  ORDER_ID_PATTERN: /^[A-Z0-9-]+$/,
} as const;

export const FEATURE_FLAGS = {
  ENABLE_PLUGIN_SANDBOX: true,
  ENABLE_ORDER_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: false,
  ENABLE_DEBUG_MODE: false,
  ENABLE_MOCK_PAYMENTS: true,
} as const;
