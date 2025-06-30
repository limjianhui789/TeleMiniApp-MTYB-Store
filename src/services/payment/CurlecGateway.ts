import type { PaymentRequest, PaymentResponse } from '../../types';
import { PaymentStatus } from '../../types';
import { env } from '../../core/config/environment';
import { PAYMENT_CONFIG } from '../../core/constants';
import { CSRFProtection } from '../../security/CSRFToken';

export interface CurlecPaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  customerEmail?: string;
  customerPhone?: string;
  returnUrl?: string;
  cancelUrl?: string;
  webhookUrl?: string;
  metadata?: Record<string, any>;
}

export interface CurlecPaymentResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  orderId: string;
  paymentUrl?: string;
  qrCode?: string;
  redirectUrl?: string;
  expiresAt: string;
  createdAt: string;
}

export interface CurlecWebhookEvent {
  id: string;
  type: string;
  data: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    orderId: string;
    failureReason?: string;
    metadata?: Record<string, any>;
  };
  signature: string;
  timestamp: string;
}

export class CurlecGateway {
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly webhookSecret: string;

  constructor() {
    this.baseUrl = env.get('CURLEC_BASE_URL');
    this.publicKey = env.get('CURLEC_PUBLIC_KEY');
    this.webhookSecret = env.get('CURLEC_WEBHOOK_SECRET');

    if (!this.baseUrl || !this.publicKey || !this.webhookSecret) {
      throw new Error('Curlec configuration is incomplete');
    }
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const curlecRequest: CurlecPaymentRequest = {
        amount: request.amount,
        currency: request.currency,
        orderId: request.orderId,
        description: `MTYB Shop - Order ${request.orderId}`,
        returnUrl: request.returnUrl || `${window.location.origin}/payment/success`,
        cancelUrl: request.cancelUrl || `${window.location.origin}/payment/cancel`,
        webhookUrl: `${window.location.origin}${PAYMENT_CONFIG.CURLEC.WEBHOOK_PATH}`,
        ...(request.metadata && { metadata: request.metadata }),
      };

      const response = await this.makeRequest<CurlecPaymentResponse>(
        '/payments',
        'POST',
        curlecRequest
      );

      return {
        success: true,
        paymentId: response.id,
        ...((response.paymentUrl || response.redirectUrl) && {
          redirectUrl: response.paymentUrl || response.redirectUrl,
        }),
        metadata: {
          curlecId: response.id,
          ...(response.qrCode && { qrCode: response.qrCode }),
          expiresAt: response.expiresAt,
        },
      };
    } catch (error) {
      console.error('Curlec payment creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed',
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await this.makeRequest<CurlecPaymentResponse>(
        `/payments/${paymentId}`,
        'GET'
      );

      return this.mapCurlecStatusToPaymentStatus(response.status);
    } catch (error) {
      console.error('Failed to get payment status:', error);
      return PaymentStatus.FAILED;
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    try {
      const refundData = amount ? { amount } : {};

      await this.makeRequest(`/payments/${paymentId}/refund`, 'POST', refundData);

      return true;
    } catch (error) {
      console.error('Refund failed:', error);
      return false;
    }
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    try {
      // Use Web Crypto API for browser compatibility
      const encoder = new TextEncoder();
      const keyData = encoder.encode(this.webhookSecret);
      const messageData = encoder.encode(payload);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  parseWebhookEvent(payload: string): CurlecWebhookEvent | null {
    try {
      return JSON.parse(payload) as CurlecWebhookEvent;
    } catch (error) {
      console.error('Failed to parse webhook event:', error);
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    let headers: Record<string, string> = {
      Authorization: `Bearer ${this.publicKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'MTYB-Shop/1.0',
    };

    // Add CSRF protection for state-changing operations
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      headers = CSRFProtection.addTokenToRequest(headers);
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private mapCurlecStatusToPaymentStatus(curlecStatus: string): PaymentStatus {
    switch (curlecStatus.toLowerCase()) {
      case 'pending':
      case 'created':
        return PaymentStatus.PENDING;
      case 'processing':
      case 'authorizing':
        return PaymentStatus.PROCESSING;
      case 'completed':
      case 'captured':
      case 'paid':
        return PaymentStatus.COMPLETED;
      case 'failed':
      case 'declined':
      case 'expired':
        return PaymentStatus.FAILED;
      case 'cancelled':
      case 'voided':
        return PaymentStatus.CANCELLED;
      case 'refunded':
      case 'partially_refunded':
        return PaymentStatus.REFUNDED;
      default:
        console.warn(`Unknown Curlec status: ${curlecStatus}`);
        return PaymentStatus.FAILED;
    }
  }
}

export const curlecGateway = new CurlecGateway();
