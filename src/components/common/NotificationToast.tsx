// ============================================================================
// MTYB Virtual Goods Platform - Notification Toast Component
// ============================================================================

import React, { useEffect, useState } from 'react';
import { type Notification } from '../../types';
import './NotificationToast.css';

export interface NotificationToastProps {
  notification: Notification;
  onClose: (id: string) => void;
  autoClose?: boolean;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  autoClose = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && notification.duration) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [notification.duration, autoClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose(notification.id);
    }, 300); // Wait for animation to complete
  };

  return (
    <div
      className={`notification-toast ${isVisible ? 'visible' : 'hidden'} notification-toast--${notification.type}`}
    >
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--tg-theme-bg-color)',
          border: '1px solid var(--tg-theme-hint-color)',
          borderRadius: '8px',
          marginBottom: '8px',
          position: 'relative',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{notification.title}</div>
        <div style={{ fontSize: '14px', opacity: 0.8 }}>{notification.message}</div>
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: 'var(--tg-theme-hint-color)',
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export interface NotificationContainerProps {
  notifications: Notification[];
  onClose: (id: string) => void;
  position?: 'top' | 'bottom';
  maxNotifications?: number;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onClose,
  position = 'top',
  maxNotifications = 5,
}) => {
  const visibleNotifications = notifications.slice(0, maxNotifications);

  return (
    <div className={`notification-container notification-container--${position}`}>
      {visibleNotifications.map(notification => (
        <NotificationToast key={notification.id} notification={notification} onClose={onClose} />
      ))}
    </div>
  );
};

export default NotificationToast;
