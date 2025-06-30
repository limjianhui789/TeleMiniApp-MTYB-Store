/**
 * Plugin Store Service - 插件商店后端服务
 * 提供插件商店的核心API功能
 */

import { 
  PluginStoreItem, 
  PluginSearchQuery, 
  PluginSearchResult, 
  PluginReview, 
  PluginInstallation, 
  PluginSubmission, 
  PluginDeveloperStats, 
  PluginStoreAPI,
  PluginStoreStatus,
  PluginSortBy,
  PluginInstallationStatus
} from '../../types/pluginStore';

// 扩展开发者收益报告类型
export interface RevenueReport {
  authorId: string;
  period: {
    start: Date;
    end: Date;
  };
  totalRevenue: number;
  platformFee: number;
  netRevenue: number;
  paidOut: number;
  pending: number;
  transactions: {
    pluginId: string;
    pluginName: string;
    sales: number;
    revenue: number;
    date: Date;
  }[];
}

export class PluginStoreService implements PluginStoreAPI {
  private plugins: Map<string, PluginStoreItem> = new Map();
  private installations: Map<string, PluginInstallation> = new Map();
  private reviews: Map<string, PluginReview[]> = new Map();
  private submissions: Map<string, PluginSubmission> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // 初始化一些示例插件数据
    const samplePlugins: PluginStoreItem[] = [
      {
        id: 'vpn-premium-pro',
        name: 'vpn-premium-pro',
        displayName: 'VPN Premium Pro',
        shortDescription: '企业级VPN服务，支持全球100+服务器节点',
        description: '企业级VPN服务，支持全球100+服务器节点，军用级加密，提供最高级别的网络安全保护',
        version: '2.1.0',
        latestVersion: '2.1.0',
        author: {
          id: 'tech-corp-001',
          name: 'TechCorp Solutions',
          email: 'support@techcorp.com',
          verified: true,
          publishedPlugins: 12,
          totalDownloads: 45623,
          averageRating: 4.8,
          joinedAt: new Date('2023-01-15')
        },
        category: 'vpn' as any,
        tags: ['vpn', 'security', 'premium', 'enterprise'],
        icon: '🔒',
        screenshots: [
          'https://example.com/screenshots/vpn-pro-1.jpg',
          'https://example.com/screenshots/vpn-pro-2.jpg'
        ],
        pricing: {
          type: 'paid',
          price: 29.99,
          currency: 'USD'
        },
        stats: {
          downloads: 15623,
          activeInstalls: 12400,
          rating: 4.8,
          reviewCount: 2547,
          lastWeekDownloads: 892,
          lastMonthDownloads: 3421,
          popularityScore: 95
        },
        compatibility: {
          minPlatformVersion: '1.0.0',
          supportedDevices: ['mobile', 'desktop'],
          requiredFeatures: ['network'],
          dependencies: []
        },
        metadata: {
          size: 2048576,
          downloadUrl: 'https://example.com/downloads/vpn-premium-pro-2.1.0.zip',
          checksumSha256: 'abc123...',
          changelog: [
            {
              version: '2.1.0',
              date: new Date('2024-02-20'),
              changes: ['修复连接稳定性问题', '新增智能节点选择', '优化界面体验'],
              type: 'minor'
            }
          ],
          license: 'MIT'
        },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-20'),
        publishedAt: new Date('2024-01-20'),
        status: PluginStoreStatus.PUBLISHED
      },
      {
        id: 'streaming-plus',
        name: 'streaming-plus',
        displayName: 'Streaming Plus',
        shortDescription: '解锁全球流媒体内容，支持Netflix、Disney+、HBO Max等',
        description: '解锁全球流媒体内容，支持Netflix、Disney+、HBO Max等主流平台，提供高清流畅的观看体验',
        version: '1.5.2',
        latestVersion: '1.5.2',
        author: {
          id: 'mediastream-inc',
          name: 'MediaStream Inc',
          email: 'help@mediastream.com',
          verified: true,
          publishedPlugins: 8,
          totalDownloads: 32189,
          averageRating: 4.6,
          joinedAt: new Date('2023-03-10')
        },
        category: 'streaming' as any,
        tags: ['streaming', 'entertainment', 'netflix', 'disney'],
        icon: '📺',
        screenshots: [],
        pricing: {
          type: 'paid',
          price: 19.99,
          currency: 'USD'
        },
        stats: {
          downloads: 8945,
          activeInstalls: 7200,
          rating: 4.6,
          reviewCount: 1832,
          lastWeekDownloads: 634,
          lastMonthDownloads: 2341,
          popularityScore: 87
        },
        compatibility: {
          minPlatformVersion: '1.0.0',
          supportedDevices: ['mobile', 'desktop', 'tablet'],
          requiredFeatures: ['network'],
          dependencies: []
        },
        metadata: {
          size: 1536000,
          downloadUrl: 'https://example.com/downloads/streaming-plus-1.5.2.zip',
          checksumSha256: 'def456...',
          changelog: [
            {
              version: '1.5.2',
              date: new Date('2024-02-18'),
              changes: ['新增Disney+支持', '优化播放质量', '修复若干bug'],
              type: 'minor'
            }
          ],
          license: 'Commercial'
        },
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-02-18'),
        publishedAt: new Date('2024-01-25'),
        status: PluginStoreStatus.PUBLISHED
      },
      {
        id: 'game-launcher-deluxe',
        name: 'game-launcher-deluxe',
        displayName: 'Game Launcher Deluxe',
        shortDescription: '一体化游戏启动器，管理Steam、Epic Games、GOG等平台游戏',
        description: '一体化游戏启动器，管理Steam、Epic Games、GOG等平台游戏，提供统一的游戏库管理体验',
        version: '3.0.1',
        latestVersion: '3.0.1',
        author: {
          id: 'gamehub-studios',
          name: 'GameHub Studios',
          email: 'support@gamehub.com',
          verified: true,
          publishedPlugins: 15,
          totalDownloads: 67892,
          averageRating: 4.4,
          joinedAt: new Date('2022-11-20')
        },
        category: 'gaming' as any,
        tags: ['gaming', 'launcher', 'steam', 'epic-games'],
        icon: '🎮',
        screenshots: [],
        pricing: {
          type: 'free'
        },
        stats: {
          downloads: 23456,
          activeInstalls: 18900,
          rating: 4.4,
          reviewCount: 5621,
          lastWeekDownloads: 1243,
          lastMonthDownloads: 4532,
          popularityScore: 92
        },
        compatibility: {
          minPlatformVersion: '1.0.0',
          supportedDevices: ['desktop'],
          requiredFeatures: ['storage', 'process'],
          dependencies: []
        },
        metadata: {
          size: 3072000,
          downloadUrl: 'https://example.com/downloads/game-launcher-deluxe-3.0.1.zip',
          checksumSha256: 'ghi789...',
          changelog: [
            {
              version: '3.0.1',
              date: new Date('2024-02-15'),
              changes: ['新增GOG平台支持', 'UI优化', '性能提升'],
              type: 'minor'
            }
          ],
          license: 'Apache-2.0'
        },
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-02-15'),
        publishedAt: new Date('2024-01-15'),
        status: PluginStoreStatus.PUBLISHED
      }
    ];

