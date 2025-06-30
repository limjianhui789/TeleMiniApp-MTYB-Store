// ============================================================================
// MTYB Virtual Goods Platform - Enhanced Error Boundary Component
// ============================================================================

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Section, Cell, Text } from '@telegram-apps/telegram-ui';
import { logger } from '../../core/utils/Logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: ((error: Error, errorInfo: ErrorInfo) => void) | undefined;
}

interface State {
  hasError: boolean;
  error?: Error | undefined;
  errorInfo?: ErrorInfo | undefined;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log the error
    logger.error('Error caught by ErrorBoundary', error);
    logger.debug('Error info', errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Section
          header="Oops! Something went wrong"
          footer="We apologize for the inconvenience. Please try again or reload the page."
        >
          <Cell
            multiline
            subtitle={
              <div style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 14, opacity: 0.7 }}>
                  {this.state.error?.message || 'An unexpected error occurred'}
                </Text>
                {import.meta.env.DEV && this.state.error?.stack && (
                  <details style={{ marginTop: 12 }}>
                    <summary style={{ cursor: 'pointer', fontSize: 12 }}>Technical Details</summary>
                    <pre
                      style={{
                        fontSize: 10,
                        overflow: 'auto',
                        marginTop: 8,
                        padding: 8,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: 4,
                      }}
                    >
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            }
          >
            Error Details
          </Cell>

          <Cell>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button size="s" mode="filled" onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button size="s" mode="outline" onClick={this.handleReload}>
                Reload Page
              </Button>
            </div>
          </Cell>
        </Section>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError || undefined}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
