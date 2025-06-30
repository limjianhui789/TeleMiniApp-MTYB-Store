import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { ErrorBoundary, ErrorPage } from './ErrorStates';
import { useToast } from '../feedback';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';

interface ErrorInfo {
  id: string;
  error: Error;
  timestamp: Date;
  context?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
}

interface GlobalErrorContextType {
  reportError: (error: Error, context?: string) => void;
  clearErrors: () => void;
  errors: ErrorInfo[];
}

const GlobalErrorContext = createContext<GlobalErrorContextType | undefined>(undefined);

export const useErrorReporting = () => {
  const context = useContext(GlobalErrorContext);
  if (!context) {
    throw new Error('useErrorReporting must be used within a GlobalErrorProvider');
  }
  return context;
};

interface GlobalErrorProviderProps {
  children: React.ReactNode;
  enableErrorReporting?: boolean;
  maxStoredErrors?: number;
  onError?: (errorInfo: ErrorInfo) => void;
}

export const GlobalErrorProvider: React.FC<GlobalErrorProviderProps> = ({
  children,
  enableErrorReporting = true,
  maxStoredErrors = 10,
  onError,
}) => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const { showToast } = useToast();

  const reportError = useCallback(
    (error: Error, context?: string) => {
      const errorInfo: ErrorInfo = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        error,
        timestamp: new Date(),
        context,
        userId: undefined, // Could be set from user context
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      setErrors(prev => {
        const updated = [errorInfo, ...prev];
        return updated.slice(0, maxStoredErrors);
      });

      // 触觉反馈
      try {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
      } catch (hapticError) {
        console.warn('Haptic feedback not available:', hapticError);
      }

      // 显示用户友好的错误消息
      if (enableErrorReporting) {
        showToast({
          type: 'error',
          title: 'Something went wrong',
          message: getUserFriendlyErrorMessage(error),
          duration: 5000,
        });
      }

      // 调用外部错误处理
      onError?.(errorInfo);

      // 控制台输出详细错误信息
      console.error('Global Error:', {
        error,
        context,
        timestamp: errorInfo.timestamp,
        url: errorInfo.url,
      });
    },
    [enableErrorReporting, maxStoredErrors, onError, showToast]
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // 全局错误监听
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      reportError(new Error(event.message), 'Global Error Event');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      reportError(error, 'Unhandled Promise Rejection');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [reportError]);

  return (
    <GlobalErrorContext.Provider value={{ reportError, clearErrors, errors }}>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          reportError(error, 'React Error Boundary');
        }}
        fallback={({ error, onReset }) => (
          <ErrorPage
            title="Application Error"
            message="The application encountered an unexpected error. Please try refreshing the page."
            errorCode={error?.name}
            onRetry={onReset}
            onHome={() => (window.location.href = '/')}
          />
        )}
      >
        {children}
      </ErrorBoundary>
    </GlobalErrorContext.Provider>
  );
};

// 用户友好的错误消息映射
function getUserFriendlyErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return 'Network connection problem. Please check your internet connection.';
  }

  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  if (message.includes('unauthorized') || message.includes('403')) {
    return 'You are not authorized to perform this action.';
  }

  if (message.includes('not found') || message.includes('404')) {
    return 'The requested resource was not found.';
  }

  if (message.includes('server') || message.includes('500')) {
    return 'Server error. Please try again later.';
  }

  if (message.includes('validation') || message.includes('invalid')) {
    return 'Invalid data provided. Please check your input.';
  }

  // 默认消息
  return 'An unexpected error occurred. Please try again.';
}

// 错误报告组件
interface ErrorReportingPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ErrorReportingPanel: React.FC<ErrorReportingPanelProps> = ({ isOpen, onClose }) => {
  const { colorScheme } = useTelegramTheme();
  const { errors, clearErrors } = useErrorReporting();

  if (!isOpen) return null;

  return (
    <div className="error-reporting-panel">
      <div className="error-reporting-panel__backdrop" onClick={onClose} />

      <div className="error-reporting-panel__content">
        <div className="error-reporting-panel__header">
          <h3>Error Reports</h3>
          <div className="error-reporting-panel__actions">
            <button onClick={clearErrors} className="clear-btn">
              Clear All
            </button>
            <button onClick={onClose} className="close-btn">
              ✕
            </button>
          </div>
        </div>

        <div className="error-reporting-panel__list">
          {errors.length === 0 ? (
            <div className="error-reporting-panel__empty">
              <p>No errors reported</p>
            </div>
          ) : (
            errors.map(errorInfo => (
              <div key={errorInfo.id} className="error-report-item">
                <div className="error-report-item__header">
                  <span className="error-name">{errorInfo.error.name}</span>
                  <span className="error-time">{errorInfo.timestamp.toLocaleTimeString()}</span>
                </div>

                <div className="error-message">{errorInfo.error.message}</div>

                {errorInfo.context && (
                  <div className="error-context">Context: {errorInfo.context}</div>
                )}

                {errorInfo.error.stack && (
                  <details className="error-stack">
                    <summary>Stack Trace</summary>
                    <pre>{errorInfo.error.stack}</pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .error-reporting-panel {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          display: flex;
          justify-content: flex-end;
          font-family: var(--font-family-base);
        }

        .error-reporting-panel__backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .error-reporting-panel__content {
          position: relative;
          width: 500px;
          max-width: 100vw;
          height: 100vh;
          background: var(--color-card-background);
          border-left: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: var(--shadow-xl);
        }

        .error-reporting-panel__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-card-background);
          flex-shrink: 0;
        }

        .error-reporting-panel__header h3 {
          margin: 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .error-reporting-panel__actions {
          display: flex;
          gap: var(--space-2);
        }

        .clear-btn,
        .close-btn {
          background: none;
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          font-size: var(--text-sm);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clear-btn:hover,
        .close-btn:hover {
          background: var(--color-muted);
          color: var(--color-text-primary);
        }

        .error-reporting-panel__list {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .error-reporting-panel__empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--color-text-secondary);
        }

        .error-report-item {
          background: var(--color-muted);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-3);
        }

        .error-report-item__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
        }

        .error-name {
          font-weight: var(--font-weight-semibold);
          color: var(--color-error);
          font-size: var(--text-sm);
        }

        .error-time {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
        }

        .error-message {
          font-size: var(--text-sm);
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
          word-break: break-word;
        }

        .error-context {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-2);
          font-style: italic;
        }

        .error-stack {
          margin-top: var(--space-2);
        }

        .error-stack summary {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          cursor: pointer;
          margin-bottom: var(--space-1);
        }

        .error-stack pre {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
          background: var(--color-background);
          padding: var(--space-2);
          border-radius: var(--radius-sm);
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-all;
        }

        /* 移动端优化 */
        @media (max-width: 640px) {
          .error-reporting-panel__content {
            width: 100vw;
            border-left: none;
          }

          .error-reporting-panel__header {
            padding: var(--space-3);
            padding-top: calc(var(--space-3) + env(safe-area-inset-top, 0));
          }

          .error-reporting-panel__list {
            padding: var(--space-3);
          }
        }
      `}</style>
    </div>
  );
};
