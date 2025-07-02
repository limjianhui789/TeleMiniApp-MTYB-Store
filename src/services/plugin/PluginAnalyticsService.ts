/**
 * Plugin Analytics Service - 插件分析服务
 * 收集和分析插件使用数据，提供统计报告
 */

export interface PluginUsageEvent {
  pluginId: string;
  eventType: 'install' | 'uninstall' | 'activate' | 'deactivate' | 'execute' | 'error';
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PluginAnalytics {
  pluginId: string;
  totalInstalls: number;
  activeUsers: number;
  totalExecutions: number;
  errorRate: number;
  avgExecutionTime: number;
  popularFeatures: string[];
  userRetentionRate: number;
  lastUpdated: Date;
}

export interface CategoryAnalytics {
  category: string;
  totalPlugins: number;
  totalInstalls: number;
  avgRating: number;
  popularPlugins: string[];
  growthRate: number;
}

export interface PlatformMetrics {
  totalPlugins: number;
  totalDownloads: number;
  totalActiveUsers: number;
  totalDevelopers: number;
  avgPluginRating: number;
  categoryBreakdown: CategoryAnalytics[];
  topPerformingPlugins: PluginAnalytics[];
  recentTrends: {
    period: string;
    downloads: number;
    newPlugins: number;
    activeUsers: number;
  }[];
}

export class PluginAnalyticsService {
  private events: PluginUsageEvent[] = [];
  private analytics: Map<string, PluginAnalytics> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // 生成一些模拟的使用事件
    const sampleEvents: PluginUsageEvent[] = [
      {
        pluginId: 'vpn-premium-pro',
        eventType: 'install',
        userId: 'user-001',
        timestamp: new Date('2024-02-01'),
        metadata: { source: 'featured' },
      },
      {
        pluginId: 'vpn-premium-pro',
        eventType: 'execute',
        userId: 'user-001',
        timestamp: new Date('2024-02-01'),
        metadata: { executionTime: 250 },
      },
      {
        pluginId: 'streaming-plus',
        eventType: 'install',
        userId: 'user-002',
        timestamp: new Date('2024-02-05'),
        metadata: { source: 'search' },
      },
    ];

    this.events.push(...sampleEvents);

    // 生成分析数据
    this.generateAnalytics();
  }

  async trackEvent(event: PluginUsageEvent): Promise<void> {
    this.events.push(event);

    // 实时更新分析数据
    await this.updatePluginAnalytics(event.pluginId);

    // 模拟数据持久化
    await this.simulateAsyncOperation(100);
  }

  async getPluginAnalytics(pluginId: string): Promise<PluginAnalytics | null> {
    await this.simulateAsyncOperation(300);
    return this.analytics.get(pluginId) || null;
  }

  async getCategoryAnalytics(): Promise<CategoryAnalytics[]> {
    await this.simulateAsyncOperation(500);

    // 模拟分类分析数据
    return [
      {
        category: 'vpn',
        totalPlugins: 25,
        totalInstalls: 45620,
        avgRating: 4.3,
        popularPlugins: ['vpn-premium-pro', 'secure-vpn-lite'],
        growthRate: 15.2,
      },
      {
        category: 'streaming',
        totalPlugins: 18,
        totalInstalls: 32140,
        avgRating: 4.1,
        popularPlugins: ['streaming-plus', 'media-unlocker'],
        growthRate: 22.8,
      },
      {
        category: 'gaming',
        totalPlugins: 35,
        totalInstalls: 67890,
        avgRating: 4.5,
        popularPlugins: ['game-launcher-deluxe', 'steam-enhancer'],
        growthRate: 8.7,
      },
      {
        category: 'productivity',
        totalPlugins: 42,
        totalInstalls: 89320,
        avgRating: 4.2,
        popularPlugins: ['workflow-automator', 'task-manager-pro'],
        growthRate: 12.1,
      },
    ];
  }

  async getPlatformMetrics(): Promise<PlatformMetrics> {
    await this.simulateAsyncOperation(800);

    const categoryAnalytics = await this.getCategoryAnalytics();
    const totalDownloads = categoryAnalytics.reduce((sum, cat) => sum + cat.totalInstalls, 0);
    const totalPlugins = categoryAnalytics.reduce((sum, cat) => sum + cat.totalPlugins, 0);
    const avgRating =
      categoryAnalytics.reduce((sum, cat) => sum + cat.avgRating, 0) / categoryAnalytics.length;

    return {
      totalPlugins,
      totalDownloads,
      totalActiveUsers: 15420,
      totalDevelopers: 892,
      avgPluginRating: Math.round(avgRating * 10) / 10,
      categoryBreakdown: categoryAnalytics,
      topPerformingPlugins: Array.from(this.analytics.values())
        .sort((a, b) => b.totalInstalls - a.totalInstalls)
        .slice(0, 10),
      recentTrends: [
        {
          period: '2024-01',
          downloads: 12450,
          newPlugins: 8,
          activeUsers: 14200,
        },
        {
          period: '2024-02',
          downloads: 15320,
          newPlugins: 12,
          activeUsers: 15420,
        },
      ],
    };
  }

