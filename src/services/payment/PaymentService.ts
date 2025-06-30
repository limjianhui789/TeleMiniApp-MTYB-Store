import type { Payment, PaymentRequest, PaymentResponse } from '../../types';
import { PaymentStatus, PaymentMethod } from '../../types';
import { CurlecGateway } from './CurlecGateway';
import { globalEventEmitter } from '../../core/utils/EventEmitter';
import { PAYMENT_EVENTS } from '../../core/constants';
import { CSRFProtection } from '../../security/CSRFToken';

export interface PaymentServiceConfig {
  enabledMethods: PaymentMethod[];
  defaultCurrency: string;
  timeoutMs: number;
}

export class PaymentService {
  private curlecGateway: CurlecGateway;
  private payments: Map<string, Payment> = new Map();
  private config: PaymentServiceConfig;

  constructor(config?: Partial<PaymentServiceConfig>) {
    this.curlecGateway = new CurlecGateway();
    this.config = {
      enabledMethods: [PaymentMethod.CURLEC],
      defaultCurrency: 'MYR',
      timeoutMs: 60000,
      ...config,
    };
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.validatePaymentRequest(request);

      const payment: Payment = {
        id: this.generatePaymentId(),
        orderId: request.orderId,
        amount: request.amount,
        currency: request.currency,
        method: request.method,
        status: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.payments.set(payment.id, payment);

      let response: PaymentResponse;

      switch (request.method) {
        case PaymentMethod.CURLEC:
          response = await this.curlecGateway.createPayment(request);
          break;
        default:
          throw new Error(`Unsupported payment method: ${request.method}`);
      }

      if (response.success && response.paymentId) {
        payment.gatewayTransactionId = response.paymentId;
        payment.status = PaymentStatus.PROCESSING;
        payment.updatedAt = new Date();

        globalEventEmitter.emit(PAYMENT_EVENTS.PAYMENT_INITIATED, {
          payment,
          response,
        });
      } else {
        payment.status = PaymentStatus.FAILED;
        if (response.error) {
          payment.failureReason = response.error;
        }
        payment.updatedAt = new Date();
      }

      this.payments.set(payment.id, payment);
      return response;
    } catch (error) {
      console.error('Payment creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed',
      };
    }
  }

  async getPayment(paymentId: string): Promise<Payment | null> {
    return this.payments.get(paymentId) || null;
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    for (const payment of this.payments.values()) {
      if (payment.orderId === orderId) {
        return payment;
      }
    }
    return null;
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    metadata?: any
  ): Promise<boolean> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      console.error(`Payment not found: ${paymentId}`);
      return false;
    }

    const oldStatus = payment.status;
    payment.status = status;
    payment.updatedAt = new Date();

    if (status === PaymentStatus.COMPLETED) {
      payment.completedAt = new Date();
    }

    if (metadata) {
      payment.gatewayResponse = { ...payment.gatewayResponse, ...metadata };
    }

    this.payments.set(paymentId, payment);

    if (oldStatus !== status) {
      await this.handlePaymentStatusChange(payment, oldStatus);
    }

    return true;
  }

  async syncPaymentStatus(paymentId: string): Promise<PaymentStatus | null> {
    const payment = this.payments.get(paymentId);
    if (!payment || !payment.gatewayTransactionId) {
      return null;
    }

    try {
      let gatewayStatus: PaymentStatus;

      switch (payment.method) {
        case PaymentMethod.CURLEC:
          gatewayStatus = await this.curlecGateway.getPaymentStatus(payment.gatewayTransactionId);
          break;
        default:
          return null;
      }

      if (gatewayStatus !== payment.status) {
        await this.updatePaymentStatus(paymentId, gatewayStatus);
      }

      return gatewayStatus;
    } catch (error) {
      console.error('Failed to sync payment status:', error);
      return null;
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      console.error(`Payment not found: ${paymentId}`);
      return false;
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      console.error(`Cannot refund payment with status: ${payment.status}`);
      return false;
    }

    try {
      let success = false;

      switch (payment.method) {
        case PaymentMethod.CURLEC:
          success = await this.curlecGateway.refundPayment(payment.gatewayTransactionId!, amount);
          break;
        default:
          throw new Error(`Refund not supported for method: ${payment.method}`);
      }

      if (success) {
        payment.status = PaymentStatus.REFUNDED;
        payment.refundAmount = amount || payment.amount;
        payment.updatedAt = new Date();
        this.payments.set(paymentId, payment);

        globalEventEmitter.emit(PAYMENT_EVENTS.PAYMENT_REFUNDED, { payment });
      }

      return success;
    } catch (error) {
      console.error('Refund failed:', error);
      return false;
    }
  }

  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getPaymentsByStatus(status: PaymentStatus): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.status === status);
  }

  getEnabledPaymentMethods(): PaymentMethod[] {
    return [...this.config.enabledMethods];
  }

  private validatePaymentRequest(request: PaymentRequest): void {
    if (!request.orderId) {
      throw new Error('Order ID is required');
    }

    if (!request.amount || request.amount <= 0) {
      throw new Error('Valid amount is required');
    }

    if (!request.currency) {
      throw new Error('Currency is required');
    }

    if (!this.config.enabledMethods.includes(request.method)) {
      throw new Error(`Payment method not enabled: ${request.method}`);
    }
  }

  private generatePaymentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `pay_${timestamp}_${random}`;
  }

  private async handlePaymentStatusChange(
    payment: Payment,
    oldStatus: PaymentStatus
  ): Promise<void> {
    const eventData = { payment, oldStatus };

    switch (payment.status) {
      case PaymentStatus.COMPLETED:
        globalEventEmitter.emit(PAYMENT_EVENTS.PAYMENT_COMPLETED, eventData);
        break;
      case PaymentStatus.FAILED:
        globalEventEmitter.emit(PAYMENT_EVENTS.PAYMENT_FAILED, eventData);
        break;
      case PaymentStatus.CANCELLED:
        globalEventEmitter.emit(PAYMENT_EVENTS.PAYMENT_CANCELLED, eventData);
        break;
      case PaymentStatus.REFUNDED:
        globalEventEmitter.emit(PAYMENT_EVENTS.PAYMENT_REFUNDED, eventData);
        break;
    }
  }
}

export const paymentService = new PaymentService();