    samplePlugins.forEach(plugin => {
      this.plugins.set(plugin.id, plugin);
    });

    // 初始化示例评论
    this.reviews.set('vpn-premium-pro', [
      {
        id: 'review-001',
        pluginId: 'vpn-premium-pro',
        userId: 'user-001',
        userName: 'TechReviewer',
        rating: 5,
        comment: '极其稳定的VPN服务，连接速度快，客服响应及时。物超所值！',
        createdAt: new Date('2024-02-10'),
        helpful: 145,
        verified: true
      },
      {
        id: 'review-002',
        pluginId: 'vpn-premium-pro',
        userId: 'user-002',
        userName: 'PrivacyExpert',
        rating: 4,
        comment: '安全性很好，但价格略高。整体推荐。',
        createdAt: new Date('2024-02-08'),
        helpful: 89,
        verified: false
      }
    ]);
  }

  async uploadPlugin(pluginPackage: File): Promise<PluginSubmission> {
    const submissionId = `submission-${Date.now()}`;
    const submission: PluginSubmission = {
      id: submissionId,
      pluginId: `plugin-${Date.now()}`,
      authorId: 'current-user', // 实际应该从认证系统获取
      fileName: pluginPackage.name,
      fileSize: pluginPackage.size,
      status: 'pending',
      submittedAt: new Date(),
      reviewNotes: []
    };

    this.submissions.set(submissionId, submission);
    
    // 模拟文件上传和验证过程
    await this.simulateAsyncOperation(2000);
    
    return submission;
  }

  async getPlugin(id: string): Promise<PluginStoreItem> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin with id ${id} not found`);
    }
    
    // 模拟网络延迟
    await this.simulateAsyncOperation(500);
    
    return plugin;
  }

  async getAllPlugins(): Promise<PluginStoreItem[]> {
    await this.simulateAsyncOperation(800);
    return Array.from(this.plugins.values());
  }

  async searchPlugins(query: PluginSearchQuery): Promise<PluginSearchResult> {
    await this.simulateAsyncOperation(600);
    
    let results = Array.from(this.plugins.values());
    
    // 文本搜索
    if (query.q) {
      const searchTerm = query.q.toLowerCase();
      results = results.filter(plugin =>
        plugin.name.toLowerCase().includes(searchTerm) ||
        plugin.description.toLowerCase().includes(searchTerm) ||
        plugin.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    // 分类筛选
    if (query.category) {
      results = results.filter(plugin => plugin.category === query.category);
    }
    
    // 价格筛选
    if (query.priceRange) {
      const [min, max] = query.priceRange;
      results = results.filter(plugin => plugin.price >= min && plugin.price <= max);
    }
    
    // 评分筛选
    if (query.minRating) {
      results = results.filter(plugin => plugin.rating >= query.minRating);
    }
    
    // 排序
    if (query.sortBy) {
      results.sort((a, b) => {
        switch (query.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'rating':
            return b.rating - a.rating;
          case 'price':
            return a.price - b.price;
          case 'downloads':
            return b.downloadCount - a.downloadCount;
          case 'updated':
            return b.updatedAt.getTime() - a.updatedAt.getTime();
          default:
            return 0;
        }
      });
    }
    
    // 分页
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;
    const paginatedResults = results.slice(offset, offset + limit);
    
    return {
      plugins: paginatedResults,
      total: results.length,
      page,
      limit,
      hasMore: offset + limit < results.length
    };
  }

  async getFeaturedPlugins(): Promise<PluginStoreItem[]> {
    await this.simulateAsyncOperation(400);
    return Array.from(this.plugins.values()).filter(plugin => plugin.featured);
  }

  async getPluginsByCategory(category: string): Promise<PluginStoreItem[]> {
    await this.simulateAsyncOperation(500);
    return Array.from(this.plugins.values()).filter(plugin => plugin.category === category);
  }

  async installPlugin(pluginId: string): Promise<PluginInstallation> {
    const plugin = await this.getPlugin(pluginId);
    
    const installation: PluginInstallation = {
      id: `install-${Date.now()}`,
      pluginId,
      userId: 'current-user', // 实际应该从认证系统获取
      version: plugin.version,
      installedAt: new Date(),
      status: PluginInstallationStatus.INSTALLING,
      settings: {}
    };
    
    this.installations.set(installation.id, installation);
    
    // 模拟安装过程
    await this.simulateAsyncOperation(3000);
    
    installation.status = PluginInstallationStatus.INSTALLED;
    return installation;
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    const installations = Array.from(this.installations.values());
    const installation = installations.find(inst => inst.pluginId === pluginId);
    
    if (installation) {
      this.installations.delete(installation.id);
    }
    
    await this.simulateAsyncOperation(1000);
  }

  async updatePlugin(pluginId: string): Promise<PluginInstallation> {
    const installations = Array.from(this.installations.values());
    const installation = installations.find(inst => inst.pluginId === pluginId);
    
    if (!installation) {
      throw new Error(`Plugin ${pluginId} is not installed`);
    }
    
    installation.status = PluginInstallationStatus.UPDATING;
    
    // 模拟更新过程
    await this.simulateAsyncOperation(2500);
    
    const plugin = await this.getPlugin(pluginId);
    installation.version = plugin.version;
    installation.status = PluginInstallationStatus.INSTALLED;
    installation.updatedAt = new Date();
    
    return installation;
  }

  async getInstalledPlugins(): Promise<PluginInstallation[]> {
    await this.simulateAsyncOperation(400);
    return Array.from(this.installations.values());
  }

  async submitReview(review: PluginReview): Promise<void> {
    const reviewId = `review-${Date.now()}`;
    const newReview: PluginReview = {
      ...review,
      id: reviewId,
      createdAt: new Date(),
      helpful: 0,
      verified: false // 需要验证购买记录
    };
    
    const pluginReviews = this.reviews.get(review.pluginId) || [];
    pluginReviews.push(newReview);
    this.reviews.set(review.pluginId, pluginReviews);
    
    // 更新插件的评分统计
    await this.updatePluginRatingStats(review.pluginId);
    
    await this.simulateAsyncOperation(800);
  }

  async getReviews(pluginId: string): Promise<PluginReview[]> {
    await this.simulateAsyncOperation(400);
    return this.reviews.get(pluginId) || [];
  }

  async updateReview(reviewId: string, updates: Partial<PluginReview>): Promise<void> {
    for (const [pluginId, pluginReviews] of this.reviews.entries()) {
      const reviewIndex = pluginReviews.findIndex(r => r.id === reviewId);
      if (reviewIndex !== -1) {
        pluginReviews[reviewIndex] = { ...pluginReviews[reviewIndex], ...updates };
        await this.updatePluginRatingStats(pluginId);
        break;
      }
    }
    
    await this.simulateAsyncOperation(600);
  }

  async deleteReview(reviewId: string): Promise<void> {
    for (const [pluginId, pluginReviews] of this.reviews.entries()) {
      const reviewIndex = pluginReviews.findIndex(r => r.id === reviewId);
      if (reviewIndex !== -1) {
        pluginReviews.splice(reviewIndex, 1);
        await this.updatePluginRatingStats(pluginId);
        break;
      }
    }
    
    await this.simulateAsyncOperation(500);
  }

  async getDeveloperStats(authorId: string): Promise<PluginDeveloperStats> {
    await this.simulateAsyncOperation(600);
    
    const authorPlugins = Array.from(this.plugins.values())
      .filter(plugin => plugin.authorId === authorId);
    
    const totalDownloads = authorPlugins.reduce((sum, plugin) => sum + plugin.downloadCount, 0);
    const totalRevenue = authorPlugins.reduce((sum, plugin) => sum + (plugin.price * plugin.downloadCount), 0);
    const avgRating = authorPlugins.reduce((sum, plugin) => sum + plugin.rating, 0) / authorPlugins.length;
    
    return {
      authorId,
      totalPlugins: authorPlugins.length,
      totalDownloads,
      totalRevenue,
      averageRating: avgRating,
      activePlugins: authorPlugins.filter(p => p.status === 'approved').length,
      pendingPlugins: authorPlugins.filter(p => p.status === 'pending').length,
      monthlyStats: {
        downloads: Math.floor(totalDownloads * 0.1), // 模拟月度数据
        revenue: Math.floor(totalRevenue * 0.1),
        newReviews: 25
      }
    };
  }

  async getRevenue(authorId: string): Promise<RevenueReport> {
    await this.simulateAsyncOperation(800);
    
    const authorPlugins = Array.from(this.plugins.values())
      .filter(plugin => plugin.authorId === authorId);
    
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    
    // 模拟收益数据
    const totalRevenue = authorPlugins.reduce((sum, plugin) => sum + (plugin.price * plugin.downloadCount), 0);
    const platformFee = totalRevenue * 0.3; // 30% 平台费用
    const netRevenue = totalRevenue - platformFee;
    
    return {
      authorId,
      period: {
        start: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        end: currentMonth
      },
      totalRevenue,
      platformFee,
      netRevenue,
      paidOut: netRevenue * 0.8, // 已支付80%
      pending: netRevenue * 0.2, // 待支付20%
      transactions: authorPlugins.map(plugin => ({
        pluginId: plugin.id,
        pluginName: plugin.name,
        sales: Math.floor(plugin.downloadCount * 0.1),
        revenue: plugin.price * Math.floor(plugin.downloadCount * 0.1),
        date: new Date()
      }))
    };
  }

  async updatePluginStatus(pluginId: string, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.status = status;
      plugin.updatedAt = new Date();
    }
    
    await this.simulateAsyncOperation(400);
  }

  private async updatePluginRatingStats(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    const reviews = this.reviews.get(pluginId) || [];
    
    if (plugin && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      plugin.rating = Math.round(avgRating * 10) / 10; // 保留一位小数
      plugin.reviewCount = reviews.length;
    }
  }

  private async simulateAsyncOperation(delay: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// 创建单例实例
export const pluginStoreService = new PluginStoreService();