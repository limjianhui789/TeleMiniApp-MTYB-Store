import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { PaymentErrorBoundary } from '../common/PaymentErrorBoundary';
import { paymentService } from '../../services/payment/PaymentService';
import { PaymentMethod, PaymentStatus } from '../../types';
import type { PaymentRequest, PaymentResponse } from '../../types';

export interface PaymentFormProps {
  orderId: string;
  amount: number;
  currency?: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

interface PaymentFormState {
  isLoading: boolean;
  paymentResponse: PaymentResponse | null;
  customerEmail: string;
  customerPhone: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = React.memo(({
  orderId,
  amount,
  currency = 'MYR',
  onSuccess,
  onError,
  onCancel,
}) => {
  const [state, setState] = useState<PaymentFormState>({
    isLoading: false,
    paymentResponse: null,
    customerEmail: '',
    customerPhone: '',
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const paymentRequest: PaymentRequest = {
        orderId,
        amount,
        currency,
        method: PaymentMethod.CURLEC,
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
        metadata: {
          customerEmail: state.customerEmail,
          customerPhone: state.customerPhone,
        },
      };

      const response = await paymentService.createPayment(paymentRequest);
      
      if (response.success) {
        setState(prev => ({ ...prev, paymentResponse: response, isLoading: false }));
        
        // Redirect to payment gateway if redirect URL is provided
        if (response.redirectUrl) {
          window.location.href = response.redirectUrl;
        } else if (onSuccess && response.paymentId) {
          onSuccess(response.paymentId);
        }
      } else {
        // Throw error to be caught by PaymentErrorBoundary
        const errorMessage = response.error || 'Payment creation failed';
        if (onError) {
          onError(errorMessage);
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      if (onError) {
        onError(errorMessage);
      }
      // Re-throw to be caught by PaymentErrorBoundary
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }, [orderId, amount, currency, state.customerEmail, state.customerPhone, onSuccess, onError]);

  const handleInputChange = useCallback((field: keyof PaymentFormState, value: string) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);


  // Wrap the entire component with PaymentErrorBoundary
  return (
    <PaymentErrorBoundary
      onRetry={() => setState(prev => ({ ...prev, isLoading: false }))}
      onCancel={onCancel}
    >
      {/* Payment Processing Overlay */}
      {state.isLoading && (
        <div className="payment-overlay">
          <div className="payment-overlay__content">
            <LoadingSpinner size="lg" />
            <h3>Processing Your Payment</h3>
            <p>Please wait while we securely process your payment...</p>
            <div className="payment-overlay__steps">
              <div className="payment-step payment-step--active">
                ✓ Validating payment details
              </div>
              <div className="payment-step payment-step--active">
                ⏳ Connecting to payment gateway
              </div>
              <div className="payment-step">
                ⏳ Finalizing transaction
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Card className="payment-form">
          <div className="payment-form__header">
            <h2>Complete Payment</h2>
            <p className="payment-form__amount">
              {currency} {amount.toFixed(2)}
            </p>
            <p className="payment-form__order">
              Order: {orderId}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="payment-form__form">
            <div className="payment-form__field">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={state.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                placeholder="your.email@example.com"
                required
                disabled={state.isLoading}
              />
            </div>

            <div className="payment-form__field">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={state.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                placeholder="+60123456789"
                required
                disabled={state.isLoading}
              />
            </div>

            <div className="payment-form__methods">
              <h3>Payment Method</h3>
              <div className="payment-method-option">
                <input
                  type="radio"
                  id="curlec"
                  name="paymentMethod"
                  value="curlec"
                  checked
                  disabled
                />
                <label htmlFor="curlec">
                  <img src="/images/curlec-logo.png" alt="Curlec" className="payment-logo" />
                  Curlec Payment Gateway
                </label>
              </div>
            </div>

            <div className="payment-form__actions">
              <Button
                type="submit"
                disabled={state.isLoading || !state.customerEmail || !state.customerPhone}
                className="payment-form__submit"
              >
                {state.isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Processing...
                  </>
                ) : (
                  `Pay ${currency} ${amount.toFixed(2)}`
                )}
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onCancel}
                  disabled={state.isLoading}
                  className="payment-form__cancel"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="payment-form__security">
            <p>🔒 Your payment is secured with bank-level encryption</p>
          </div>

          <style jsx>{`
            .payment-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.8);
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 1000;
              backdrop-filter: blur(4px);
            }

            .payment-overlay__content {
              background: var(--bg-primary, #ffffff);
              padding: 3rem 2rem;
              border-radius: 1rem;
              text-align: center;
              max-width: 400px;
              width: 90%;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }

            .payment-overlay__content h3 {
              margin: 1rem 0 0.5rem 0;
              color: var(--text-primary, #111827);
              font-size: 1.25rem;
            }

            .payment-overlay__content p {
              margin: 0 0 2rem 0;
              color: var(--text-secondary, #6b7280);
              line-height: 1.5;
            }

            .payment-overlay__steps {
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
              align-items: flex-start;
            }

            .payment-step {
              display: flex;
              align-items: center;
              font-size: 0.875rem;
              color: var(--text-secondary, #6b7280);
              opacity: 0.6;
              transition: opacity 0.3s ease;
            }

            .payment-step--active {
              opacity: 1;
              color: var(--success-color, #10b981);
            }

            .payment-form {
              max-width: 500px;
              margin: 0 auto;
              padding: 2rem;
            }

            .payment-form__header {
              text-align: center;
              margin-bottom: 2rem;
              padding-bottom: 1rem;
              border-bottom: 1px solid var(--border-color, #e5e7eb);
            }

            .payment-form__header h2 {
              margin: 0 0 0.5rem 0;
              color: var(--text-primary, #111827);
            }

            .payment-form__amount {
              font-size: 1.5rem;
              font-weight: bold;
              color: var(--accent-color, #3b82f6);
              margin: 0.5rem 0;
            }

            .payment-form__order {
              font-size: 0.875rem;
              color: var(--text-secondary, #6b7280);
              margin: 0;
            }

            .payment-form__form {
              display: flex;
              flex-direction: column;
              gap: 1.5rem;
            }

            .payment-form__field {
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
            }

            .payment-form__field label {
              font-weight: 500;
              color: var(--text-primary, #111827);
            }

            .payment-form__field input {
              padding: 0.75rem;
              border: 1px solid var(--border-color, #d1d5db);
              border-radius: 0.5rem;
              font-size: 1rem;
              transition: border-color 0.2s;
            }

            .payment-form__field input:focus {
              outline: none;
              border-color: var(--accent-color, #3b82f6);
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .payment-form__field input:disabled {
              background-color: var(--bg-secondary, #f9fafb);
              cursor: not-allowed;
            }

            .payment-form__methods h3 {
              margin: 0 0 1rem 0;
              color: var(--text-primary, #111827);
            }

            .payment-method-option {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              padding: 1rem;
              border: 1px solid var(--border-color, #d1d5db);
              border-radius: 0.5rem;
              background-color: var(--bg-primary, #ffffff);
            }

            .payment-method-option label {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              cursor: pointer;
              font-weight: 500;
            }

            .payment-logo {
              height: 24px;
              width: auto;
            }

            .payment-form__actions {
              display: flex;
              gap: 1rem;
              margin-top: 2rem;
            }

            .payment-form__submit {
              flex: 1;
            }

            .payment-form__cancel {
              flex: 0 0 auto;
            }

            .payment-form__security {
              text-align: center;
              margin-top: 1.5rem;
              padding-top: 1rem;
              border-top: 1px solid var(--border-color, #e5e7eb);
            }

            .payment-form__security p {
              font-size: 0.875rem;
              color: var(--text-secondary, #6b7280);
              margin: 0;
            }

            @media (max-width: 640px) {
              .payment-form {
                padding: 1rem;
              }
              
              .payment-form__actions {
                flex-direction: column;
              }
            }
          `}</style>
        </Card>
    </PaymentErrorBoundary>
  );
});