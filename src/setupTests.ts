// ============================================================================
// MTYB Platform - Test Setup Configuration
// ============================================================================

// Mock import.meta for Jest environment
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        MODE: 'test',
        DEV: false,
        PROD: false,
        VITE_API_BASE_URL: 'http://localhost:3000/api',
        VITE_APP_NAME: 'MTYB Test Platform',
        VITE_APP_VERSION: '1.0.0',
        VITE_API_TIMEOUT: '30000',
        VITE_CURLEC_BASE_URL: 'https://api.curlec.com',
        VITE_CURLEC_PUBLIC_KEY: 'test_key',
        VITE_CURLEC_WEBHOOK_SECRET: 'test_secret',
        VITE_TELEGRAM_BOT_TOKEN: 'test_token',
        VITE_TELEGRAM_WEBHOOK_URL: 'https://test.webhook.url',
        VITE_ENABLE_PLUGIN_SANDBOX: 'true',
        VITE_ENABLE_ORDER_NOTIFICATIONS: 'true',
        VITE_ENABLE_ANALYTICS: 'false',
        VITE_ENABLE_MOCK_PAYMENTS: 'true',
        VITE_STORAGE_PREFIX: 'mtyb_test_',
        VITE_ENCRYPTION_KEY: 'test_encryption_key',
        VITE_JWT_SECRET: 'test_jwt_secret',
        VITE_LOG_LEVEL: 'info',
      },
    },
  },
});

import '@testing-library/jest-dom';

// Mock Telegram WebApp API
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color: string;
          text_color: string;
          hint_color: string;
          link_color: string;
          button_color: string;
          button_text_color: string;
        };
      };
    };
  }
}

// Mock Telegram WebApp
window.Telegram = {
  WebApp: {
    ready: jest.fn(),
    expand: jest.fn(),
    close: jest.fn(),
    MainButton: {
      setText: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      onClick: jest.fn(),
      offClick: jest.fn(),
    },
    HapticFeedback: {
      impactOccurred: jest.fn(),
      notificationOccurred: jest.fn(),
      selectionChanged: jest.fn(),
    },
    initData: 'mock_init_data',
    initDataUnsafe: {
      user: {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
      },
    },
    colorScheme: 'light',
    themeParams: {
      bg_color: '#ffffff',
      text_color: '#000000',
      hint_color: '#999999',
      link_color: '#2481cc',
      button_color: '#2481cc',
      button_text_color: '#ffffff',
    },
  },
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

// Mock crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn(),
  },
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Suppress console warnings during tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});
