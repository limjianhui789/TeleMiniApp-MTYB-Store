import React, { useState, useCallback } from 'react';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';
import { Button } from '../ui/Button';

interface ErrorPageProps {
  title?: string;
  message?: string;
  errorCode?: string | number;
  showRetry?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
  onHome?: () => void;
  icon?: string;
  className?: string;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  errorCode,
  showRetry = true,
  showHome = true,
  onRetry,
  onHome,
  icon = '⚠️',
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, isRetrying]);

  return (
    <div className={`error-page ${className}`}>
      <div className="error-page__content">
        <div className="error-page__icon">{icon}</div>

        <div className="error-page__text">
          <h2 className="error-page__title">{title}</h2>
          <p className="error-page__message">{message}</p>
          {errorCode && <code className="error-page__code">Error Code: {errorCode}</code>}
        </div>

        <div className="error-page__actions">
          {showRetry && onRetry && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              size="lg"
              className="error-page__retry-btn"
            >
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
          )}

          {showHome && onHome && (
            <Button onClick={onHome} variant="secondary" size="lg" className="error-page__home-btn">
              Go Home
            </Button>
          )}
        </div>
      </div>

      <style>{`
        .error-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: var(--space-8);
          background: var(--color-background);
          font-family: var(--font-family-base);
        }

        .error-page__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 500px;
          width: 100%;
        }

        .error-page__icon {
          font-size: 4rem;
          margin-bottom: var(--space-6);
          opacity: 0.8;
        }

        .error-page__text {
          margin-bottom: var(--space-8);
        }

        .error-page__title {
          margin: 0 0 var(--space-3) 0;
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .error-page__message {
          margin: 0 0 var(--space-4) 0;
          font-size: var(--text-base);
          color: var(--color-text-secondary);
          line-height: var(--leading-normal);
        }

        .error-page__code {
          display: inline-block;
          background: var(--color-muted);
          color: var(--color-text-tertiary);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-sm);
          font-size: var(--text-sm);
          font-family: var(--font-family-mono, 'Monaco', 'Consolas', monospace);
        }

        .error-page__actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          width: 100%;
          max-width: 300px;
        }

        /* 移动端优化 */
        @media (max-width: 640px) {
          .error-page {
            padding: var(--space-4);
          }

          .error-page__title {
            font-size: var(--text-xl);
          }

          .error-page__message {
            font-size: var(--text-sm);
          }

          .error-page__actions {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error?: Error;
    errorInfo?: React.ErrorInfo;
    onReset: () => void;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{
  error?: Error;
  errorInfo?: React.ErrorInfo;
  onReset: () => void;
}> = ({ error, onReset }) => (
  <ErrorPage
    title="Application Error"
    message={error?.message || 'An unexpected error occurred in the application.'}
    errorCode={error?.name}
    onRetry={onReset}
    showHome={false}
  />
);

interface ErrorMessageProps {
  type?: 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  showIcon?: boolean;
  onDismiss?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  type = 'error',
  title,
  message,
  showIcon = true,
  onDismiss,
  actions = [],
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'error':
        return {
          background: 'var(--color-error-background)',
          border: 'var(--color-error)',
          text: 'var(--color-error-dark)',
        };
      case 'warning':
        return {
          background: 'var(--color-warning-background)',
          border: 'var(--color-warning)',
          text: 'var(--color-warning-dark)',
        };
      case 'info':
        return {
          background: 'var(--color-info-background)',
          border: 'var(--color-info)',
          text: 'var(--color-info-dark)',
        };
      default:
        return {
          background: 'var(--color-error-background)',
          border: 'var(--color-error)',
          text: 'var(--color-error-dark)',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className={`error-message ${className}`}
      style={{
        background: colors.background,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      <div className="error-message__content">
        <div className="error-message__header">
          {showIcon && <span className="error-message__icon">{getIcon()}</span>}
          <div className="error-message__text">
            {title && <h4 className="error-message__title">{title}</h4>}
            <p className="error-message__message">{message}</p>
          </div>
          {onDismiss && (
            <button
              className="error-message__dismiss"
              onClick={onDismiss}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          )}
        </div>

        {actions.length > 0 && (
          <div className="error-message__actions">
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant || 'secondary'}
                size="sm"
                className="error-message__action"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .error-message {
          border: 1px solid;
          border-radius: var(--radius-md);
          padding: var(--space-4);
          margin: var(--space-4) 0;
          font-family: var(--font-family-base);
        }

        .error-message__content {
          width: 100%;
        }

        .error-message__header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
        }

        .error-message__icon {
          font-size: var(--text-lg);
          line-height: 1;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .error-message__text {
          flex: 1;
          min-width: 0;
        }

        .error-message__title {
          margin: 0 0 var(--space-1) 0;
          font-size: var(--text-base);
          font-weight: var(--font-weight-semibold);
          line-height: var(--leading-tight);
        }

        .error-message__message {
          margin: 0;
          font-size: var(--text-sm);
          line-height: var(--leading-normal);
          opacity: 0.9;
        }

        .error-message__dismiss {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: var(--space-1);
          border-radius: var(--radius-sm);
          opacity: 0.7;
          transition: all 0.2s ease;
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-sm);
        }

        .error-message__dismiss:hover {
          opacity: 1;
          background: rgba(0, 0, 0, 0.1);
        }

        .error-message__actions {
          display: flex;
          gap: var(--space-2);
          margin-top: var(--space-3);
          justify-content: flex-end;
        }

        /* 移动端优化 */
        @media (max-width: 640px) {
          .error-message {
            margin: var(--space-3) 0;
            padding: var(--space-3);
          }

          .error-message__actions {
            flex-direction: column;
          }

          .error-message__action {
            justify-content: center;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

interface NetworkErrorProps {
  onRetry?: () => void;
  className?: string;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry, className = '' }) => {
  return (
    <ErrorMessage
      type="error"
      title="Network Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      actions={onRetry ? [{ label: 'Retry', onClick: onRetry, variant: 'primary' }] : []}
      className={className}
    />
  );
};

interface NotFoundErrorProps {
  title?: string;
  message?: string;
  onGoBack?: () => void;
  onHome?: () => void;
  className?: string;
}

export const NotFoundError: React.FC<NotFoundErrorProps> = ({
  title = 'Page Not Found',
  message = 'The page you are looking for does not exist or has been moved.',
  onGoBack,
  onHome,
  className = '',
}) => {
  return (
    <ErrorPage
      title={title}
      message={message}
      errorCode="404"
      icon="🔍"
      showRetry={!!onGoBack}
      showHome={!!onHome}
      onRetry={onGoBack}
      onHome={onHome}
      className={className}
    />
  );
};

interface ForbiddenErrorProps {
  title?: string;
  message?: string;
  onLogin?: () => void;
  onHome?: () => void;
  className?: string;
}

export const ForbiddenError: React.FC<ForbiddenErrorProps> = ({
  title = 'Access Denied',
  message = 'You do not have permission to access this resource.',
  onLogin,
  onHome,
  className = '',
}) => {
  const actions = [];
  if (onLogin) actions.push({ label: 'Login', onClick: onLogin, variant: 'primary' as const });
  if (onHome) actions.push({ label: 'Go Home', onClick: onHome, variant: 'secondary' as const });

  return (
    <ErrorMessage
      type="error"
      title={title}
      message={message}
      actions={actions}
      className={className}
    />
  );
};
