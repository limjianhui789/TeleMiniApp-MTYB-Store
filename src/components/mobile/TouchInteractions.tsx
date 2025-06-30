import React, { useState, useEffect, useCallback } from 'react';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';

interface TouchInteractionsProps {
  children: React.ReactNode;
  enableHaptic?: boolean;
  enableSwipeGestures?: boolean;
  enablePullToRefresh?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPullToRefresh?: () => Promise<void>;
  className?: string;
}

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  isPullToRefresh: boolean;
}

export const TouchInteractions: React.FC<TouchInteractionsProps> = ({
  children,
  enableHaptic = true,
  enableSwipeGestures = true,
  enablePullToRefresh = false,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPullToRefresh,
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    isPullToRefresh: false,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshOffset, setRefreshOffset] = useState(0);

  // 触觉反馈
  const triggerHaptic = useCallback(
    (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
      if (!enableHaptic) return;

      try {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          switch (type) {
            case 'light':
              window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
              break;
            case 'medium':
              window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
              break;
            case 'heavy':
              window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
              break;
            case 'success':
              window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
              break;
            case 'warning':
              window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
              break;
            case 'error':
              window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
              break;
          }
        }
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    },
    [enableHaptic]
  );

  // 手势检测参数
  const SWIPE_THRESHOLD = 50; // 最小滑动距离
  const SWIPE_VELOCITY_THRESHOLD = 0.3; // 滑动速度阈值
  const PULL_TO_REFRESH_THRESHOLD = 80; // 下拉刷新阈值

  // 触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isDragging: true,
      isPullToRefresh: false,
    });
  }, []);

  // 触摸移动
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchState.isDragging) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - touchState.startY;

      setTouchState(prev => ({
        ...prev,
        currentX: touch.clientX,
        currentY: touch.clientY,
      }));

      // 下拉刷新检测
      if (enablePullToRefresh && deltaY > 0 && window.scrollY === 0) {
        e.preventDefault();
        const offset = Math.min(deltaY * 0.5, PULL_TO_REFRESH_THRESHOLD * 1.5);
        setRefreshOffset(offset);

        if (offset >= PULL_TO_REFRESH_THRESHOLD && !touchState.isPullToRefresh) {
          setTouchState(prev => ({ ...prev, isPullToRefresh: true }));
          triggerHaptic('medium');
        } else if (offset < PULL_TO_REFRESH_THRESHOLD && touchState.isPullToRefresh) {
          setTouchState(prev => ({ ...prev, isPullToRefresh: false }));
        }
      }
    },
    [touchState, enablePullToRefresh, triggerHaptic]
  );

  // 触摸结束
  const handleTouchEnd = useCallback(async () => {
    if (!touchState.isDragging) return;

    const deltaX = touchState.currentX - touchState.startX;
    const deltaY = touchState.currentY - touchState.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // 处理下拉刷新
    if (enablePullToRefresh && touchState.isPullToRefresh && onPullToRefresh) {
      setIsRefreshing(true);
      triggerHaptic('success');
      try {
        await onPullToRefresh();
      } catch (error) {
        triggerHaptic('error');
      } finally {
        setIsRefreshing(false);
        setRefreshOffset(0);
      }
    } else {
      setRefreshOffset(0);
    }

    // 处理滑动手势
    if (enableSwipeGestures && (absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD)) {
      if (absX > absY) {
        // 水平滑动
        if (deltaX > 0 && onSwipeRight) {
          triggerHaptic('light');
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          triggerHaptic('light');
          onSwipeLeft();
        }
      } else {
        // 垂直滑动
        if (deltaY > 0 && onSwipeDown) {
          triggerHaptic('light');
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          triggerHaptic('light');
          onSwipeUp();
        }
      }
    }

    setTouchState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
      isPullToRefresh: false,
    });
  }, [
    touchState,
    enableSwipeGestures,
    enablePullToRefresh,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPullToRefresh,
    triggerHaptic,
  ]);

  return (
    <div
      className={`touch-interactions ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: refreshOffset > 0 ? `translateY(${refreshOffset}px)` : undefined,
        transition: touchState.isDragging ? 'none' : 'transform 0.3s ease',
      }}
    >
      {/* 下拉刷新指示器 */}
      {enablePullToRefresh && (
        <div className="pull-to-refresh-indicator">
          <div
            className={`refresh-icon ${isRefreshing ? 'refreshing' : ''} ${touchState.isPullToRefresh ? 'ready' : ''}`}
            style={{ opacity: Math.min(refreshOffset / PULL_TO_REFRESH_THRESHOLD, 1) }}
          >
            {isRefreshing ? '⏳' : '↓'}
          </div>
          <div className="refresh-text">
            {isRefreshing
              ? 'Refreshing...'
              : touchState.isPullToRefresh
                ? 'Release to refresh'
                : 'Pull to refresh'}
          </div>
        </div>
      )}

      {children}

      <style>{`
        .touch-interactions {
          position: relative;
          width: 100%;
          height: 100%;
          touch-action: pan-y;
          -webkit-overflow-scrolling: touch;
        }

        .pull-to-refresh-indicator {
          position: absolute;
          top: -60px;
          left: 0;
          right: 0;
          height: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--color-card-background);
          border-radius: 0 0 var(--radius-lg) var(--radius-lg);
          box-shadow: var(--shadow-sm);
          z-index: 10;
        }

        .refresh-icon {
          font-size: var(--text-xl);
          margin-bottom: var(--space-1);
          transition: transform 0.3s ease;
        }

        .refresh-icon.ready {
          transform: rotate(180deg);
        }

        .refresh-icon.refreshing {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .refresh-text {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          font-weight: var(--font-weight-medium);
        }

        /* 移动端优化 */
        @media (max-width: 768px) {
          .touch-interactions {
            touch-action: manipulation;
          }
        }

        /* 防止选择文本 */
        .touch-interactions * {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        /* 允许输入框选择文本 */
        .touch-interactions input,
        .touch-interactions textarea,
        .touch-interactions [contenteditable] {
          -webkit-user-select: text;
          -khtml-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }
      `}</style>
    </div>
  );
};

// 移动端触摸优化的 Hook
export const useMobileInteractions = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );
      setIsMobile(mobile);
    };

    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    checkMobile();
    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const preventZoom = useCallback((e: Event) => {
    if (e instanceof TouchEvent && e.touches.length > 1) {
      e.preventDefault();
    }
  }, []);

  const preventPinchZoom = useCallback(() => {
    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchmove', preventZoom);
    };
  }, [preventZoom]);

  return {
    isMobile,
    orientation,
    preventPinchZoom,
  };
};
