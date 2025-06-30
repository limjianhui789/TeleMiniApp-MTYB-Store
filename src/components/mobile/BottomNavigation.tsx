import React, { useState, useCallback } from 'react';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  onClick: () => void;
}

interface BottomNavigationProps {
  items: NavItem[];
  activeItem: string;
  className?: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeItem,
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();
  const [pressedItem, setPressedItem] = useState<string | null>(null);

  const triggerHaptic = useCallback(() => {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }, []);

  const handleItemPress = useCallback(
    (item: NavItem) => {
      setPressedItem(item.id);
      triggerHaptic();

      setTimeout(() => {
        setPressedItem(null);
        item.onClick();
      }, 150);
    },
    [triggerHaptic]
  );

  return (
    <div className={`bottom-navigation ${className}`}>
      <div className="bottom-navigation__container">
        {items.map(item => {
          const isActive = item.id === activeItem;
          const isPressed = item.id === pressedItem;

          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''} ${isPressed ? 'pressed' : ''}`}
              onClick={() => handleItemPress(item)}
              aria-label={item.label}
            >
              <div className="nav-item__icon-container">
                <span className="nav-item__icon">{item.icon}</span>
                {item.badge && item.badge > 0 && (
                  <span className="nav-item__badge">{item.badge > 99 ? '99+' : item.badge}</span>
                )}
              </div>
              <span className="nav-item__label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .bottom-navigation {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: var(--color-card-background);
          border-top: 1px solid var(--color-border);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding-bottom: env(safe-area-inset-bottom, 0);
        }

        .bottom-navigation__container {
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: var(--space-2) var(--space-4);
          max-width: var(--max-width-container);
          margin: 0 auto;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-2);
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: var(--radius-md);
          min-width: var(--touch-target-min);
          min-height: var(--touch-target-min);
          color: var(--color-text-tertiary);
          position: relative;
        }

        .nav-item:hover {
          background: var(--color-muted);
        }

        .nav-item.active {
          color: var(--color-primary);
        }

        .nav-item.pressed {
          transform: scale(0.95);
          background: var(--color-primary-light);
        }

        .nav-item__icon-container {
          position: relative;
          margin-bottom: var(--space-1);
        }

        .nav-item__icon {
          font-size: var(--text-xl);
          display: block;
          transition: transform 0.2s ease;
        }

        .nav-item.active .nav-item__icon {
          transform: scale(1.1);
        }

        .nav-item__badge {
          position: absolute;
          top: -6px;
          right: -6px;
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
          line-height: 1;
          box-shadow: 0 0 0 2px var(--color-card-background);
        }

        .nav-item__label {
          font-size: var(--text-xs);
          font-weight: var(--font-weight-medium);
          line-height: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 60px;
        }

        .nav-item.active .nav-item__label {
          font-weight: var(--font-weight-semibold);
        }

        /* iPhone X+ 底部安全区域适配 */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .bottom-navigation {
            padding-bottom: calc(env(safe-area-inset-bottom) + var(--space-2));
          }
        }

        /* 深色模式优化 */
        @media (prefers-color-scheme: dark) {
          .bottom-navigation {
            background: rgba(var(--color-card-background-rgb), 0.9);
          }
        }

        /* 平板适配 */
        @media (min-width: 768px) {
          .bottom-navigation {
            display: none;
          }
        }

        /* 防止选择 */
        .bottom-navigation * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
};

// 移动端浮动操作按钮
export const FloatingActionButton: React.FC<{
  icon: string;
  onClick: () => void;
  badge?: number;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
}> = ({ icon, onClick, badge, position = 'bottom-right', className = '' }) => {
  const { colorScheme } = useTelegramTheme();
  const [isPressed, setIsPressed] = useState(false);

  const triggerHaptic = useCallback(() => {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }, []);

  const handlePress = useCallback(() => {
    setIsPressed(true);
    triggerHaptic();

    setTimeout(() => {
      setIsPressed(false);
      onClick();
    }, 150);
  }, [onClick, triggerHaptic]);

  return (
    <button
      className={`floating-action-button ${position} ${isPressed ? 'pressed' : ''} ${className}`}
      onClick={handlePress}
      aria-label="Floating action"
    >
      <span className="fab__icon">{icon}</span>
      {badge && badge > 0 && <span className="fab__badge">{badge > 99 ? '99+' : badge}</span>}

      <style>{`
        .floating-action-button {
          position: fixed;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--color-primary);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-lg);
          transition: all 0.3s ease;
          z-index: 90;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .floating-action-button:hover {
          background: var(--color-primary-dark);
          transform: scale(1.05);
        }

        .floating-action-button.pressed {
          transform: scale(0.95);
        }

        .floating-action-button.bottom-right {
          bottom: calc(var(--space-6) + env(safe-area-inset-bottom, 0));
          right: var(--space-6);
        }

        .floating-action-button.bottom-left {
          bottom: calc(var(--space-6) + env(safe-area-inset-bottom, 0));
          left: var(--space-6);
        }

        .floating-action-button.bottom-center {
          bottom: calc(var(--space-6) + env(safe-area-inset-bottom, 0));
          left: 50%;
          transform: translateX(-50%);
        }

        .floating-action-button.bottom-center.pressed {
          transform: translateX(-50%) scale(0.95);
        }

        .fab__icon {
          font-size: var(--text-xl);
          line-height: 1;
        }

        .fab__badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--color-error);
          color: white;
          font-size: var(--text-xs);
          font-weight: var(--font-weight-bold);
          padding: 2px 6px;
          border-radius: var(--radius-full);
          min-width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          box-shadow: 0 0 0 2px var(--color-primary);
        }

        /* 平板隐藏 */
        @media (min-width: 768px) {
          .floating-action-button {
            display: none;
          }
        }

        /* 防止选择 */
        .floating-action-button * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>
    </button>
  );
};
