// API Services Export
// Central export point for all frontend API services

export { authAPI } from './authAPI';
export type {
  LoginRequest,
  TelegramAuthRequest,
  AuthResponse,
  RefreshTokenRequest,
  ChangePasswordRequest,
  TwoFactorRequest,
} from './authAPI';

export { paymentAPI } from './paymentAPI';
export type {
  PaymentIntentRequest,
  PaymentProcessRequest,
  PaymentRefundRequest,
  PaymentResponse,
  PaymentIntentResponse,
  PaymentHistoryResponse,
  PaymentAnalyticsResponse,
} from './paymentAPI';

// API Configuration
export const API_CONFIG = {
  BASE_URL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// API Error Types
export interface APIError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

// Common API Response Type
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  errors?: APIError[];
}

// API Utility Functions
export class APIUtils {
  /**
   * Handle API response errors consistently
   */
  static handleError(error: any): APIError {
    if (error.response) {
      // Server responded with error status
      return {
        code: error.response.data?.error || 'SERVER_ERROR',
        message: error.response.data?.message || 'Server error occurred',
        details: error.response.data?.details,
        statusCode: error.response.status,
      };
    } else if (error.request) {
      // Network error
      return {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to server',
        details: error.message,
      };
    } else {
      // Other error
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
        details: error,
      };
    }
  }

  /**
   * Retry API calls with exponential backoff
   */
  static async withRetry<T>(
    apiCall: () => Promise<T>,
    maxAttempts = API_CONFIG.RETRY_ATTEMPTS,
    baseDelay = API_CONFIG.RETRY_DELAY
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          throw error;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Add timeout to API calls
   */
  static withTimeout<T>(
    promise: Promise<T>,
    timeoutMs = API_CONFIG.TIMEOUT
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  }

  /**
   * Validate API response structure
   */
  static validateResponse<T>(response: any): APIResponse<T> {
    if (typeof response !== 'object' || response === null) {
      throw new Error('Invalid API response format');
    }

    if (typeof response.success !== 'boolean') {
      throw new Error('API response missing success field');
    }

    return response as APIResponse<T>;
  }

  /**
   * Get human-readable error message
   */
  static getErrorMessage(error: APIError): string {
    const messages: Record<string, string> = {
      'NETWORK_ERROR': 'Connection failed. Please check your internet connection.',
      'AUTHENTICATION_REQUIRED': 'Please log in to continue.',
      'AUTHENTICATION_FAILED': 'Invalid credentials. Please try again.',
      'PERMISSION_DENIED': 'You do not have permission to perform this action.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait and try again.',
      'SERVER_ERROR': 'Server error. Please try again later.',
      'NOT_FOUND': 'The requested resource was not found.',
      'PAYMENT_FAILED': 'Payment processing failed. Please try again.',
      'UNKNOWN_ERROR': 'An unexpected error occurred.',
    };

    return messages[error.code] || error.message || 'An error occurred';
  }
}

// Request interceptor for common headers, auth, etc.
export class APIInterceptor {
  static addAuthHeader(headers: Record<string, string> = {}): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  static addCommonHeaders(headers: Record<string, string> = {}): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers,
    };
  }

  static processRequest(url: string, options: RequestInit = {}): [string, RequestInit] {
    const processedOptions: RequestInit = {
      ...options,
      headers: this.addCommonHeaders(
        this.addAuthHeader(options.headers as Record<string, string>)
      ),
    };

    return [url, processedOptions];
  }
}

// Export everything for convenience
export * from './authAPI';
export * from './paymentAPI';