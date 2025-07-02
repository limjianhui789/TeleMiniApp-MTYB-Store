// Frontend Auth API Service
// Replaces Express routes with browser-compatible API calls

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TelegramAuthRequest {
  telegramUser: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
  };
  hash: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      telegramId: number;
      username?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      role: string;
      status: string;
      emailVerified: boolean;
      twoFactorEnabled: boolean;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
  error?: string;
  message?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface TwoFactorRequest {
  secret?: string;
  verificationCode?: string;
}

class AuthAPI {
  private baseURL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

  /**
   * Authenticate with Telegram Web App
   */
  async telegramAuth(request: TelegramAuthRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Login with email/password
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Logout current session
   */
  async logout(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = this.getStoredToken();
      const response = await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        this.clearStoredTokens();
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Logout all sessions
   */
  async logoutAll(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = this.getStoredToken();
      const response = await fetch(`${this.baseURL}/auth/logout-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        this.clearStoredTokens();
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<AuthResponse> {
    try {
      const token = this.getStoredToken();
      const response = await fetch(`${this.baseURL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Change password
   */
  async changePassword(request: ChangePasswordRequest): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = this.getStoredToken();
      const response = await fetch(`${this.baseURL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor(request: TwoFactorRequest): Promise<{ success: boolean; data?: { backupCodes: string; message: string }; error?: string }> {
    try {
      const token = this.getStoredToken();
      const response = await fetch(`${this.baseURL}/auth/2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(request: TwoFactorRequest): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = this.getStoredToken();
      const response = await fetch(`${this.baseURL}/auth/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Get user permissions
   */
  async getPermissions(): Promise<{ success: boolean; data?: any; error?: string; message?: string }> {
    try {
      const token = this.getStoredToken();
      const response = await fetch(`${this.baseURL}/auth/permissions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Validate current token
   */
  async validateToken(): Promise<{ success: boolean; data?: { valid: boolean; user?: any }; error?: string; message?: string }> {
    try {
      const token = this.getStoredToken();
      const response = await fetch(`${this.baseURL}/auth/validate`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Token management utilities
  private getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private clearStoredTokens(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  // Auto-refresh token on 401 responses
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getStoredToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    // If token expired, try to refresh
    if (response.status === 401 && this.getStoredRefreshToken()) {
      const refreshToken = this.getStoredRefreshToken();
      const refreshResult = await this.refreshToken({ refreshToken: refreshToken! });
      
      if (refreshResult.success && refreshResult.data?.tokens) {
        this.storeTokens(
          refreshResult.data.tokens.accessToken,
          refreshResult.data.tokens.refreshToken
        );
        
        // Retry original request with new token
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${refreshResult.data.tokens.accessToken}`,
          },
        });
      }
      
      // Refresh failed, clear tokens and redirect to login
      this.clearStoredTokens();
      window.location.href = '/login';
    }

    return response;
  }
}

export const authAPI = new AuthAPI();