  async getPluginPerformanceReport(
    pluginId: string,
    days: number = 30
  ): Promise<{
    dailyStats: { date: string; installs: number; executions: number; errors: number }[];
    summary: {
      totalInstalls: number;
      totalExecutions: number;
      errorRate: number;
      avgExecutionTime: number;
    };
  }> {
    await this.simulateAsyncOperation(600);

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const pluginEvents = this.events.filter(
      event =>
        event.pluginId === pluginId && event.timestamp >= startDate && event.timestamp <= endDate
    );

    // 生成每日统计数据
    const dailyStats = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const dayEvents = pluginEvents.filter(
        event => event.timestamp.toISOString().split('T')[0] === dateStr
      );

      dailyStats.push({
        date: dateStr,
        installs: dayEvents.filter(e => e.eventType === 'install').length,
        executions: dayEvents.filter(e => e.eventType === 'execute').length,
        errors: dayEvents.filter(e => e.eventType === 'error').length,
      });
    }

    const totalInstalls = pluginEvents.filter(e => e.eventType === 'install').length;
    const totalExecutions = pluginEvents.filter(e => e.eventType === 'execute').length;
    const totalErrors = pluginEvents.filter(e => e.eventType === 'error').length;
    const errorRate = totalExecutions > 0 ? (totalErrors / totalExecutions) * 100 : 0;

    // 计算平均执行时间
    const executionEvents = pluginEvents.filter(
      e => e.eventType === 'execute' && e.metadata?.executionTime
    );
    const avgExecutionTime =
      executionEvents.length > 0
        ? executionEvents.reduce((sum, e) => sum + (e.metadata?.executionTime || 0), 0) /
          executionEvents.length
        : 0;

    return {
      dailyStats,
      summary: {
        totalInstalls,
        totalExecutions,
        errorRate: Math.round(errorRate * 100) / 100,
        avgExecutionTime: Math.round(avgExecutionTime),
      },
    };
  }

  async getUserBehaviorAnalytics(): Promise<{
    topCategories: { category: string; userCount: number }[];
    userJourney: { step: string; conversionRate: number }[];
    retentionCohorts: { period: string; retentionRate: number }[];
  }> {
    await this.simulateAsyncOperation(700);

    return {
      topCategories: [
        { category: 'productivity', userCount: 8520 },
        { category: 'gaming', userCount: 7890 },
        { category: 'vpn', userCount: 6340 },
        { category: 'streaming', userCount: 5210 },
      ],
      userJourney: [
        { step: 'Visit Store', conversionRate: 100 },
        { step: 'Browse Plugins', conversionRate: 78.5 },
        { step: 'View Plugin Details', conversionRate: 42.3 },
        { step: 'Install Plugin', conversionRate: 18.7 },
        { step: 'First Use', conversionRate: 85.2 },
        { step: 'Continue Using', conversionRate: 67.4 },
      ],
      retentionCohorts: [
        { period: 'Day 1', retentionRate: 85.2 },
        { period: 'Day 7', retentionRate: 67.4 },
        { period: 'Day 30', retentionRate: 45.8 },
        { period: 'Day 90', retentionRate: 32.1 },
      ],
    };
  }

  private async updatePluginAnalytics(pluginId: string): Promise<void> {
    const pluginEvents = this.events.filter(event => event.pluginId === pluginId);

    const totalInstalls = pluginEvents.filter(e => e.eventType === 'install').length;
    const totalExecutions = pluginEvents.filter(e => e.eventType === 'execute').length;
    const totalErrors = pluginEvents.filter(e => e.eventType === 'error').length;

    const uniqueUsers = new Set(pluginEvents.map(e => e.userId)).size;
    const errorRate = totalExecutions > 0 ? (totalErrors / totalExecutions) * 100 : 0;

    // 计算平均执行时间
    const executionEvents = pluginEvents.filter(
      e => e.eventType === 'execute' && e.metadata?.executionTime
    );
    const avgExecutionTime =
      executionEvents.length > 0
        ? executionEvents.reduce((sum, e) => sum + (e.metadata?.executionTime || 0), 0) /
          executionEvents.length
        : 0;

    const analytics: PluginAnalytics = {
      pluginId,
      totalInstalls,
      activeUsers: uniqueUsers,
      totalExecutions,
      errorRate: Math.round(errorRate * 100) / 100,
      avgExecutionTime: Math.round(avgExecutionTime),
      popularFeatures: ['connect', 'disconnect', 'server-switch'], // 模拟数据
      userRetentionRate: 67.4, // 模拟数据
      lastUpdated: new Date(),
    };

    this.analytics.set(pluginId, analytics);
  }

  private generateAnalytics(): void {
    // 为已知插件生成分析数据
    const knownPlugins = ['vpn-premium-pro', 'streaming-plus', 'game-launcher-deluxe'];

    knownPlugins.forEach(pluginId => {
      this.updatePluginAnalytics(pluginId);
    });
  }

  private async simulateAsyncOperation(delay: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// 创建单例实例
export const pluginAnalyticsService = new PluginAnalyticsService();
