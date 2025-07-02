// ============================================================================
// MTYB Virtual Goods Platform - Enhanced Checkout Flow
// ============================================================================

import React, { useState, useEffect, Suspense } from 'react';
import { Button, ButtonGroup } from '../ui/Button';
import { Card } from '../ui/Card';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';
import { useTelegramUser } from '../../hooks/useTelegramUser';
import { cn } from '../../css/classnames';
import { PaymentForm } from '../payment';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { orderService } from '../../services/order/OrderService';
import { PaymentErrorBoundary } from '../common/PaymentErrorBoundary';
import { PaymentMethod } from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface CheckoutItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image?: string;
  category: string;
  metadata?: Record<string, any>;
}

export interface CheckoutState {
  step: 'cart' | 'review' | 'payment' | 'processing' | 'success' | 'error';
  items: CheckoutItem[];
  totalAmount: number;
  currency: string;
  orderId?: string;
  paymentId?: string;
  error?: string;
  isCreatingOrder?: boolean;
  processingStep?: 'creating_order' | 'processing_payment' | 'finalizing';
}

export interface CheckoutFlowProps {
  items: CheckoutItem[];
  onCheckout: (items: CheckoutItem[]) => Promise<void>;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onBack?: () => void;
  className?: string;
}

// ============================================================================
// Enhanced Checkout Flow Component
// ============================================================================

