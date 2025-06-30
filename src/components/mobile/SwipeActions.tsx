import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';

interface SwipeAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  backgroundColor: string;
  onClick: () => void;
}

interface SwipeActionsProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export const SwipeActions: React.FC<SwipeActionsProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  disabled = false,
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [revealed, setRevealed] = useState<'left' | 'right' | null>(null);

  const triggerHaptic = useCallback((type: 'light' | 'medium' = 'light') => {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }, []);

  const reset = useCallback(() => {
    setTranslateX(0);
    setRevealed(null);
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      const touch = e.touches[0];
      setStartX(touch.clientX);
      setIsDragging(true);
    },
    [disabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || disabled) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;

      // 限制滑动范围
      const maxLeftSwipe = leftActions.length > 0 ? leftActions.length * 80 : 0;
      const maxRightSwipe = rightActions.length > 0 ? rightActions.length * 80 : 0;

      const clampedDeltaX = Math.max(-maxRightSwipe, Math.min(maxLeftSwipe, deltaX));
      setTranslateX(clampedDeltaX);

      // 触觉反馈
      if (Math.abs(clampedDeltaX) >= threshold && !revealed) {
        const direction = clampedDeltaX > 0 ? 'left' : 'right';
        if (
          (direction === 'left' && leftActions.length > 0) ||
          (direction === 'right' && rightActions.length > 0)
        ) {
          setRevealed(direction);
          triggerHaptic('medium');
        }
      } else if (Math.abs(clampedDeltaX) < threshold && revealed) {
        setRevealed(null);
      }
    },
    [
      isDragging,
      disabled,
      startX,
      leftActions.length,
      rightActions.length,
      threshold,
      revealed,
      triggerHaptic,
    ]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || disabled) return;

    setIsDragging(false);

    // 决定是否显示操作按钮
    if (Math.abs(translateX) >= threshold) {
      const direction = translateX > 0 ? 'left' : 'right';
      const actions = direction === 'left' ? leftActions : rightActions;

      if (actions.length > 0) {
        const actionWidth = 80;
        const targetTranslate =
          direction === 'left' ? actions.length * actionWidth : -actions.length * actionWidth;
        setTranslateX(targetTranslate);
        setRevealed(direction);
      } else {
        reset();
      }
    } else {
      reset();
    }
  }, [isDragging, disabled, translateX, threshold, leftActions, rightActions, reset]);

  const handleActionClick = useCallback(
    (action: SwipeAction) => {
      triggerHaptic('light');
      action.onClick();
      reset();
    },
    [triggerHaptic, reset]
  );

  // 点击外部区域重置
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        reset();
      }
    };

    if (revealed) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [revealed, reset]);

  return (
    <div ref={containerRef} className={`swipe-actions ${className}`}>
      {/* 左侧操作 */}
      {leftActions.length > 0 && (
        <div
          className="swipe-actions__left"
          style={{
            width: leftActions.length * 80,
            transform: `translateX(${Math.min(0, translateX - leftActions.length * 80)}px)`,
          }}
        >
          {leftActions.map((action, index) => (
            <button
              key={action.id}
              className="swipe-action"
              style={{
                backgroundColor: action.backgroundColor,
                color: action.color,
              }}
              onClick={() => handleActionClick(action)}
            >
              <span className="swipe-action__icon">{action.icon}</span>
              <span className="swipe-action__label">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 右侧操作 */}
      {rightActions.length > 0 && (
        <div
          className="swipe-actions__right"
          style={{
            width: rightActions.length * 80,
            transform: `translateX(${Math.max(0, translateX + rightActions.length * 80)}px)`,
          }}
        >
          {rightActions.map((action, index) => (
            <button
              key={action.id}
              className="swipe-action"
              style={{
                backgroundColor: action.backgroundColor,
                color: action.color,
              }}
              onClick={() => handleActionClick(action)}
            >
              <span className="swipe-action__icon">{action.icon}</span>
              <span className="swipe-action__label">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 主内容 */}
      <div
        className="swipe-actions__content"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      <style>{`
        .swipe-actions {
          position: relative;
          overflow: hidden;
          background: var(--color-card-background);
          touch-action: pan-y;
        }

        .swipe-actions__left,
        .swipe-actions__right {
          position: absolute;
          top: 0;
          bottom: 0;
          display: flex;
          align-items: stretch;
          z-index: 1;
        }

        .swipe-actions__left {
          left: 0;
        }

        .swipe-actions__right {
          right: 0;
        }

        .swipe-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 80px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--font-family-base);
          gap: var(--space-1);
        }

        .swipe-action:hover {
          filter: brightness(0.9);
        }

        .swipe-action:active {
          transform: scale(0.95);
        }

        .swipe-action__icon {
          font-size: var(--text-lg);
          line-height: 1;
        }

        .swipe-action__label {
          font-size: var(--text-xs);
          font-weight: var(--font-weight-medium);
          line-height: 1;
          white-space: nowrap;
        }

        .swipe-actions__content {
          position: relative;
          z-index: 2;
          background: var(--color-card-background);
          width: 100%;
          touch-action: pan-y;
        }

        /* 防止文本选择 */
        .swipe-actions * {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        /* 允许输入框选择文本 */
        .swipe-actions input,
        .swipe-actions textarea {
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }
      `}</style>
    </div>
  );
};

// 常用的滑动操作配置
export const SwipeActionPresets = {
  delete: {
    id: 'delete',
    label: 'Delete',
    icon: '🗑️',
    color: 'white',
    backgroundColor: 'var(--color-error)',
    onClick: () => {},
  },

  edit: {
    id: 'edit',
    label: 'Edit',
    icon: '✏️',
    color: 'white',
    backgroundColor: 'var(--color-primary)',
    onClick: () => {},
  },

  archive: {
    id: 'archive',
    label: 'Archive',
    icon: '📦',
    color: 'white',
    backgroundColor: 'var(--color-warning)',
    onClick: () => {},
  },

  favorite: {
    id: 'favorite',
    label: 'Favorite',
    icon: '❤️',
    color: 'white',
    backgroundColor: 'var(--color-success)',
    onClick: () => {},
  },

  share: {
    id: 'share',
    label: 'Share',
    icon: '📤',
    color: 'white',
    backgroundColor: 'var(--color-info)',
    onClick: () => {},
  },
};
