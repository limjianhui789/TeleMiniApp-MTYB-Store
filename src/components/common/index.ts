// ============================================================================
// MTYB Virtual Goods Platform - Common Components Exports
// ============================================================================

// 原有组件
export { LoadingSpinner } from './LoadingSpinner';
export type { LoadingSpinnerProps } from './LoadingSpinner';
export { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
export { NotificationToast, NotificationContainer } from './NotificationToast';
export type { NotificationToastProps, NotificationContainerProps } from './NotificationToast';

// 新增加载状态组件
export {
  LoadingDots,
  LoadingPulse,
  LoadingPage,
  Skeleton,
  LoadingCard,
  LoadingOverlay,
} from './LoadingStates';

// 新增错误状态组件
export {
  ErrorPage,
  ErrorMessage,
  NetworkError,
  NotFoundError,
  ForbiddenError,
} from './ErrorStates';

// 全局错误处理
export { GlobalErrorProvider, ErrorReportingPanel, useErrorReporting } from './GlobalErrorHandler';

// 异步状态管理Hooks
export {
  useAsyncState,
  useFetch,
  useSubmit,
  useRetry,
  usePagination,
  type AsyncState,
  type AsyncStateOptions,
  type AsyncStateActions,
  type PaginatedData,
  type PaginationOptions,
} from '../../hooks/useAsyncState';

// Re-export existing components for convenience
export { Page } from '../Page';
export { Link } from '../Link/Link';
export { DisplayData } from '../DisplayData/DisplayData';
export { RGB } from '../RGB/RGB';

// 工具函数和配置
export interface LoadingConfig {
  showSpinner: boolean;
  showSkeleton: boolean;
  showProgress: boolean;
  spinnerSize: 'small' | 'medium' | 'large' | 'xlarge';
  skeletonRows: number;
  progressDelay: number;
}

export interface ErrorConfig {
  showErrorBoundary: boolean;
  showErrorMessages: boolean;
  enableErrorReporting: boolean;
  maxStoredErrors: number;
  retryAttempts: number;
  retryDelay: number;
}

export const LoadingUtils = {
  getLoadingText: (context: string): string => {
    const loadingMessages: Record<string, string> = {
      products: 'Loading products...',
      cart: 'Loading cart...',
      checkout: 'Processing checkout...',
      payment: 'Processing payment...',
      login: 'Signing in...',
      register: 'Creating account...',
      profile: 'Loading profile...',
      settings: 'Loading settings...',
      default: 'Loading...',
    };
    return loadingMessages[context] || loadingMessages.default;
  },

  createLoadingDelay: (minDelay: number = 300) => {
    return new Promise(resolve => setTimeout(resolve, minDelay));
  },

  simulateProgress: (callback: (progress: number) => void, duration: number = 2000) => {
    let progress = 0;
    const interval = 50;
    const increment = 100 / (duration / interval);

    const timer = setInterval(() => {
      progress += increment;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
      }
      callback(Math.round(progress));
    }, interval);

    return () => clearInterval(timer);
  },

  shouldShowSkeleton: (loadingTime: number, threshold: number = 500): boolean => {
    return loadingTime > threshold;
  },
};

export const ErrorUtils = {
  getErrorType: (
    error: Error
  ): 'network' | 'validation' | 'authentication' | 'permission' | 'server' | 'unknown' => {
    const message = error.message.toLowerCase();

    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection')
    ) {
      return 'network';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'authentication';
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return 'permission';
    }
    if (
      message.includes('server') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503')
    ) {
      return 'server';
    }

    return 'unknown';
  },

  getUserFriendlyMessage: (error: Error): string => {
    const type = ErrorUtils.getErrorType(error);

    const messages: Record<string, string> = {
      network: 'Network connection problem. Please check your internet connection.',
      validation: 'Please check your input and try again.',
      authentication: 'Please sign in to continue.',
      permission: 'You do not have permission to perform this action.',
      server: 'Server is temporarily unavailable. Please try again later.',
      unknown: 'An unexpected error occurred. Please try again.',
    };

    return messages[type];
  },

  isRetryable: (error: Error): boolean => {
    const type = ErrorUtils.getErrorType(error);
    return ['network', 'server'].includes(type);
  },

  createErrorReport: (error: Error, context?: string) => ({
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    type: ErrorUtils.getErrorType(error),
  }),
};
