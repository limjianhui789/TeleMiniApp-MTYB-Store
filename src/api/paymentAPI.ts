// Frontend Payment API Service
// Replaces Express payment routes with browser-compatible API calls

export interface PaymentIntentRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
  orderId: string;
  metadata?: Record<string, any>;
}

export interface PaymentProcessRequest {
  paymentId: string;
  paymentDetails: {
    method: string;
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    paypalEmail?: string;
    cryptoWallet?: string;
  };
}

export interface PaymentRefundRequest {
  amount?: number;
  reason: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface PaymentIntentResponse {
  success: boolean;
  data?: {
    paymentId: string;
    clientSecret: string;
    amount: number;
    currency: string;
    status: string;
    expiresAt: string;
  };
  error?: string;
}

export interface PaymentHistoryResponse {
  success: boolean;
  data?: {
    payments: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      paymentMethod: string;
      createdAt: string;
      completedAt?: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

export interface PaymentAnalyticsResponse {
  success: boolean;
  data?: {
    totalRevenue: number;
    totalTransactions: number;
    averageTransaction: number;
    successRate: number;
    topMethods: Array<{ method: string; count: number; amount: number }>;
    dailyStats: Array<{ date: string; revenue: number; transactions: number }>;
  };
  error?: string;
}

class PaymentAPI {
  private baseURL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      const response = await fetch(`${this.baseURL}/payment/intent`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Process payment
   */
  async processPayment(request: PaymentProcessRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseURL}/payment/process`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseURL}/payment/${paymentId}/status`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Capture authorized payment
   */
  async capturePayment(paymentId: string, amount?: number): Promise<PaymentResponse> {
    try {
      const body = amount ? JSON.stringify({ amount }) : undefined;
      const response = await fetch(`${this.baseURL}/payment/${paymentId}/capture`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body,
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, request: PaymentRefundRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseURL}/payment/${paymentId}/refund`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(
    options: {
      page?: number;
      limit?: number;
      status?: string;
    } = {}
  ): Promise<PaymentHistoryResponse> {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.status) params.append('status', options.status);

      const response = await fetch(`${this.baseURL}/payment/history?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Calculate developer earnings
   */
  async calculateEarnings(request: {
    saleAmount: number;
    currency: string;
    platformFeePercentage?: number;
  }): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseURL}/payment/calculate-earnings`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Process developer payout
   */
  async processPayout(request: {
    recipientId: string;
    amount: number;
    currency: string;
    method: string;
    destination: Record<string, any>;
  }): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseURL}/payment/payout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Get payment analytics
   */
  async getAnalytics(
    options: {
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<PaymentAnalyticsResponse> {
    try {
      const params = new URLSearchParams();
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);

      const response = await fetch(`${this.baseURL}/payment/analytics?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Get supported payment methods
   */
  async getPaymentMethods(): Promise<{
    success: boolean;
    data?: {
      methods: Array<{
        id: string;
        name: string;
        enabled: boolean;
        currencies: string[];
      }>;
    };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/payment/methods`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Validate payment details before processing
   */
  validatePaymentDetails(paymentDetails: PaymentProcessRequest['paymentDetails']): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    switch (paymentDetails.method) {
      case 'CREDIT_CARD':
        if (!paymentDetails.cardNumber) errors.push('Card number is required');
        if (!paymentDetails.expiryDate) errors.push('Expiry date is required');
        if (!paymentDetails.cvv) errors.push('CVV is required');

        // Basic card number validation (Luhn algorithm could be added)
        if (
          paymentDetails.cardNumber &&
          !/^\d{13,19}$/.test(paymentDetails.cardNumber.replace(/\s/g, ''))
        ) {
          errors.push('Invalid card number format');
        }

        // Basic expiry date validation
        if (
          paymentDetails.expiryDate &&
          !/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentDetails.expiryDate)
        ) {
          errors.push('Invalid expiry date format (MM/YY)');
        }

        break;

      case 'PAYPAL':
        if (!paymentDetails.paypalEmail) errors.push('PayPal email is required');
        if (paymentDetails.paypalEmail && !/\S+@\S+\.\S+/.test(paymentDetails.paypalEmail)) {
          errors.push('Invalid PayPal email format');
        }
        break;

      case 'CRYPTO':
        if (!paymentDetails.cryptoWallet) errors.push('Crypto wallet address is required');
        break;

      default:
        errors.push('Invalid payment method');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format payment amount for display
   */
  formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  /**
   * Get payment status color for UI
   */
  getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      pending: '#FFA500',
      processing: '#007BFF',
      completed: '#28A745',
      failed: '#DC3545',
      cancelled: '#6C757D',
      refunded: '#17A2B8',
    };

    return statusColors[status.toLowerCase()] || '#6C757D';
  }

  /**
   * Get payment status icon for UI
   */
  getStatusIcon(status: string): string {
    const statusIcons: Record<string, string> = {
      pending: '⏳',
      processing: '🔄',
      completed: '✅',
      failed: '❌',
      cancelled: '⚫',
      refunded: '↩️',
    };

    return statusIcons[status.toLowerCase()] || '❓';
  }
}

export const paymentAPI = new PaymentAPI();
