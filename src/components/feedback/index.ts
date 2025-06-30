// 用户反馈和通知系统导出

export { ToastProvider, useToast, toast } from './Toast';

export { Rating, FeedbackForm } from './Rating';

export { NotificationProvider, NotificationCenter, useNotifications } from './NotificationCenter';

// 反馈和通知相关类型
export interface FeedbackData {
  rating: number;
  category: string;
  message: string;
  email?: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface NotificationConfig {
  enableToasts: boolean;
  enableNotificationCenter: boolean;
  enableHapticFeedback: boolean;
  maxNotifications: number;
  defaultToastDuration: number;
  persistNotifications: boolean;
}

// 反馈和通知工具函数
export const FeedbackUtils = {
  // 创建标准化的反馈数据
  createFeedback: (data: Partial<FeedbackData>): FeedbackData => ({
    rating: 0,
    category: 'General',
    message: '',
    timestamp: new Date(),
    ...data,
  }),

  // 验证反馈数据
  validateFeedback: (feedback: FeedbackData): boolean => {
    return (
      feedback.rating > 0 &&
      feedback.rating <= 5 &&
      feedback.message.trim().length > 0 &&
      feedback.category.trim().length > 0
    );
  },

  // 格式化反馈用于显示
  formatFeedback: (feedback: FeedbackData): string => {
    return `Rating: ${feedback.rating}/5\nCategory: ${feedback.category}\nMessage: ${feedback.message}`;
  },

  // 生成反馈摘要
  generateFeedbackSummary: (
    feedbacks: FeedbackData[]
  ): {
    averageRating: number;
    totalCount: number;
    categoryBreakdown: Record<string, number>;
    recentFeedbacks: FeedbackData[];
  } => {
    if (feedbacks.length === 0) {
      return {
        averageRating: 0,
        totalCount: 0,
        categoryBreakdown: {},
        recentFeedbacks: [],
      };
    }

    const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
    const categoryBreakdown = feedbacks.reduce(
      (acc, f) => {
        acc[f.category] = (acc[f.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const recentFeedbacks = feedbacks
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalCount: feedbacks.length,
      categoryBreakdown,
      recentFeedbacks,
    };
  },

  // 创建标准化的通知
  createNotification: (
    type: 'info' | 'success' | 'warning' | 'error' | 'promotion',
    title: string,
    message: string,
    options?: {
      persistent?: boolean;
      actions?: Array<{
        label: string;
        onClick: () => void;
        style?: 'primary' | 'secondary' | 'danger';
      }>;
      metadata?: Record<string, any>;
    }
  ) => ({
    type,
    title,
    message,
    persistent: options?.persistent || false,
    actions: options?.actions || [],
    metadata: options?.metadata || {},
  }),

  // 反馈分类预设
  feedbackCategories: [
    'General',
    'Bug Report',
    'Feature Request',
    'Performance',
    'UI/UX',
    'Payment',
    'Product Quality',
    'Customer Service',
    'Shipping',
    'Other',
  ],

  // 反馈评级标签
  ratingLabels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],

  // 通知类型图标
  notificationIcons: {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    promotion: '🎉',
  },

  // 触觉反馈辅助
  hapticFeedback: {
    success: () => {
      try {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
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

    warning: () => {
      try {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
        }
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    },

    light: () => {
      try {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    },
  },

  // 本地存储键
  storageKeys: {
    notifications: 'mtyb-notifications',
    feedbacks: 'mtyb-feedbacks',
    userPreferences: 'mtyb-feedback-preferences',
  },

  // 默认配置
  defaultConfig: {
    enableToasts: true,
    enableNotificationCenter: true,
    enableHapticFeedback: true,
    maxNotifications: 50,
    defaultToastDuration: 4000,
    persistNotifications: true,
  } as NotificationConfig,
};
