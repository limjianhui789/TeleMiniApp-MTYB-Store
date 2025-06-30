import { CurlecGateway } from './CurlecGateway';
import type { CurlecWebhookEvent } from './CurlecGateway';
import { PaymentService, paymentService } from './PaymentService';
import { PaymentStatus } from '../../types';
import { globalEventEmitter } from '../../core/utils/EventEmitter';
import { PAYMENT_EVENTS } from '../../core/constants';

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
  event?: CurlecWebhookEvent;
}

export interface WebhookProcessingResult {
  success: boolean;
  message: string;
  paymentId?: string;
  status?: PaymentStatus;
}

export class WebhookHandler {
  private curlecGateway: CurlecGateway;
  private paymentService: PaymentService;
  private processedEvents: Set<string> = new Set();

  constructor() {
    this.curlecGateway = new CurlecGateway();
    this.paymentService = paymentService;
  }

  async handleCurlecWebhook(payload: string, signature: string): Promise<WebhookProcessingResult> {
    try {
      const validation = await this.validateCurlecWebhook(payload, signature);
      if (!validation.isValid || !validation.event) {
        return {
          success: false,
          message: validation.error || 'Webhook validation failed',
        };
      }

      const event = validation.event;

      if (this.processedEvents.has(event.id)) {
        return {
          success: true,
          message: 'Event already processed',
        };
      }

      const result = await this.processCurlecEvent(event);

      if (result.success) {
        this.processedEvents.add(event.id);

        setTimeout(
          () => {
            this.processedEvents.delete(event.id);
          },
          24 * 60 * 60 * 1000
        );
      }

      return result;
    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async validateCurlecWebhook(
    payload: string,
    signature: string
  ): Promise<WebhookValidationResult> {
    if (!signature) {
      return {
        isValid: false,
        error: 'Missing webhook signature',
      };
    }

    const isSignatureValid = await this.curlecGateway.verifyWebhookSignature(payload, signature);
    if (!isSignatureValid) {
      return {
        isValid: false,
        error: 'Invalid webhook signature',
      };
    }

    const event = this.curlecGateway.parseWebhookEvent(payload);
    if (!event) {
      return {
        isValid: false,
        error: 'Invalid webhook payload',
      };
    }

    if (!this.isValidEventType(event.type)) {
      return {
        isValid: false,
        error: `Unsupported event type: ${event.type}`,
      };
    }

    return {
      isValid: true,
      event,
    };
  }

  private async processCurlecEvent(event: CurlecWebhookEvent): Promise<WebhookProcessingResult> {
    const { data } = event;
    const orderId = data.orderId;

    if (!orderId) {
      return {
        success: false,
        message: 'Order ID missing in webhook data',
      };
    }

    const payment = await this.paymentService.getPaymentByOrderId(orderId);
    if (!payment) {
      return {
        success: false,
        message: `Payment not found for order: ${orderId}`,
      };
    }

    const newStatus = this.mapCurlecEventToStatus(event.type, data.status);
    if (!newStatus) {
      return {
        success: false,
        message: `Cannot map event type ${event.type} with status ${data.status}`,
      };
    }

    const metadata = {
      webhookEvent: {
        id: event.id,
        type: event.type,
        timestamp: event.timestamp,
      },
      gatewayData: data,
    };

    if (data.failureReason) {
      metadata.gatewayData.failureReason = data.failureReason;
    }

    const updated = await this.paymentService.updatePaymentStatus(payment.id, newStatus, metadata);

    if (!updated) {
      return {
        success: false,
        message: 'Failed to update payment status',
      };
    }

    globalEventEmitter.emit(PAYMENT_EVENTS.WEBHOOK_PROCESSED, {
      payment,
      event,
      newStatus,
    });

    return {
      success: true,
      message: `Payment status updated to ${newStatus}`,
      paymentId: payment.id,
      status: newStatus,
    };
  }

  private isValidEventType(eventType: string): boolean {
    const validTypes = [
      'payment.created',
      'payment.processing',
      'payment.completed',
      'payment.failed',
      'payment.cancelled',
      'payment.refunded',
      'payment.expired',
    ];

    return validTypes.includes(eventType);
  }

  private mapCurlecEventToStatus(eventType: string, dataStatus?: string): PaymentStatus | null {
    switch (eventType) {
      case 'payment.created':
        return PaymentStatus.PENDING;

      case 'payment.processing':
        return PaymentStatus.PROCESSING;

      case 'payment.completed':
        return PaymentStatus.COMPLETED;

      case 'payment.failed':
      case 'payment.expired':
        return PaymentStatus.FAILED;

      case 'payment.cancelled':
        return PaymentStatus.CANCELLED;

      case 'payment.refunded':
        return PaymentStatus.REFUNDED;

      default:
        if (dataStatus) {
          switch (dataStatus.toLowerCase()) {
            case 'completed':
            case 'paid':
            case 'captured':
              return PaymentStatus.COMPLETED;
            case 'failed':
            case 'declined':
            case 'expired':
              return PaymentStatus.FAILED;
            case 'cancelled':
            case 'voided':
              return PaymentStatus.CANCELLED;
            case 'refunded':
              return PaymentStatus.REFUNDED;
            case 'processing':
            case 'authorizing':
              return PaymentStatus.PROCESSING;
            case 'pending':
            case 'created':
              return PaymentStatus.PENDING;
          }
        }
        return null;
    }
  }

  getProcessedEventsCount(): number {
    return this.processedEvents.size;
  }

  clearProcessedEvents(): void {
    this.processedEvents.clear();
  }
}

export const webhookHandler = new WebhookHandler();
