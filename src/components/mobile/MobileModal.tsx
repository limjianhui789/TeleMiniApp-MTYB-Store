import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  position?: 'bottom' | 'center' | 'top';
  allowSwipeToClose?: boolean;
  showCloseButton?: boolean;
  backdrop?: 'dark' | 'light' | 'blur';
  className?: string;
}

export const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  position = 'bottom',
  allowSwipeToClose = true,
  showCloseButton = true,
  backdrop = 'dark',
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [startY, setStartY] = useState(0);

  const triggerHaptic = useCallback((type: 'light' | 'medium' = 'light') => {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }, []);

  // 处理打开/关闭动画
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      triggerHaptic('light');
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [isOpen, triggerHaptic]);

  // ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 滑动关闭手势
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!allowSwipeToClose || position !== 'bottom') return;

      const touch = e.touches[0];
      setStartY(touch.clientY);
      setIsDragging(true);
    },
    [allowSwipeToClose, position]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !allowSwipeToClose) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - startY;

      // 只允许向下滑动
      if (deltaY > 0) {
        setTranslateY(deltaY);
      }
    },
    [isDragging, allowSwipeToClose, startY]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // 如果滑动距离超过阈值，关闭模态框
    if (translateY > 100) {
      triggerHaptic('medium');
      onClose();
    }

    setTranslateY(0);
  }, [isDragging, translateY, onClose, triggerHaptic]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const getModalHeight = () => {
    switch (size) {
      case 'small':
        return 'auto';
      case 'medium':
        return '60vh';
      case 'large':
        return '80vh';
      case 'fullscreen':
        return '100vh';
      default:
        return '60vh';
    }
  };

  const getModalPosition = () => {
    switch (position) {
      case 'top':
        return { top: 0, transform: 'translateX(-50%)' };
      case 'center':
        return { top: '50%', transform: 'translate(-50%, -50%)' };
      case 'bottom':
        return { bottom: 0, transform: 'translateX(-50%)' };
      default:
        return { bottom: 0, transform: 'translateX(-50%)' };
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`mobile-modal-overlay ${backdrop} ${isOpen ? 'open' : ''}`}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`mobile-modal ${size} ${position} ${isOpen ? 'open' : ''} ${className}`}
        style={{
          ...getModalPosition(),
          height: getModalHeight(),
          transform: `${getModalPosition().transform} translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'all 0.3s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 滑动指示器 (仅底部模态框) */}
        {position === 'bottom' && allowSwipeToClose && <div className="modal-drag-indicator" />}

        {/* 头部 */}
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && <h2 className="modal-title">{title}</h2>}
            {showCloseButton && (
              <button className="modal-close-button" onClick={onClose} aria-label="Close modal">
                ✕
              </button>
            )}
          </div>
        )}

        {/* 内容 */}
        <div className="modal-content">{children}</div>
      </div>

      <style>{`
        .mobile-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .mobile-modal-overlay.dark {
          background: rgba(0, 0, 0, 0.5);
        }

        .mobile-modal-overlay.light {
          background: rgba(255, 255, 255, 0.8);
        }

        .mobile-modal-overlay.blur {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .mobile-modal-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .mobile-modal {
          position: absolute;
          left: 50%;
          width: 100%;
          max-width: min(500px, 100vw);
          background: var(--color-card-background);
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          box-shadow: var(--shadow-xl);
          transform: translateX(-50%) translateY(100%);
          transition: transform 0.3s ease;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }

        .mobile-modal.center {
          border-radius: var(--radius-lg);
          max-height: 80vh;
        }

        .mobile-modal.top {
          border-radius: 0 0 var(--radius-lg) var(--radius-lg);
        }

        .mobile-modal.fullscreen {
          border-radius: 0;
          max-height: 100vh;
        }

        .mobile-modal.open {
          transform: translateX(-50%) translateY(0);
        }

        .mobile-modal.center.open {
          transform: translate(-50%, -50%);
        }

        .mobile-modal.top.open {
          transform: translateX(-50%) translateY(0);
        }

        .modal-drag-indicator {
          width: 40px;
          height: 4px;
          background: var(--color-text-tertiary);
          border-radius: 2px;
          margin: var(--space-2) auto var(--space-1);
          opacity: 0.5;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4) var(--space-4) var(--space-2);
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .modal-title {
          margin: 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .modal-close-button {
          width: 32px;
          height: 32px;
          border: none;
          background: var(--color-muted);
          color: var(--color-text-secondary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: var(--text-sm);
        }

        .modal-close-button:hover {
          background: var(--color-text-tertiary);
          color: white;
        }

        .modal-close-button:active {
          transform: scale(0.95);
        }

        .modal-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-4);
          -webkit-overflow-scrolling: touch;
        }

        /* 小屏幕优化 */
        @media (max-width: 480px) {
          .mobile-modal {
            max-width: 100vw;
            width: 100%;
          }

          .modal-content {
            padding: var(--space-3);
          }
        }

        /* 安全区域适配 */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .mobile-modal.bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }

        /* 防止背景滚动 */
        body:has(.mobile-modal-overlay.open) {
          overflow: hidden;
          touch-action: none;
        }

        /* 防止选择 */
        .mobile-modal * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
};

// 移动端操作表组件
export const ActionSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: Array<{
    label: string;
    icon?: string;
    onClick: () => void;
    destructive?: boolean;
    disabled?: boolean;
  }>;
  cancelLabel?: string;
}> = ({ isOpen, onClose, title, actions, cancelLabel = 'Cancel' }) => {
  const triggerHaptic = useCallback(() => {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }, []);

  const handleActionClick = useCallback(
    (action: (typeof actions)[0]) => {
      if (action.disabled) return;

      triggerHaptic();
      action.onClick();
      onClose();
    },
    [triggerHaptic, onClose]
  );

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      size="small"
      position="bottom"
      showCloseButton={false}
      className="action-sheet"
    >
      {title && <div className="action-sheet-title">{title}</div>}

      <div className="action-sheet-actions">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`action-sheet-button ${action.destructive ? 'destructive' : ''} ${action.disabled ? 'disabled' : ''}`}
            onClick={() => handleActionClick(action)}
            disabled={action.disabled}
          >
            {action.icon && <span className="action-icon">{action.icon}</span>}
            <span className="action-label">{action.label}</span>
          </button>
        ))}
      </div>

      <div className="action-sheet-cancel">
        <button className="action-sheet-button cancel" onClick={onClose}>
          {cancelLabel}
        </button>
      </div>

      <style>{`
        .action-sheet .modal-content {
          padding: 0;
        }

        .action-sheet-title {
          padding: var(--space-4) var(--space-4) var(--space-2);
          text-align: center;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          border-bottom: 1px solid var(--color-border);
        }

        .action-sheet-actions {
          padding: var(--space-2) 0;
        }

        .action-sheet-button {
          width: 100%;
          padding: var(--space-4);
          border: none;
          background: none;
          color: var(--color-text-primary);
          font-size: var(--text-base);
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: var(--space-3);
          transition: background-color 0.2s ease;
          min-height: var(--touch-target-min);
        }

        .action-sheet-button:hover {
          background: var(--color-muted);
        }

        .action-sheet-button:active {
          background: var(--color-border);
        }

        .action-sheet-button.destructive {
          color: var(--color-error);
        }

        .action-sheet-button.disabled {
          color: var(--color-text-tertiary);
          cursor: not-allowed;
        }

        .action-sheet-button.disabled:hover {
          background: none;
        }

        .action-sheet-cancel {
          border-top: 1px solid var(--color-border);
          margin-top: var(--space-2);
        }

        .action-sheet-button.cancel {
          justify-content: center;
          font-weight: var(--font-weight-semibold);
          color: var(--color-primary);
        }

        .action-icon {
          font-size: var(--text-lg);
          width: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-label {
          flex: 1;
        }
      `}</style>
    </MobileModal>
  );
};
