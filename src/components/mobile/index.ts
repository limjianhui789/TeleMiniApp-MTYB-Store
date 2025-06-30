// 移动端交互优化组件导出

export { TouchInteractions, useMobileInteractions } from './TouchInteractions';
export { BottomNavigation, FloatingActionButton } from './BottomNavigation';
export { SwipeActions, SwipeActionPresets } from './SwipeActions';
export { MobileModal, ActionSheet } from './MobileModal';

// 移动端交互优化类型
export interface MobileInteractionConfig {
  enableHapticFeedback: boolean;
  enableSwipeGestures: boolean;
  enablePullToRefresh: boolean;
  enableTouchOptimization: boolean;
}

// 移动端交互优化工具函数
export const MobileUtils = {
  // 检测是否为移动设备
  isMobileDevice: (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  },

  // 检测是否为触摸设备
  isTouchDevice: (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  // 检测是否为iOS
  isIOS: (): boolean => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  // 检测是否为Android
  isAndroid: (): boolean => {
    return /Android/.test(navigator.userAgent);
  },

  // 检测是否在Telegram WebApp中
  isTelegramWebApp: (): boolean => {
    return typeof window !== 'undefined' && window.Telegram?.WebApp !== undefined;
  },

  // 获取安全区域信息
  getSafeAreaInsets: () => {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
    };
  },

  // 防止双击缩放
  preventDoubleClickZoom: () => {
    let lastTouchEnd = 0;
    document.addEventListener(
      'touchend',
      event => {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      },
      false
    );
  },

  // 防止长按选择
  preventLongPressSelect: () => {
    document.addEventListener('selectstart', e => e.preventDefault());
    document.addEventListener('contextmenu', e => e.preventDefault());
  },

  // 优化滚动性能
  optimizeScrolling: () => {
    // 添加 -webkit-overflow-scrolling: touch 到所有滚动容器
    const scrollableElements = document.querySelectorAll('[style*="overflow"]');
    scrollableElements.forEach(element => {
      (element as HTMLElement).style.webkitOverflowScrolling = 'touch';
    });
  },

  // 设置移动端视口
  setMobileViewport: () => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    } else {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content =
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      document.head.appendChild(meta);
    }
  },

  // 触觉反馈辅助函数
  hapticFeedback: {
    light: () => {
      try {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    },

    medium: () => {
      try {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    },

    heavy: () => {
      try {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
        }
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    },

    success: () => {
      try {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    },

    warning: () => {
      try {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
        }
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    },

    error: () => {
      try {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    },
  },
};
