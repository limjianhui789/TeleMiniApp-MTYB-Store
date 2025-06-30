// ============================================================================
// MTYB Virtual Goods Platform - Environment Configuration
// ============================================================================

export interface EnvironmentConfig {
  // Application
  NODE_ENV: 'development' | 'production' | 'test';
  APP_NAME: string;
  APP_VERSION: string;

  // API Configuration
  API_BASE_URL: string;
  API_TIMEOUT: number;

  // Payment Gateway
  CURLEC_BASE_URL: string;
  CURLEC_PUBLIC_KEY: string;
  CURLEC_WEBHOOK_SECRET: string;

  // Telegram
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_URL: string;

  // Feature Flags
  ENABLE_PLUGIN_SANDBOX: boolean;
  ENABLE_ORDER_NOTIFICATIONS: boolean;
  ENABLE_ANALYTICS: boolean;
  ENABLE_DEBUG_MODE: boolean;
  ENABLE_MOCK_PAYMENTS: boolean;

  // Storage
  STORAGE_PREFIX: string;

  // Security
  ENCRYPTION_KEY: string;
  JWT_SECRET: string;

  // Monitoring
  SENTRY_DSN?: string;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

class EnvironmentManager {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadEnvironmentConfig();
    this.validateConfig();
  }

  private loadEnvironmentConfig(): EnvironmentConfig {
    return {
      // Application
      NODE_ENV: (import.meta.env.MODE === 'development'
        ? 'development'
        : 'production') as EnvironmentConfig['NODE_ENV'],
      APP_NAME: import.meta.env.VITE_APP_NAME || 'MTYB Virtual Goods Platform',
      APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',

      // API Configuration
      API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.mtyb.shop',
      API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),

      // Payment Gateway
      CURLEC_BASE_URL: import.meta.env.VITE_CURLEC_BASE_URL || 'https://api.curlec.com',
      CURLEC_PUBLIC_KEY: import.meta.env.VITE_CURLEC_PUBLIC_KEY || '',
      CURLEC_WEBHOOK_SECRET: import.meta.env.VITE_CURLEC_WEBHOOK_SECRET || '',

      // Telegram
      TELEGRAM_BOT_TOKEN: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
      TELEGRAM_WEBHOOK_URL: import.meta.env.VITE_TELEGRAM_WEBHOOK_URL || '',

      // Feature Flags
      ENABLE_PLUGIN_SANDBOX: import.meta.env.VITE_ENABLE_PLUGIN_SANDBOX === 'true',
      ENABLE_ORDER_NOTIFICATIONS: import.meta.env.VITE_ENABLE_ORDER_NOTIFICATIONS !== 'false',
      ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      ENABLE_DEBUG_MODE: import.meta.env.DEV === true,
      ENABLE_MOCK_PAYMENTS: import.meta.env.VITE_ENABLE_MOCK_PAYMENTS === 'true',

      // Storage
      STORAGE_PREFIX: import.meta.env.VITE_STORAGE_PREFIX || 'mtyb_',

      // Security - IMPORTANT: Set these in production environment variables
      // DO NOT use these default keys in production!
      ENCRYPTION_KEY:
        import.meta.env.VITE_ENCRYPTION_KEY || 'yTjy3lBrMFcQ9IaL195QjSeId7tslRIkcopkNvdv5iw=',
      JWT_SECRET:
        import.meta.env.VITE_JWT_SECRET ||
        'g95Sx/TFya7LKSDdB0Vq4hSHJfURJq0rA4d9LrqA8bsF0OAc+j5tuTj94lKnessSYJ3JECzlyGjbd0RP2HJzaQ==',

      // Monitoring
      SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
      LOG_LEVEL: (import.meta.env.VITE_LOG_LEVEL as EnvironmentConfig['LOG_LEVEL']) || 'info',
    };
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Required in production
    if (this.config.NODE_ENV === 'production') {
      if (!this.config.CURLEC_PUBLIC_KEY) {
        errors.push('VITE_CURLEC_PUBLIC_KEY is required in production');
      }

      if (!this.config.CURLEC_WEBHOOK_SECRET) {
        errors.push('VITE_CURLEC_WEBHOOK_SECRET is required in production');
      }

      if (this.config.ENCRYPTION_KEY === 'default-key-change-in-production') {
        errors.push('VITE_ENCRYPTION_KEY must be set in production');
      }

      if (this.config.JWT_SECRET === 'default-secret-change-in-production') {
        errors.push('VITE_JWT_SECRET must be set in production');
      }
    }

    // Validate numeric values
    if (isNaN(this.config.API_TIMEOUT) || this.config.API_TIMEOUT <= 0) {
      errors.push('VITE_API_TIMEOUT must be a positive number');
    }

    // Validate URLs
    if (this.config.API_BASE_URL && !this.isValidUrl(this.config.API_BASE_URL)) {
      errors.push('VITE_API_BASE_URL must be a valid URL');
    }

    if (this.config.CURLEC_BASE_URL && !this.isValidUrl(this.config.CURLEC_BASE_URL)) {
      errors.push('VITE_CURLEC_BASE_URL must be a valid URL');
    }

    if (errors.length > 0) {
      console.error('Environment configuration errors:', errors);
      if (this.config.NODE_ENV === 'production') {
        throw new Error(`Environment configuration errors: ${errors.join(', ')}`);
      }
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  getAll(): EnvironmentConfig {
    return { ...this.config };
  }

  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  // Feature flag helpers
  isFeatureEnabled(
    feature: keyof Pick<
      EnvironmentConfig,
      | 'ENABLE_PLUGIN_SANDBOX'
      | 'ENABLE_ORDER_NOTIFICATIONS'
      | 'ENABLE_ANALYTICS'
      | 'ENABLE_DEBUG_MODE'
      | 'ENABLE_MOCK_PAYMENTS'
    >
  ): boolean {
    return this.config[feature];
  }

  // Get sanitized config for logging (removes sensitive data)
  getSanitizedConfig(): Partial<EnvironmentConfig> {
    const { CURLEC_WEBHOOK_SECRET, TELEGRAM_BOT_TOKEN, ENCRYPTION_KEY, JWT_SECRET, ...sanitized } =
      this.config;

    return {
      ...sanitized,
      CURLEC_WEBHOOK_SECRET: CURLEC_WEBHOOK_SECRET ? '[REDACTED]' : '',
      TELEGRAM_BOT_TOKEN: TELEGRAM_BOT_TOKEN ? '[REDACTED]' : '',
      ENCRYPTION_KEY: '[REDACTED]',
      JWT_SECRET: '[REDACTED]',
    };
  }
}

// Global environment manager instance
export const env = new EnvironmentManager();

// Export commonly used values for convenience
export const { NODE_ENV, APP_NAME, APP_VERSION, API_BASE_URL, CURLEC_BASE_URL } = env.getAll();

export const isDevelopment = env.isDevelopment();
export const isProduction = env.isProduction();
export const isTest = env.isTest();
