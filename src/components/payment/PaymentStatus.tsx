import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { PaymentErrorBoundary } from '../common/PaymentErrorBoundary';
import { paymentService } from '../../services/payment/PaymentService';
import { PaymentStatus as PaymentStatusEnum } from '../../types';

export interface PaymentStatusProps {
  paymentId: string;
  orderId?: string;
  onSuccess?: () => void;
  onFailure?: () => void;
  onRetry?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface PaymentStatusState {
  status: PaymentStatusEnum | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const PaymentStatus: React.FC<PaymentStatusProps> = React.memo(
  ({
    paymentId,
    orderId,
    onSuccess,
    onFailure,
    onRetry,
    autoRefresh = true,
    refreshInterval = 3000,
  }) => {
    const [state, setState] = useState<PaymentStatusState>({
      status: null,
      isLoading: true,
      error: null,
      lastUpdated: null,
    });

    const fetchPaymentStatus = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const status = await paymentService.getPaymentStatus(paymentId);

        setState(prev => ({
          ...prev,
          status,
          isLoading: false,
          lastUpdated: new Date(),
        }));

        // Trigger callbacks based on status
        if (status === PaymentStatusEnum.COMPLETED && onSuccess) {
          onSuccess();
        } else if (status === PaymentStatusEnum.FAILED && onFailure) {
          onFailure();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch payment status';
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
      }
    };

    useEffect(() => {
      fetchPaymentStatus();
    }, [paymentId]);

    useEffect(() => {
      if (!autoRefresh || !state.status) return;

      // Stop auto-refresh for terminal states
      if (
        [
          PaymentStatusEnum.COMPLETED,
          PaymentStatusEnum.FAILED,
          PaymentStatusEnum.CANCELLED,
          PaymentStatusEnum.REFUNDED,
        ].includes(state.status)
      ) {
        return;
      }

      const interval = setInterval(fetchPaymentStatus, refreshInterval);
      return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, state.status]);

    const getStatusIcon = (status: PaymentStatusEnum | null) => {
      switch (status) {
        case PaymentStatusEnum.COMPLETED:
          return '✅';
        case PaymentStatusEnum.FAILED:
          return '❌';
        case PaymentStatusEnum.CANCELLED:
          return '🚫';
        case PaymentStatusEnum.REFUNDED:
          return '💰';
        case PaymentStatusEnum.PROCESSING:
          return '⏳';
        case PaymentStatusEnum.PENDING:
        default:
          return '🔄';
      }
    };

    const getStatusText = (status: PaymentStatusEnum | null) => {
      switch (status) {
        case PaymentStatusEnum.PENDING:
          return 'Payment Pending';
        case PaymentStatusEnum.PROCESSING:
          return 'Processing Payment';
        case PaymentStatusEnum.COMPLETED:
          return 'Payment Successful';
        case PaymentStatusEnum.FAILED:
          return 'Payment Failed';
        case PaymentStatusEnum.CANCELLED:
          return 'Payment Cancelled';
        case PaymentStatusEnum.REFUNDED:
          return 'Payment Refunded';
        default:
          return 'Checking Payment Status';
      }
    };

    const getStatusColor = (status: PaymentStatusEnum | null) => {
      switch (status) {
        case PaymentStatusEnum.COMPLETED:
          return 'var(--success-color, #10b981)';
        case PaymentStatusEnum.FAILED:
        case PaymentStatusEnum.CANCELLED:
          return 'var(--error-color, #ef4444)';
        case PaymentStatusEnum.REFUNDED:
          return 'var(--warning-color, #f59e0b)';
        case PaymentStatusEnum.PROCESSING:
        case PaymentStatusEnum.PENDING:
        default:
          return 'var(--info-color, #3b82f6)';
      }
    };

    const getStatusDescription = (status: PaymentStatusEnum | null) => {
      switch (status) {
        case PaymentStatusEnum.PENDING:
          return 'Your payment is being processed. Please wait while we confirm the transaction.';
        case PaymentStatusEnum.PROCESSING:
          return 'Payment is currently being processed by the payment gateway.';
        case PaymentStatusEnum.COMPLETED:
          return 'Your payment has been successfully processed. You will receive a confirmation email shortly.';
        case PaymentStatusEnum.FAILED:
          return 'Your payment could not be processed. Please check your payment details and try again.';
        case PaymentStatusEnum.CANCELLED:
          return 'The payment was cancelled. You can try again or contact support if needed.';
        case PaymentStatusEnum.REFUNDED:
          return 'Your payment has been refunded. Please allow 3-5 business days for the refund to appear in your account.';
        default:
          return 'Checking the current status of your payment...';
      }
    };

    if (state.error) {
      return (
        <Card className="payment-status payment-status--error">
          <div className="payment-status__content">
            <div className="payment-status__icon">⚠️</div>
            <h2>Error Checking Payment Status</h2>
            <p>{state.error}</p>
            <div className="payment-status__actions">
              <Button onClick={fetchPaymentStatus}>Try Again</Button>
              {onRetry && (
                <Button variant="secondary" onClick={onRetry}>
                  Return to Payment
                </Button>
              )}
            </div>
          </div>
        </Card>
      );
    }

    return (
      <PaymentErrorBoundary
        onRetry={() => {
          setState(prev => ({ ...prev, error: null, isLoading: false }));
          fetchPaymentStatus();
        }}
        onCancel={onFailure}
      >
        <Card className="payment-status">
          <div className="payment-status__content">
            <div className="payment-status__icon" style={{ color: getStatusColor(state.status) }}>
              {state.isLoading ? <LoadingSpinner size="lg" /> : getStatusIcon(state.status)}
            </div>

            <h2 style={{ color: getStatusColor(state.status) }}>{getStatusText(state.status)}</h2>

            <p className="payment-status__description">{getStatusDescription(state.status)}</p>

            <div className="payment-status__details">
              <div className="payment-status__detail">
                <span>Payment ID:</span>
                <span>{paymentId}</span>
              </div>
              {orderId && (
                <div className="payment-status__detail">
                  <span>Order ID:</span>
                  <span>{orderId}</span>
                </div>
              )}
              {state.lastUpdated && (
                <div className="payment-status__detail">
                  <span>Last Updated:</span>
                  <span>{state.lastUpdated.toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            {state.status === PaymentStatusEnum.FAILED && onRetry && (
              <div className="payment-status__actions">
                <Button onClick={onRetry}>Try Payment Again</Button>
              </div>
            )}

            {state.status === PaymentStatusEnum.COMPLETED && (
              <div className="payment-status__actions">
                <Button onClick={() => (window.location.href = '/orders')}>
                  View Order Details
                </Button>
              </div>
            )}

            {autoRefresh &&
              [PaymentStatusEnum.PENDING, PaymentStatusEnum.PROCESSING].includes(state.status!) && (
                <div className="payment-status__refresh">
                  <small>Auto-refreshing every {refreshInterval / 1000} seconds...</small>
                </div>
              )}
          </div>

          <style jsx>{`
            .payment-status {
              max-width: 500px;
              margin: 2rem auto;
              text-align: center;
            }

            .payment-status__content {
              padding: 2rem;
            }

            .payment-status__icon {
              font-size: 4rem;
              margin-bottom: 1rem;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 80px;
            }

            .payment-status h2 {
              margin: 0 0 1rem 0;
              font-size: 1.5rem;
            }

            .payment-status__description {
              color: var(--text-secondary, #6b7280);
              margin-bottom: 2rem;
              line-height: 1.6;
            }

            .payment-status__details {
              background-color: var(--bg-secondary, #f9fafb);
              border-radius: 0.5rem;
              padding: 1rem;
              margin-bottom: 2rem;
              text-align: left;
            }

            .payment-status__detail {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0.5rem 0;
              border-bottom: 1px solid var(--border-color, #e5e7eb);
            }

            .payment-status__detail:last-child {
              border-bottom: none;
            }

            .payment-status__detail span:first-child {
              font-weight: 500;
              color: var(--text-secondary, #6b7280);
            }

            .payment-status__detail span:last-child {
              font-family: monospace;
              font-size: 0.875rem;
              color: var(--text-primary, #111827);
            }

            .payment-status__actions {
              display: flex;
              gap: 1rem;
              justify-content: center;
              flex-wrap: wrap;
            }

            .payment-status__refresh {
              margin-top: 1rem;
              padding-top: 1rem;
              border-top: 1px solid var(--border-color, #e5e7eb);
            }

            .payment-status__refresh small {
              color: var(--text-secondary, #6b7280);
              font-style: italic;
            }

            @media (max-width: 640px) {
              .payment-status__content {
                padding: 1rem;
              }

              .payment-status__actions {
                flex-direction: column;
              }
            }
          `}</style>
        </Card>
      </PaymentErrorBoundary>
    );
  }
);
