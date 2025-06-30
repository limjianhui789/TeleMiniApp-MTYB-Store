import { env } from '../core/config/environment';

interface CSRFTokenData {
  token: string;
  timestamp: number;
  userId?: string;
}

export class CSRFToken {
  private static readonly TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
  private static readonly STORAGE_KEY = 'csrf_token';

  /**
   * Generate a new CSRF token
   */
  static generate(userId?: string): string {
    const tokenData: CSRFTokenData = {
      token: this.generateSecureToken(),
      timestamp: Date.now(),
      userId,
    };

    const encodedToken = btoa(JSON.stringify(tokenData));

    // Store in sessionStorage for client-side validation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.STORAGE_KEY, encodedToken);
    }

    return encodedToken;
  }

  /**
   * Validate a CSRF token
   */
  static validate(token: string, userId?: string): boolean {
    try {
      if (!token) return false;

      const tokenData: CSRFTokenData = JSON.parse(atob(token));

      // Check token expiry
      if (Date.now() - tokenData.timestamp > this.TOKEN_EXPIRY_MS) {
        return false;
      }

      // Check user association if provided
      if (userId && tokenData.userId !== userId) {
        return false;
      }

      // Validate against stored token in sessionStorage
      if (typeof window !== 'undefined') {
        const storedToken = sessionStorage.getItem(this.STORAGE_KEY);
        if (storedToken !== token) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('CSRF token validation failed:', error);
      return false;
    }
  }

  /**
   * Get current CSRF token from storage
   */
  static getCurrent(): string | null {
    if (typeof window === 'undefined') return null;

    const token = sessionStorage.getItem(this.STORAGE_KEY);
    if (!token) return null;

    // Validate token is still valid
    if (!this.validate(token)) {
      this.clear();
      return null;
    }

    return token;
  }

  /**
   * Clear stored CSRF token
   */
  static clear(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Generate a cryptographically secure random token
   */
  private static generateSecureToken(): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(32);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Fallback for non-browser environments
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

/**
 * CSRF protection middleware for payment operations
 */
export class CSRFProtection {
  /**
   * Add CSRF token to payment request headers
   */
  static addTokenToRequest(
    headers: Record<string, string>,
    userId?: string
  ): Record<string, string> {
    let token = CSRFToken.getCurrent();

    if (!token) {
      token = CSRFToken.generate(userId);
    }

    return {
      ...headers,
      'X-CSRF-Token': token,
    };
  }

  /**
   * Validate CSRF token from request headers
   */
  static validateRequest(headers: Record<string, string>, userId?: string): boolean {
    const token = headers['X-CSRF-Token'] || headers['x-csrf-token'];

    if (!token) {
      console.warn('CSRF token missing from request');
      return false;
    }

    return CSRFToken.validate(token, userId);
  }

  /**
   * Create protected fetch wrapper that automatically includes CSRF token
   */
  static createProtectedFetch(userId?: string) {
    return async (url: string, options: RequestInit = {}): Promise<Response> => {
      const headers = this.addTokenToRequest(
        (options.headers as Record<string, string>) || {},
        userId
      );

      return fetch(url, {
        ...options,
        headers,
      });
    };
  }
}
