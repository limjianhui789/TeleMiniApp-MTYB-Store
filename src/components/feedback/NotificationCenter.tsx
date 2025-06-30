import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
  metadata?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
  persistKey?: string;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 50,
  persistKey = 'mtyb-notifications',
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 从本地存储加载通知
  useEffect(() => {
    try {
      const stored = localStorage.getItem(persistKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(
          parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [persistKey]);

  // 保存通知到本地存储
  useEffect(() => {
    try {
      localStorage.setItem(persistKey, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }, [notifications, persistKey]);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        read: false,
      };

      setNotifications(prev => {
        const updated = [newNotification, ...prev];
        return updated.slice(0, maxNotifications);
      });

      // 触觉反馈
      try {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          switch (notification.type) {
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
    },
    [maxNotifications]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } =
    useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications =
    filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markAsRead(notification.id);
      }
    },
    [markAsRead]
  );

  if (!isOpen) return null;

  return (
    <div className={`notification-center ${className}`}>
      <div className="notification-center__backdrop" onClick={onClose} />

      <div className="notification-center__panel">
        {/* Header */}
        <div className="notification-center__header">
          <div className="notification-center__title">
            <h3>Notifications</h3>
            {unreadCount > 0 && <span className="notification-center__badge">{unreadCount}</span>}
          </div>

          <div className="notification-center__actions">
            <button
              className="notification-center__filter"
              onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
            >
              {filter === 'all' ? 'Unread Only' : 'Show All'}
            </button>

            <button
              className="notification-center__close"
              onClick={onClose}
              aria-label="Close notifications"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Controls */}
        {notifications.length > 0 && (
          <div className="notification-center__controls">
            {unreadCount > 0 && (
              <button className="notification-center__control-btn" onClick={markAllAsRead}>
                Mark All Read
              </button>
            )}

            <button
              className="notification-center__control-btn notification-center__control-btn--danger"
              onClick={clearAll}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="notification-center__content">
          {filteredNotifications.length === 0 ? (
            <div className="notification-center__empty">
              <div className="notification-center__empty-icon">🔔</div>
              <p>{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
            </div>
          ) : (
            <div className="notification-center__list">
              {filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                  onRemove={removeNotification}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .notification-center {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          display: flex;
          justify-content: flex-end;
          font-family: var(--font-family-base);
        }

        .notification-center__backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .notification-center__panel {
          position: relative;
          width: 400px;
          max-width: 100vw;
          height: 100vh;
          background: var(--color-card-background);
          border-left: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: var(--shadow-xl);
        }

        .notification-center__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-card-background);
          flex-shrink: 0;
        }

        .notification-center__title {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .notification-center__title h3 {
          margin: 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .notification-center__badge {
          background: var(--color-error);
          color: white;
          font-size: var(--text-xs);
          font-weight: var(--font-weight-bold);
          padding: 2px 6px;
          border-radius: var(--radius-full);
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-center__actions {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .notification-center__filter {
          background: none;
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notification-center__filter:hover {
          background: var(--color-muted);
          color: var(--color-text-primary);
        }

        .notification-center__close {
          background: none;
          border: none;
          color: var(--color-text-secondary);
          font-size: var(--text-lg);
          cursor: pointer;
          padding: var(--space-1);
          border-radius: var(--radius-sm);
          transition: all 0.2s ease;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-center__close:hover {
          background: var(--color-muted);
          color: var(--color-text-primary);
        }

        .notification-center__controls {
          display: flex;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-muted);
          flex-shrink: 0;
        }

        .notification-center__control-btn {
          background: none;
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notification-center__control-btn:hover {
          background: var(--color-card-background);
          color: var(--color-text-primary);
        }

        .notification-center__control-btn--danger {
          border-color: var(--color-error);
          color: var(--color-error);
        }

        .notification-center__control-btn--danger:hover {
          background: var(--color-error);
          color: white;
        }

        .notification-center__content {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .notification-center__empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-8);
          text-align: center;
          color: var(--color-text-secondary);
        }

        .notification-center__empty-icon {
          font-size: 3rem;
          margin-bottom: var(--space-4);
          opacity: 0.5;
        }

        .notification-center__list {
          padding: var(--space-2) 0;
        }

        /* 移动端优化 */
        @media (max-width: 640px) {
          .notification-center__panel {
            width: 100vw;
            border-left: none;
          }

          .notification-center__header {
            padding: var(--space-3);
            padding-top: calc(var(--space-3) + env(safe-area-inset-top, 0));
          }
        }
      `}</style>
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick, onRemove }) => {
  const { colorScheme } = useTelegramTheme();

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'promotion':
        return '🎉';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'success':
        return 'var(--color-success)';
      case 'error':
        return 'var(--color-error)';
      case 'warning':
        return 'var(--color-warning)';
      case 'promotion':
        return 'var(--color-primary)';
      case 'info':
      default:
        return 'var(--color-info)';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div
      className={`notification-item ${notification.read ? 'read' : 'unread'}`}
      onClick={() => onClick(notification)}
    >
      <div
        className="notification-item__indicator"
        style={{ backgroundColor: getNotificationColor() }}
      />

      <div className="notification-item__icon">{getNotificationIcon()}</div>

      <div className="notification-item__content">
        <div className="notification-item__header">
          <h4 className="notification-item__title">{notification.title}</h4>
          <span className="notification-item__time">{formatTime(notification.timestamp)}</span>
        </div>

        <p className="notification-item__message">{notification.message}</p>

        {notification.actions && notification.actions.length > 0 && (
          <div className="notification-item__actions">
            {notification.actions.map((action, index) => (
              <button
                key={index}
                className={`notification-item__action notification-item__action--${action.style || 'secondary'}`}
                onClick={e => {
                  e.stopPropagation();
                  action.onClick();
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        className="notification-item__remove"
        onClick={e => {
          e.stopPropagation();
          onRemove(notification.id);
        }}
        aria-label="Remove notification"
      >
        ✕
      </button>

      <style>{`
        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border);
          cursor: pointer;
          transition: background-color 0.2s ease;
          position: relative;
        }

        .notification-item:hover {
          background: var(--color-muted);
        }

        .notification-item.unread {
          background: var(--color-info-background);
        }

        .notification-item__indicator {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
        }

        .notification-item__icon {
          font-size: var(--text-lg);
          line-height: 1;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .notification-item__content {
          flex: 1;
          min-width: 0;
        }

        .notification-item__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-2);
          margin-bottom: var(--space-1);
        }

        .notification-item__title {
          margin: 0;
          font-size: var(--text-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          line-height: var(--leading-tight);
        }

        .notification-item__time {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .notification-item__message {
          margin: 0;
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          line-height: var(--leading-normal);
        }

        .notification-item__actions {
          display: flex;
          gap: var(--space-2);
          margin-top: var(--space-2);
        }

        .notification-item__action {
          padding: var(--space-1) var(--space-2);
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notification-item__action--primary {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .notification-item__action--secondary {
          background: transparent;
          color: var(--color-text-secondary);
          border-color: var(--color-border);
        }

        .notification-item__action--danger {
          background: var(--color-error);
          color: white;
          border-color: var(--color-error);
        }

        .notification-item__action:hover {
          transform: translateY(-1px);
        }

        .notification-item__remove {
          background: none;
          border: none;
          color: var(--color-text-tertiary);
          font-size: var(--text-sm);
          cursor: pointer;
          padding: var(--space-1);
          border-radius: var(--radius-sm);
          transition: all 0.2s ease;
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-item__remove:hover {
          background: var(--color-muted);
          color: var(--color-text-primary);
        }
      `}</style>
    </div>
  );
};