export const EnhancedCheckoutFlow: React.FC<CheckoutFlowProps> = ({
  items,
  onCheckout,
  onUpdateQuantity,
  onRemoveItem,
  onBack,
  className,
}) => {
  const { colorScheme } = useTelegramTheme();
  const { userId } = useTelegramUser();
  const [state, setState] = useState<CheckoutState>({
    step: 'cart',
    items,
    totalAmount: 0,
    currency: 'USD',
  });

  // Calculate total amount
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setState(prev => ({ ...prev, totalAmount: total, items }));
  }, [items]);

  // Handle haptic feedback
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
      }
    } catch (error) {
      // Silently fail
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    triggerHaptic('light');
    onUpdateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    triggerHaptic('medium');
    onRemoveItem(itemId);
  };

  const handleProceedToReview = () => {
    triggerHaptic('medium');
    setState(prev => ({ ...prev, step: 'review' }));
  };

  const handleProceedToPayment = async () => {
    triggerHaptic('medium');
    setState(prev => ({
      ...prev,
      step: 'processing',
      isCreatingOrder: true,
      processingStep: 'creating_order',
    }));

    try {
      // Create order when proceeding to payment
      const order = await orderService.createOrder({
        userId: userId,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        paymentMethod: PaymentMethod.CURLEC,
        currency: state.currency,
      });

      setState(prev => ({
        ...prev,
        orderId: order.id,
        step: 'payment',
        isCreatingOrder: false,
        processingStep: undefined,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        step: 'error',
        error: error instanceof Error ? error.message : 'Failed to create order',
        isCreatingOrder: false,
        processingStep: undefined,
      }));
    }
  };

  const handleBack = () => {
    triggerHaptic('light');
    if (state.step === 'review') {
      setState(prev => ({ ...prev, step: 'cart' }));
    } else if (state.step === 'payment') {
      setState(prev => ({ ...prev, step: 'review' }));
    } else {
      onBack?.();
    }
  };

  if (state.step === 'success') {
    return (
      <CheckoutSuccess
        orderId={state.orderId}
        paymentId={state.paymentId}
        amount={state.totalAmount}
        currency={state.currency}
        onContinue={() => onBack?.()}
      />
    );
  }

  if (state.step === 'error') {
    return (
      <CheckoutError
        error={state.error || 'Unknown error'}
        onRetry={() => setState(prev => ({ ...prev, step: 'payment', error: undefined }))}
        onBack={() => setState(prev => ({ ...prev, step: 'cart', error: undefined }))}
      />
    );
  }

  return (
    <div className={cn('checkout-flow', className)}>
      {/* Progress Indicator */}
      <CheckoutProgress currentStep={state.step} />

      {/* Header */}
      <div className="checkout-flow__header">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ChevronLeftIcon />}
          onClick={handleBack}
          className="checkout-flow__back-btn"
        >
          Back
        </Button>
        <h1 className="checkout-flow__title">
          {state.step === 'cart' && 'Shopping Cart'}
          {state.step === 'review' && 'Order Review'}
          {state.step === 'payment' && 'Payment'}
          {state.step === 'processing' && 'Processing...'}
        </h1>
      </div>

      {/* Content */}
      <div className="checkout-flow__content">
        {state.step === 'cart' && (
          <CartStep
            items={items}
            onQuantityChange={handleQuantityChange}
            onRemoveItem={handleRemoveItem}
            onProceed={handleProceedToReview}
            totalAmount={state.totalAmount}
            currency={state.currency}
          />
        )}

        {state.step === 'review' && (
          <ReviewStep
            items={items}
            totalAmount={state.totalAmount}
            currency={state.currency}
            onProceed={handleProceedToPayment}
          />
        )}

        {state.step === 'payment' && state.orderId && (
          <PaymentErrorBoundary
            onRetry={() => setState(prev => ({ ...prev, error: undefined }))}
            onCancel={() => setState(prev => ({ ...prev, step: 'review' }))}
          >
            <Suspense
              fallback={
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <LoadingSpinner size="lg" />
                </div>
              }
            >
              <PaymentForm
                orderId={state.orderId}
                amount={state.totalAmount}
                currency={state.currency}
                onSuccess={paymentId => {
                  setState(prev => ({ ...prev, paymentId, step: 'success' }));
                }}
                onError={error => {
                  setState(prev => ({ ...prev, error, step: 'error' }));
                }}
                onCancel={() => {
                  setState(prev => ({ ...prev, step: 'review' }));
                }}
              />
            </Suspense>
          </PaymentErrorBoundary>
        )}

        {state.step === 'processing' && (
          <ProcessingStep
            amount={state.totalAmount}
            currency={state.currency}
            currentStep={state.processingStep}
            isCreatingOrder={state.isCreatingOrder}
          />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Progress Indicator
// ============================================================================

interface CheckoutProgressProps {
  currentStep: CheckoutState['step'];
}

const CheckoutProgress: React.FC<CheckoutProgressProps> = ({ currentStep }) => {
  const steps = [
    { key: 'cart', label: 'Cart', icon: '🛒' },
    { key: 'review', label: 'Review', icon: '📋' },
    { key: 'payment', label: 'Payment', icon: '💳' },
  ];

  const getStepIndex = (step: string) => {
    const index = steps.findIndex(s => s.key === step);
    return index === -1 ? 0 : index;
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="checkout-progress">
      {steps.map((step, index) => (
        <div
          key={step.key}
          className={cn('checkout-progress__step', {
            'checkout-progress__step--active': index === currentIndex,
            'checkout-progress__step--completed': index < currentIndex,
          })}
        >
          <div className="checkout-progress__step-icon">{step.icon}</div>
          <span className="checkout-progress__step-label">{step.label}</span>
          {index < steps.length - 1 && (
            <div
              className={cn('checkout-progress__connector', {
                'checkout-progress__connector--completed': index < currentIndex,
              })}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Cart Step
// ============================================================================

interface CartStepProps {
  items: CheckoutItem[];
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onProceed: () => void;
  totalAmount: number;
  currency: string;
}

const CartStep: React.FC<CartStepProps> = ({
  items,
  onQuantityChange,
  onRemoveItem,
  onProceed,
  totalAmount,
  currency,
}) => {
  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty__icon">🛒</div>
        <h3 className="cart-empty__title">Your cart is empty</h3>
        <p className="cart-empty__description">Add some items to your cart to continue shopping</p>
      </div>
    );
  }

  return (
    <div className="cart-step">
      <div className="cart-step__items">
        {items.map(item => (
          <CartItem
            key={item.id}
            item={item}
            onQuantityChange={onQuantityChange}
            onRemove={onRemoveItem}
          />
        ))}
      </div>

      <div className="cart-step__summary">
        <Card className="cart-summary">
          <div className="cart-summary__row">
            <span className="cart-summary__label">Subtotal ({items.length} items)</span>
            <span className="cart-summary__value">${totalAmount.toFixed(2)}</span>
          </div>
          <div className="cart-summary__row cart-summary__row--total">
            <span className="cart-summary__label">Total</span>
            <span className="cart-summary__value">
              ${totalAmount.toFixed(2)} {currency}
            </span>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onProceed}
            className="cart-summary__checkout-btn"
          >
            Proceed to Review
          </Button>
        </Card>
      </div>
    </div>
  );
};

// ============================================================================
// Cart Item Component
// ============================================================================

interface CartItemProps {
  item: CheckoutItem;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onQuantityChange, onRemove }) => {
  return (
    <Card className="cart-item">
      <div className="cart-item__content">
        {item.image && (
          <div className="cart-item__image">
            <img src={item.image} alt={item.name} />
          </div>
        )}

        <div className="cart-item__details">
          <h4 className="cart-item__name">{item.name}</h4>
          <p className="cart-item__description">{item.description}</p>
          <div className="cart-item__category">{item.category}</div>
        </div>

        <div className="cart-item__controls">
          <div className="cart-item__price">${(item.price * item.quantity).toFixed(2)}</div>

          <div className="cart-item__quantity">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuantityChange(item.id, item.quantity - 1)}
              className="cart-item__quantity-btn"
            >
              −
            </Button>
            <span className="cart-item__quantity-display">{item.quantity}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
              className="cart-item__quantity-btn"
            >
              +
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="cart-item__remove-btn"
          >
            🗑️
          </Button>
        </div>
      </div>
    </Card>
  );
};

// ============================================================================
// Review Step
// ============================================================================

interface ReviewStepProps {
  items: CheckoutItem[];
  totalAmount: number;
  currency: string;
  onProceed: () => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ items, totalAmount, currency, onProceed }) => {
  return (
    <div className="review-step">
      <Card className="order-summary">
        <h3 className="order-summary__title">Order Summary</h3>

        <div className="order-summary__items">
          {items.map(item => (
            <div key={item.id} className="order-summary__item">
              <div className="order-summary__item-details">
                <span className="order-summary__item-name">{item.name}</span>
                <span className="order-summary__item-quantity">× {item.quantity}</span>
              </div>
              <span className="order-summary__item-price">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="order-summary__total">
          <div className="order-summary__total-row">
            <span className="order-summary__total-label">Total</span>
            <span className="order-summary__total-amount">
              ${totalAmount.toFixed(2)} {currency}
            </span>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onProceed}
          className="order-summary__proceed-btn"
        >
          Continue to Payment
        </Button>
      </Card>
    </div>
  );
};

// ============================================================================
// Processing Step
// ============================================================================

interface ProcessingStepProps {
  amount: number;
  currency: string;
  currentStep?: 'creating_order' | 'processing_payment' | 'finalizing';
  isCreatingOrder?: boolean;
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({
  amount,
  currency,
  currentStep,
  isCreatingOrder,
}) => {
  const getStepText = () => {
    switch (currentStep) {
      case 'creating_order':
        return 'Creating Your Order';
      case 'processing_payment':
        return 'Processing Payment';
      case 'finalizing':
        return 'Finalizing Order';
      default:
        return 'Processing Your Order';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'creating_order':
        return 'Setting up your order details...';
      case 'processing_payment':
        return `Processing your payment of ${currency} ${amount.toFixed(2)}...`;
      case 'finalizing':
        return 'Finalizing your order and preparing confirmation...';
      default:
        return `Please wait while we process your order of ${currency} ${amount.toFixed(2)}`;
    }
  };

  return (
    <div className="processing-step">
      <div className="processing-step__content">
        <div className="processing-step__spinner">
          <LoadingSpinner size="lg" />
        </div>
        <h3 className="processing-step__title">{getStepText()}</h3>
        <p className="processing-step__description">{getStepDescription()}</p>
        <div
          className="processing-step__steps"
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}
        >
          <div
            className={`processing-step__step ${
              currentStep === 'creating_order' || !currentStep
                ? 'processing-step__step--active'
                : 'processing-step__step--completed'
            }`}
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              color:
                currentStep === 'creating_order' || !currentStep
                  ? 'var(--accent-color, #3b82f6)'
                  : 'var(--success-color, #10b981)',
              fontWeight: currentStep === 'creating_order' || !currentStep ? 'bold' : 'normal',
            }}
          >
            {currentStep === 'creating_order' || !currentStep ? '⏳' : '✅'} Creating order
          </div>
          <div
            className={`processing-step__step ${
              currentStep === 'processing_payment'
                ? 'processing-step__step--active'
                : currentStep === 'finalizing'
                  ? 'processing-step__step--completed'
                  : ''
            }`}
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              color:
                currentStep === 'processing_payment'
                  ? 'var(--accent-color, #3b82f6)'
                  : currentStep === 'finalizing'
                    ? 'var(--success-color, #10b981)'
                    : 'var(--text-secondary, #6b7280)',
              fontWeight: currentStep === 'processing_payment' ? 'bold' : 'normal',
            }}
          >
            {currentStep === 'processing_payment'
              ? '⏳'
              : currentStep === 'finalizing'
                ? '✅'
                : '💳'}{' '}
            Processing payment
          </div>
          <div
            className={`processing-step__step ${
              currentStep === 'finalizing' ? 'processing-step__step--active' : ''
            }`}
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              color:
                currentStep === 'finalizing'
                  ? 'var(--accent-color, #3b82f6)'
                  : 'var(--text-secondary, #6b7280)',
              fontWeight: currentStep === 'finalizing' ? 'bold' : 'normal',
            }}
          >
            {currentStep === 'finalizing' ? '⏳' : '📦'} Finalizing order
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Success and Error Components
// ============================================================================

interface CheckoutSuccessProps {
  orderId?: string;
  paymentId?: string;
  amount: number;
  currency: string;
  onContinue: () => void;
}

const CheckoutSuccess: React.FC<CheckoutSuccessProps> = ({
  orderId,
  paymentId,
  amount,
  currency,
  onContinue,
}) => {
  return (
    <div className="checkout-success">
      <div className="checkout-success__content">
        <div className="checkout-success__icon">✅</div>
        <h2 className="checkout-success__title">Payment Successful!</h2>
        <p className="checkout-success__description">
          Your payment of {currency} {amount.toFixed(2)} has been processed successfully.
        </p>

        {orderId && (
          <div className="checkout-success__details">
            <div className="detail-item">
              <span>Order ID:</span>
              <span>{orderId}</span>
            </div>
            {paymentId && (
              <div className="detail-item">
                <span>Payment ID:</span>
                <span>{paymentId}</span>
              </div>
            )}
          </div>
        )}

        <div className="checkout-success__actions">
          <Button
            variant="primary"
            size="lg"
            onClick={() => (window.location.href = `/orders/${orderId}`)}
            className="checkout-success__order-btn"
          >
            View Order Details
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onContinue}
            className="checkout-success__continue-btn"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
};

interface CheckoutErrorProps {
  error: string;
  onRetry: () => void;
  onBack: () => void;
}

const CheckoutError: React.FC<CheckoutErrorProps> = ({ error, onRetry, onBack }) => {
  return (
    <div className="checkout-error">
      <div className="checkout-error__content">
        <div className="checkout-error__icon">❌</div>
        <h2 className="checkout-error__title">Payment Failed</h2>
        <p className="checkout-error__description">{error}</p>
        <ButtonGroup orientation="vertical" spacing="md" className="checkout-error__actions">
          <Button variant="primary" size="lg" onClick={onRetry}>
            Try Again
          </Button>
          <Button variant="outline" size="lg" onClick={onBack}>
            Back to Cart
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
};

// ============================================================================
// Loading Spinner Component
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn('loading-spinner', sizeClasses[size], className)}>
      <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

// ============================================================================
// Icons
// ============================================================================

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M10 12L6 8L10 4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default EnhancedCheckoutFlow;
