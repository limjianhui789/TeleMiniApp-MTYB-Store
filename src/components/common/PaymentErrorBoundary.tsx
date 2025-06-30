import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { logger } from '../../core/utils/Logger';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
  onCancel?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorType?: 'network' | 'payment' | 'validation' | 'order' | 'auth' | 'timeout' | 'unknown';
}

export class PaymentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorType: PaymentErrorBoundary.categorizeError(error),
    };
  }

  static categorizeError(error: Error): State['errorType'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    
    if (message.includes('payment') || message.includes('transaction') || message.includes('gateway') || message.includes('declined')) {
      return 'payment';
    }
    
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation';
    }
    
    if (message.includes('order') || message.includes('expired') || message.includes('stock') || message.includes('inventory')) {
      return 'order';
    }
    
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('permission')) {
      return 'auth';
    }
    
    if (message.includes('timeout') || message.includes('time out') || message.includes('slow')) {
      return 'timeout';
    }
    
    return 'unknown';
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log payment-specific errors with additional context
    logger.error('Payment Error caught by PaymentErrorBoundary', error);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorType: undefined,
    });
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  getErrorDetails() {
    const { error, errorType } = this.state;
    
    switch (errorType) {
      case 'network':
        return {
          icon: '🌐',
          title: 'Network Error',
          message: 'Unable to connect to payment services. Please check your internet connection and try again.',
          suggestion: 'Check your internet connection and try again.',
        };
      
      case 'payment':
        return {
          icon: '💳',
          title: 'Payment Error',
          message: error?.message || 'There was an issue processing your payment. Please try again or use a different payment method.',
          suggestion: 'Try again or contact support if the problem persists.',
        };
      
      case 'validation':
        return {
          icon: '⚠️',
          title: 'Validation Error',
          message: error?.message || 'Please check your payment information and try again.',
          suggestion: 'Verify your payment details and try again.',
        };
      
      case 'order':
        return {
          icon: '📦',
          title: 'Order Issue',
          message: error?.message || 'There was an issue with your order. It may have expired or items may be out of stock.',
          suggestion: 'Please check your cart and try placing the order again.',
        };
      
      case 'auth':
        return {
          icon: '🔐',
          title: 'Authentication Error',
          message: error?.message || 'Authentication failed. Please log in again.',
          suggestion: 'Please refresh the page and try again.',
        };
      
      case 'timeout':
        return {
          icon: '⏱️',
          title: 'Request Timeout',
          message: error?.message || 'The payment request took too long to process.',
          suggestion: 'Please check your internet connection and try again.',
        };
      
      default:
        return {
          icon: '❌',
          title: 'Unexpected Error',
          message: error?.message || 'An unexpected error occurred during payment processing.',
          suggestion: 'Please try again or contact support.',
        };
    }
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorDetails = this.getErrorDetails();

      return (
        <Card className="payment-error-boundary">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {errorDetails.icon}
            </div>
            
            <h2 style={{ margin: '0 0 1rem 0', color: 'var(--error-color, #ef4444)' }}>
              {errorDetails.title}
            </h2>
            
            <p style={{ 
              color: 'var(--text-secondary, #6b7280)', 
              margin: '0 0 1rem 0',
              lineHeight: 1.6
            }}>
              {errorDetails.message}
            </p>
            
            <div style={{ 
              background: 'var(--bg-secondary, #f9fafb)', 
              padding: '1rem',
              borderRadius: '0.5rem',
              margin: '1rem 0 2rem 0',
              fontSize: '0.875rem'
            }}>
              💡 <strong>Suggestion:</strong> {errorDetails.suggestion}
            </div>

            {/* Development mode - show technical details */}
            {import.meta.env.DEV && this.state.error && (
              <details style={{ marginBottom: '2rem', textAlign: 'left' }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary, #6b7280)'
                }}>
                  Technical Details (Development)
                </summary>
                <pre style={{
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  marginTop: '0.5rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-tertiary, #f3f4f6)',
                  borderRadius: '0.25rem',
                  maxHeight: '200px'
                }}>
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                onClick={this.handleRetry}
              >
                Try Again
              </Button>
              
              {this.props.onCancel && (
                <Button
                  variant="outline"
                  onClick={this.props.onCancel}
                >
                  Cancel Payment
                </Button>
              )}
              
              <Button
                variant="ghost"
                onClick={() => {
                  // Create support email link with error details
                  const subject = encodeURIComponent('Payment Error Report');
                  const body = encodeURIComponent(
                    `Dear Support Team,\n\nI encountered a payment error:\n\nError Type: ${this.state.errorType}\nError Message: ${this.state.error?.message}\nTimestamp: ${new Date().toISOString()}\n\nPlease assist me with this issue.\n\nThank you.`
                  );
                  window.location.href = `mailto:support@mtyb.shop?subject=${subject}&body=${body}`;
                }}
              >
                Contact Support
              </Button>
            </div>
          </div>

        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook for handling payment errors in functional components
export const usePaymentErrorHandler = () => {
  const handlePaymentError = (error: Error, context?: Record<string, any>) => {
    logger.error('Payment error handled by hook', error, context);
    
    // You could integrate with error reporting services here
    // e.g., Sentry, Bugsnag, etc.
    
    // For now, just log to console in development
    if (import.meta.env.DEV) {
      console.group('🚨 Payment Error Details');
      console.error('Error:', error);
      console.log('Context:', context);
      console.groupEnd();
    }
  };

  const wrapPaymentOperation = async <T,>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<{ success: boolean; data?: T; error?: Error }> => {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      handlePaymentError(err, context);
      return { success: false, error: err };
    }
  };

  return {
    handlePaymentError,
    wrapPaymentOperation,
  };
};

export default PaymentErrorBoundary;