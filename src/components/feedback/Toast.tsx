import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    style?: 'primary' | 'secondary';
  }>;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  hideToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  position?: 'top' | 'bottom' | 'center';
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5,
  position = 'top',
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = Date.now().toString();
      const newToast: ToastMessage = {
        ...toast,
        id,
        duration: toast.duration ?? 4000,
      };

      setToasts(prev => {
        const updated = [newToast, ...prev];
        return updated.slice(0, maxToasts);
      });

      // 触觉反馈
      try {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          switch (toast.type) {
            case 'success':
              window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
              break;
            case 'error':
              window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
              break;
            case 'warning':
              window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
              break;
            default:
              window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
          }
        }
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }

      // 自动隐藏
      if (!toast.persistent && toast.duration && toast.duration > 0) {
        setTimeout(() => {
          hideToast(id);
        }, toast.duration);
      }
    },
    [maxToasts]
  );

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} position={position} onHide={hideToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  position: 'top' | 'bottom' | 'center';
  onHide: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, position, onHide }) => {
  const { colorScheme } = useTelegramTheme();

  if (toasts.length === 0) return null;

  return (
    <div className={`toast-container toast-container--${position}`}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onHide={onHide} />
      ))}

      <style>{`
        .toast-container {
          position: fixed;
          z-index: 10000;
          pointer-events: none;
          width: 100%;
          max-width: 500px;
          left: 50%;
          transform: translateX(-50%);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .toast-container--top {
          top: 0;
          padding-top: calc(var(--space-4) + env(safe-area-inset-top, 0));
        }

        .toast-container--bottom {
          bottom: 0;
          padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0));
          flex-direction: column-reverse;
        }

        .toast-container--center {
          top: 50%;
          transform: translate(-50%, -50%);
        }

        @media (max-width: 640px) {
          .toast-container {
            max-width: 100%;
            padding: var(--space-3);
          }
        }
      `}</style>
    </div>
  );
};

interface ToastItemProps {
  toast: ToastMessage;
  onHide: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onHide }) => {
  const { colorScheme } = useTelegramTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 入场动画
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => onHide(toast.id), 300);
  }, [toast.id, onHide]);

  const getToastIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '';
    }
  };

  const getToastColors = () => {
    switch (toast.type) {
      case 'success':
        return {
          background: 'var(--color-success-background)',
          border: 'var(--color-success)',
          text: 'var(--color-success-dark)',
        };
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
          background: 'var(--color-card-background)',
          border: 'var(--color-border)',
          text: 'var(--color-text-primary)',
        };
    }
  };

  const colors = getToastColors();

  return (
    <div
      className={`toast toast--${toast.type} ${isVisible ? 'toast--visible' : ''} ${isLeaving ? 'toast--leaving' : ''}`}
      style={{
        background: colors.background,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      <div className="toast__content">
        <div className="toast__header">
          <div className="toast__icon-title">
            <span className="toast__icon">{getToastIcon()}</span>
            <div className="toast__text">
              {toast.title && <div className="toast__title">{toast.title}</div>}
              <div className="toast__message">{toast.message}</div>
            </div>
          </div>

          <button className="toast__close" onClick={handleClose} aria-label="Close notification">
            ✕
          </button>
        </div>

        {toast.actions && toast.actions.length > 0 && (
          <div className="toast__actions">
            {toast.actions.map((action, index) => (
              <button
                key={index}
                className={`toast__action toast__action--${action.style || 'secondary'}`}
                onClick={() => {
                  action.onClick();
                  handleClose();
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .toast {
          pointer-events: auto;
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          padding: var(--space-4);
          margin-bottom: var(--space-2);
          transform: translateY(-100px);
          opacity: 0;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          font-family: var(--font-family-base);
          max-width: 100%;
          word-wrap: break-word;
        }

        .toast--visible {
          transform: translateY(0);
          opacity: 1;
        }

        .toast--leaving {
          transform: translateX(100%);
          opacity: 0;
        }

        .toast__content {
          width: 100%;
        }

        .toast__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-3);
        }

        .toast__icon-title {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          flex: 1;
          min-width: 0;
        }

        .toast__icon {
          font-size: var(--text-lg);
          line-height: 1;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .toast__text {
          flex: 1;
          min-width: 0;
        }

        .toast__title {
          font-size: var(--text-base);
          font-weight: var(--font-weight-semibold);
          line-height: var(--leading-tight);
          margin-bottom: var(--space-1);
        }

        .toast__message {
          font-size: var(--text-sm);
          line-height: var(--leading-normal);
          opacity: 0.9;
        }

        .toast__close {
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

        .toast__close:hover {
          opacity: 1;
          background: rgba(0, 0, 0, 0.1);
        }

        .toast__actions {
          display: flex;
          gap: var(--space-2);
          margin-top: var(--space-3);
          justify-content: flex-end;
        }

        .toast__action {
          padding: var(--space-2) var(--space-3);
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: var(--touch-target-min);
        }

        .toast__action--primary {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .toast__action--primary:hover {
          background: var(--color-primary-dark);
        }

        .toast__action--secondary {
          background: transparent;
          color: inherit;
          border-color: currentColor;
          opacity: 0.7;
        }

        .toast__action--secondary:hover {
          opacity: 1;
          background: rgba(0, 0, 0, 0.05);
        }

        /* 移动端优化 */
        @media (max-width: 640px) {
          .toast {
            padding: var(--space-3);
            margin: var(--space-1) 0;
          }

          .toast__actions {
            flex-direction: column;
          }

          .toast__action {
            justify-content: center;
            text-align: center;
          }
        }

        /* 防止选择 */
        .toast * {
          -webkit-tap-highlight-color: transparent;
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
};

// 便捷的 Toast 方法
export const toast = {
  success: (message: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'message'>>) => {
    // 这个方法需要在 ToastProvider 内部使用
    console.warn('toast.success called outside ToastProvider context');
  },

  error: (message: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'message'>>) => {
    console.warn('toast.error called outside ToastProvider context');
  },

  warning: (message: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'message'>>) => {
    console.warn('toast.warning called outside ToastProvider context');
  },

  info: (message: string, options?: Partial<Omit<ToastMessage, 'id' | 'type' | 'message'>>) => {
    console.warn('toast.info called outside ToastProvider context');
  },
};
