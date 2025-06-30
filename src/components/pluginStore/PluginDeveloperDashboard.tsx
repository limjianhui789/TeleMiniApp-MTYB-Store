import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useAsyncState } from '../../hooks/useAsyncState';
import { Button } from '../ui/Button';
import { LoadingSpinner, ErrorMessage } from '../common';
import { useToast } from '../feedback/Toast';
import {
  PluginDeveloperStats,
  PluginStoreItem,
  PluginSubmission,
  PluginStoreStatus,
} from '../../types/pluginStore';

interface PluginDeveloperDashboardProps {
  className?: string;
}

export const PluginDeveloperDashboard: React.FC<PluginDeveloperDashboardProps> = ({
  className = '',
}) => {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'plugins' | 'submissions' | 'analytics'>(
    'overview'
  );

  // Mock data fetching functions
  const fetchDeveloperStats = useCallback(async (): Promise<PluginDeveloperStats> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      totalPlugins: 8,
      publishedPlugins: 6,
      totalDownloads: 45623,
      totalRevenue: 12567.89,
      averageRating: 4.6,
      totalReviews: 342,
      monthlyStats: [
        { month: '2024-01', downloads: 3421, revenue: 1256.78, newReviews: 23 },
        { month: '2024-02', downloads: 4123, revenue: 1534.92, newReviews: 31 },
        { month: '2024-03', downloads: 3876, revenue: 1423.65, newReviews: 28 },
        { month: '2024-04', downloads: 4567, revenue: 1678.34, newReviews: 35 },
        { month: '2024-05', downloads: 5234, revenue: 1987.45, newReviews: 42 },
        { month: '2024-06', downloads: 4987, revenue: 1876.23, newReviews: 38 },
      ],
    };
  }, []);

  const fetchMyPlugins = useCallback(async (): Promise<PluginStoreItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    return [
      {
        id: 'vpn-premium',
        name: 'vpn-premium',
        displayName: 'VPN Premium Manager',
        shortDescription: 'Advanced VPN account management with premium features',
        description: 'A comprehensive VPN management plugin with advanced features.',
        version: '2.1.0',
        latestVersion: '2.1.0',
        author: {
          id: 'current-user',
          name: 'My Developer Account',
          email: 'dev@mtyb.shop',
          verified: true,
          publishedPlugins: 8,
          totalDownloads: 45623,
          averageRating: 4.6,
          joinedAt: new Date('2023-01-15'),
        },
        category: 'vpn' as any,
        tags: ['vpn', 'security', 'premium', 'automation'],
        icon: '🔒',
        screenshots: [],
        pricing: { type: 'freemium', price: 9.99, currency: 'USD' },
        stats: {
          downloads: 12543,
          activeInstalls: 8932,
          rating: 4.8,
          reviewCount: 234,
          lastWeekDownloads: 892,
          lastMonthDownloads: 3421,
          popularityScore: 95,
        },
        compatibility: {
          minPlatformVersion: '1.0.0',
          supportedDevices: ['mobile', 'desktop'],
          requiredFeatures: [],
          dependencies: [],
        },
        metadata: {
          size: 2048576,
          downloadUrl: '',
          checksumSha256: '',
          changelog: [],
          license: 'MIT',
        },
        createdAt: new Date('2023-08-15'),
        updatedAt: new Date('2024-01-10'),
        publishedAt: new Date('2023-08-20'),
        status: 'published' as any,
      },
      {
        id: 'security-tools',
        name: 'security-tools',
        displayName: 'Security Tools Suite',
        shortDescription: 'Collection of security and privacy tools',
        description: 'A comprehensive security toolkit for digital asset protection.',
        version: '1.4.2',
        latestVersion: '1.4.2',
        author: {
          id: 'current-user',
          name: 'My Developer Account',
          email: 'dev@mtyb.shop',
          verified: true,
          publishedPlugins: 8,
          totalDownloads: 45623,
          averageRating: 4.6,
          joinedAt: new Date('2023-01-15'),
        },
        category: 'software' as any,
        tags: ['security', 'privacy', 'tools', 'encryption'],
        icon: '🛡️',
        screenshots: [],
        pricing: { type: 'paid', price: 19.99, currency: 'USD' },
        stats: {
          downloads: 8734,
          activeInstalls: 6421,
          rating: 4.5,
          reviewCount: 108,
          lastWeekDownloads: 543,
          lastMonthDownloads: 2156,
          popularityScore: 78,
        },
        compatibility: {
          minPlatformVersion: '1.0.0',
          supportedDevices: ['mobile', 'desktop'],
          requiredFeatures: [],
          dependencies: [],
        },
        metadata: {
          size: 3456789,
          downloadUrl: '',
          checksumSha256: '',
          changelog: [],
          license: 'Commercial',
        },
        createdAt: new Date('2023-09-10'),
        updatedAt: new Date('2024-01-05'),
        publishedAt: new Date('2023-09-15'),
        status: 'published' as any,
      },
    ];
  }, []);

  const fetchSubmissions = useCallback(async (): Promise<PluginSubmission[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    return [
      {
        id: 'submission-1',
        pluginId: 'vpn-premium',
        authorId: 'current-user',
        name: 'VPN Premium Manager',
        version: '2.2.0',
        description: 'Updated version with new features and bug fixes',
        category: 'vpn' as any,
        tags: ['vpn', 'security', 'premium', 'automation'],
        pricing: { type: 'freemium', price: 9.99, currency: 'USD' },
        packageFile: 'vpn-premium-2.2.0.zip',
        changelog: 'Added support for new VPN providers, improved UI, fixed connection issues',
        submittedAt: new Date('2024-01-15'),
        status: PluginStoreStatus.UNDER_REVIEW,
        reviewNotes: 'Plugin is currently being reviewed by our security team.',
      },
      {
        id: 'submission-2',
        authorId: 'current-user',
        name: 'Streaming Manager Pro',
        version: '1.0.0',
        description: 'Professional streaming account management plugin',
        category: 'streaming' as any,
        tags: ['streaming', 'entertainment', 'management'],
        pricing: { type: 'paid', price: 14.99, currency: 'USD' },
        packageFile: 'streaming-manager-1.0.0.zip',
        changelog: 'Initial release with comprehensive streaming service support',
        submittedAt: new Date('2024-01-12'),
        status: PluginStoreStatus.PENDING_REVIEW,
      },
    ];
  }, []);

  const [statsState, { execute: loadStats }] = useAsyncState(fetchDeveloperStats);
  const [pluginsState, { execute: loadPlugins }] = useAsyncState(fetchMyPlugins);
  const [submissionsState, { execute: loadSubmissions }] = useAsyncState(fetchSubmissions);

  useEffect(() => {
    loadStats();
    loadPlugins();
    loadSubmissions();
  }, [loadStats, loadPlugins, loadSubmissions]);

  const handleDeletePlugin = async (pluginId: string) => {
    try {
      // Mock deletion
      await new Promise(resolve => setTimeout(resolve, 1000));

      showToast({
        type: 'success',
        title: 'Plugin Deleted',
        message: 'Plugin has been successfully deleted.',
      });

      loadPlugins();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Deletion Failed',
        message: 'Failed to delete plugin. Please try again.',
      });
    }
  };

  const handleWithdrawSubmission = async (submissionId: string) => {
    try {
      // Mock withdrawal
      await new Promise(resolve => setTimeout(resolve, 800));

      showToast({
        type: 'success',
        title: 'Submission Withdrawn',
        message: 'Submission has been withdrawn successfully.',
      });

      loadSubmissions();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Withdrawal Failed',
        message: 'Failed to withdraw submission. Please try again.',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className={`developer-dashboard ${className}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Developer Dashboard</h1>
          <p>Manage your plugins and track performance</p>
        </div>

        <div className="header-actions">
          <Button variant="primary" size="md">
            📝 Submit New Plugin
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-nav">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'plugins', label: 'My Plugins', icon: '🔌' },
          { id: 'submissions', label: 'Submissions', icon: '📋' },
          { id: 'analytics', label: 'Analytics', icon: '📈' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={statsState.data}
            loading={statsState.loading}
            error={statsState.error}
          />
        )}

        {activeTab === 'plugins' && (
          <PluginsTab
            plugins={pluginsState.data || []}
            loading={pluginsState.loading}
            error={pluginsState.error}
            onDeletePlugin={handleDeletePlugin}
          />
        )}

        {activeTab === 'submissions' && (
          <SubmissionsTab
            submissions={submissionsState.data || []}
            loading={submissionsState.loading}
            error={submissionsState.error}
            onWithdrawSubmission={handleWithdrawSubmission}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab stats={statsState.data} loading={statsState.loading} />
        )}
      </div>

      <style>{`
        .developer-dashboard {
          min-height: 100vh;
          font-family: var(--font-family-base);
          background: var(--color-background);
          color: var(--color-text-primary);
        }

        .dashboard-header {
          background: var(--color-card-background);
          border-bottom: 1px solid var(--color-border);
          padding: var(--space-8) var(--space-6);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-content h1 {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .header-content p {
          margin: 0;
          font-size: var(--text-lg);
          color: var(--color-text-secondary);
        }

        .dashboard-nav {
          background: var(--color-card-background);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .nav-tab {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-4) var(--space-6);
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s ease;
          white-space: nowrap;
          min-height: var(--touch-target-min);
          font-size: var(--text-base);
        }

        .nav-tab:hover {
          color: var(--color-text-primary);
          background: var(--color-hover);
        }

        .nav-tab.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        .tab-icon {
          font-size: 1.2rem;
        }

        .dashboard-content {
          padding: var(--space-8) var(--space-6);
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: var(--space-4);
            align-items: stretch;
            padding: var(--space-6) var(--space-4);
          }

          .dashboard-content {
            padding: var(--space-6) var(--space-4);
          }

          .nav-tab {
            flex-direction: column;
            gap: var(--space-1);
            padding: var(--space-3) var(--space-4);
          }

          .tab-label {
            font-size: var(--text-xs);
          }
        }
      `}</style>
    </div>
  );
};

// Overview Tab Component
interface OverviewTabProps {
  stats?: PluginDeveloperStats;
  loading: boolean;
  error?: Error | null;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ stats, loading, error }) => {
  if (loading) {
    return (
      <div className="overview-loading">
        <LoadingSpinner size="large" />
        <p>Loading dashboard overview...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <ErrorMessage
        title="Failed to load overview"
        message={error?.message || 'Unknown error'}
        actions={[{ label: 'Retry', onClick: () => window.location.reload(), variant: 'primary' }]}
      />
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="overview-tab">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔌</div>
          <div className="stat-info">
            <div className="stat-value">{stats.publishedPlugins}</div>
            <div className="stat-label">Published Plugins</div>
            <div className="stat-subtitle">{stats.totalPlugins} total</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📥</div>
          <div className="stat-info">
            <div className="stat-value">{formatNumber(stats.totalDownloads)}</div>
            <div className="stat-label">Total Downloads</div>
            <div className="stat-subtitle">All time</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-subtitle">All time</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <div className="stat-value">{stats.averageRating.toFixed(1)}</div>
            <div className="stat-label">Average Rating</div>
            <div className="stat-subtitle">{stats.totalReviews} reviews</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">📥</div>
            <div className="activity-content">
              <div className="activity-title">VPN Premium Manager downloaded 127 times</div>
              <div className="activity-time">2 hours ago</div>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">⭐</div>
            <div className="activity-content">
              <div className="activity-title">New 5-star review for Security Tools Suite</div>
              <div className="activity-time">5 hours ago</div>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">💰</div>
            <div className="activity-content">
              <div className="activity-title">Revenue milestone: $12,500 reached</div>
              <div className="activity-time">1 day ago</div>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">🔄</div>
            <div className="activity-content">
              <div className="activity-title">Plugin update approved and published</div>
              <div className="activity-time">2 days ago</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .overview-tab {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }

        .overview-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-12);
          color: var(--color-text-secondary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-6);
        }

        .stat-card {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          display: flex;
          align-items: center;
          gap: var(--space-4);
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--color-primary-light);
        }

        .stat-icon {
          font-size: 2.5rem;
          background: var(--color-primary-light);
          border-radius: var(--radius-full);
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-info {
          flex: 1;
        }

        .stat-value {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-1);
        }

        .stat-label {
          font-size: var(--text-base);
          color: var(--color-text-primary);
          margin-bottom: var(--space-1);
        }

        .stat-subtitle {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .recent-activity h2 {
          margin: 0 0 var(--space-6) 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .activity-item {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .activity-icon {
          font-size: 1.5rem;
          background: var(--color-muted);
          border-radius: var(--radius-full);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activity-content {
          flex: 1;
        }

        .activity-title {
          font-size: var(--text-base);
          color: var(--color-text-primary);
          margin-bottom: var(--space-1);
        }

        .activity-time {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .stat-card {
            flex-direction: column;
            text-align: center;
            padding: var(--space-4);
          }

          .stat-icon {
            width: 50px;
            height: 50px;
            font-size: 2rem;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// Plugins Tab Component
interface PluginsTabProps {
  plugins: PluginStoreItem[];
  loading: boolean;
  error?: Error | null;
  onDeletePlugin: (pluginId: string) => void;
}

const PluginsTab: React.FC<PluginsTabProps> = ({ plugins, loading, error, onDeletePlugin }) => {
  if (loading) {
    return (
      <div className="plugins-loading">
        <LoadingSpinner size="large" />
        <p>Loading your plugins...</p>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load plugins"
        message={error.message}
        actions={[{ label: 'Retry', onClick: () => window.location.reload(), variant: 'primary' }]}
      />
    );
  }

  return (
    <div className="plugins-tab">
      <div className="plugins-header">
        <h2>My Plugins ({plugins.length})</h2>
        <Button variant="primary" size="md">
          ➕ Add New Plugin
        </Button>
      </div>

      {plugins.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔌</div>
          <h3>No plugins yet</h3>
          <p>Start by submitting your first plugin to the store.</p>
          <Button variant="primary" size="lg">
            Submit Your First Plugin
          </Button>
        </div>
      ) : (
        <div className="plugins-grid">
          {plugins.map(plugin => (
            <PluginManagementCard
              key={plugin.id}
              plugin={plugin}
              onDelete={() => onDeletePlugin(plugin.id)}
            />
          ))}
        </div>
      )}

      <style>{`
        .plugins-tab {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .plugins-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-12);
          color: var(--color-text-secondary);
        }

        .plugins-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .plugins-header h2 {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-12);
          text-align: center;
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: var(--space-4);
          opacity: 0.5;
        }

        .empty-state h3 {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-xl);
          color: var(--color-text-primary);
        }

        .empty-state p {
          margin: 0 0 var(--space-6) 0;
          color: var(--color-text-secondary);
        }

        .plugins-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: var(--space-6);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .plugins-header {
            flex-direction: column;
            gap: var(--space-4);
            align-items: stretch;
          }

          .plugins-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// Plugin Management Card Component
interface PluginManagementCardProps {
  plugin: PluginStoreItem;
  onDelete: () => void;
}

const PluginManagementCard: React.FC<PluginManagementCardProps> = ({ plugin, onDelete }) => {
  const [showActions, setShowActions] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'var(--color-success)';
      case 'under_review':
        return 'var(--color-warning)';
      case 'rejected':
        return 'var(--color-error)';
      case 'draft':
        return 'var(--color-text-secondary)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  return (
    <div className="plugin-management-card">
      <div className="plugin-header">
        <div className="plugin-info">
          <div className="plugin-icon">{plugin.icon}</div>
          <div className="plugin-details">
            <h3 className="plugin-name">{plugin.displayName}</h3>
            <p className="plugin-version">v{plugin.version}</p>
          </div>
        </div>

        <div className="plugin-status" style={{ color: getStatusColor(plugin.status) }}>
          ● {plugin.status.replace('_', ' ')}
        </div>
      </div>

      <p className="plugin-description">{plugin.shortDescription}</p>

      <div className="plugin-stats">
        <div className="stat">
          <span className="stat-value">{formatNumber(plugin.stats.downloads)}</span>
          <span className="stat-label">Downloads</span>
        </div>
        <div className="stat">
          <span className="stat-value">{plugin.stats.rating.toFixed(1)}</span>
          <span className="stat-label">Rating</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatNumber(plugin.stats.activeInstalls)}</span>
          <span className="stat-label">Active</span>
        </div>
      </div>

      <div className="plugin-actions">
        <Button variant="secondary" size="sm">
          📊 Analytics
        </Button>
        <Button variant="secondary" size="sm">
          ✏️ Edit
        </Button>
        <div className="more-actions">
          <Button variant="ghost" size="sm" onClick={() => setShowActions(!showActions)}>
            ⋯
          </Button>
          {showActions && (
            <div className="actions-menu">
              <button className="action-item">📝 Update</button>
              <button className="action-item">👁️ View Store</button>
              <button className="action-item">📋 Copy Link</button>
              <button className="action-item danger" onClick={onDelete}>
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .plugin-management-card {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          position: relative;
        }

        .plugin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .plugin-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .plugin-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .plugin-name {
          margin: 0 0 var(--space-1) 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .plugin-version {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .plugin-status {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          text-transform: capitalize;
        }

        .plugin-description {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: var(--leading-normal);
        }

        .plugin-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .stat-label {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
        }

        .plugin-actions {
          display: flex;
          gap: var(--space-2);
          align-items: center;
        }

        .more-actions {
          position: relative;
          margin-left: auto;
        }

        .actions-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: var(--space-1);
          background: var(--color-background-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          min-width: 140px;
          z-index: 10;
          overflow: hidden;
        }

        .action-item {
          display: block;
          width: 100%;
          padding: var(--space-3);
          background: none;
          border: none;
          text-align: left;
          font-size: var(--text-sm);
          color: var(--color-text-primary);
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .action-item:hover {
          background: var(--color-hover);
        }

        .action-item.danger {
          color: var(--color-error);
        }

        .action-item.danger:hover {
          background: var(--color-error-light);
        }
      `}</style>
    </div>
  );
};

// Submissions Tab Component
interface SubmissionsTabProps {
  submissions: PluginSubmission[];
  loading: boolean;
  error?: Error | null;
  onWithdrawSubmission: (submissionId: string) => void;
}

const SubmissionsTab: React.FC<SubmissionsTabProps> = ({
  submissions,
  loading,
  error,
  onWithdrawSubmission,
}) => {
  if (loading) {
    return (
      <div className="submissions-loading">
        <LoadingSpinner size="large" />
        <p>Loading submissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load submissions"
        message={error.message}
        actions={[{ label: 'Retry', onClick: () => window.location.reload(), variant: 'primary' }]}
      />
    );
  }

  const getStatusColor = (status: PluginStoreStatus) => {
    switch (status) {
      case PluginStoreStatus.PUBLISHED:
        return 'var(--color-success)';
      case PluginStoreStatus.APPROVED:
        return 'var(--color-success)';
      case PluginStoreStatus.UNDER_REVIEW:
        return 'var(--color-warning)';
      case PluginStoreStatus.PENDING_REVIEW:
        return 'var(--color-info)';
      case PluginStoreStatus.REJECTED:
        return 'var(--color-error)';
      case PluginStoreStatus.DRAFT:
        return 'var(--color-text-secondary)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const getStatusLabel = (status: PluginStoreStatus) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="submissions-tab">
      <div className="submissions-header">
        <h2>Plugin Submissions ({submissions.length})</h2>
        <Button variant="primary" size="md">
          📝 New Submission
        </Button>
      </div>

      {submissions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No submissions</h3>
          <p>You haven't submitted any plugins for review yet.</p>
        </div>
      ) : (
        <div className="submissions-list">
          {submissions.map(submission => (
            <div key={submission.id} className="submission-card">
              <div className="submission-header">
                <div className="submission-info">
                  <h3 className="submission-name">{submission.name}</h3>
                  <p className="submission-version">v{submission.version}</p>
                </div>

                <div
                  className="submission-status"
                  style={{ color: getStatusColor(submission.status) }}
                >
                  ● {getStatusLabel(submission.status)}
                </div>
              </div>

              <p className="submission-description">{submission.description}</p>

              <div className="submission-meta">
                <span className="submission-date">
                  Submitted: {submission.submittedAt.toLocaleDateString()}
                </span>
                <span className="submission-category">Category: {submission.category}</span>
              </div>

              {submission.reviewNotes && (
                <div className="review-notes">
                  <h4>Review Notes</h4>
                  <p>{submission.reviewNotes}</p>
                </div>
              )}

              <div className="submission-actions">
                <Button variant="secondary" size="sm">
                  📝 Edit
                </Button>
                <Button variant="secondary" size="sm">
                  👁️ View Details
                </Button>
                {(submission.status === PluginStoreStatus.PENDING_REVIEW ||
                  submission.status === PluginStoreStatus.UNDER_REVIEW) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onWithdrawSubmission(submission.id)}
                  >
                    🚫 Withdraw
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .submissions-tab {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .submissions-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-12);
          color: var(--color-text-secondary);
        }

        .submissions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .submissions-header h2 {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .submissions-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .submission-card {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .submission-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .submission-name {
          margin: 0 0 var(--space-1) 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .submission-version {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .submission-status {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
        }

        .submission-description {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: var(--leading-normal);
        }

        .submission-meta {
          display: flex;
          gap: var(--space-4);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .review-notes {
          background: var(--color-muted);
          border-radius: var(--radius-md);
          padding: var(--space-4);
        }

        .review-notes h4 {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .review-notes p {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: var(--leading-normal);
        }

        .submission-actions {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .submissions-header {
            flex-direction: column;
            gap: var(--space-4);
            align-items: stretch;
          }

          .submission-header {
            flex-direction: column;
            gap: var(--space-2);
          }

          .submission-meta {
            flex-direction: column;
            gap: var(--space-1);
          }
        }
      `}</style>
    </div>
  );
};

// Analytics Tab Component
interface AnalyticsTabProps {
  stats?: PluginDeveloperStats;
  loading: boolean;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="analytics-loading">
        <LoadingSpinner size="large" />
        <p>Loading analytics...</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="analytics-tab">
      <h2>Analytics & Performance</h2>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Monthly Downloads</h3>
          <div className="chart-placeholder">
            <div className="chart-bars">
              {stats.monthlyStats.map((month, index) => (
                <div key={month.month} className="chart-bar">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${(month.downloads / Math.max(...stats.monthlyStats.map(m => m.downloads))) * 100}%`,
                    }}
                  />
                  <span className="bar-label">{month.month.slice(-2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Monthly Revenue</h3>
          <div className="chart-placeholder">
            <div className="chart-bars">
              {stats.monthlyStats.map((month, index) => (
                <div key={month.month} className="chart-bar">
                  <div
                    className="bar-fill revenue"
                    style={{
                      height: `${(month.revenue / Math.max(...stats.monthlyStats.map(m => m.revenue))) * 100}%`,
                    }}
                  />
                  <span className="bar-label">{month.month.slice(-2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-summary">
        <h3>Performance Summary</h3>
        <div className="summary-stats">
          <div className="summary-item">
            <span className="summary-label">Best Month (Downloads)</span>
            <span className="summary-value">
              {Math.max(...stats.monthlyStats.map(m => m.downloads)).toLocaleString()}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Best Month (Revenue)</span>
            <span className="summary-value">
              {formatCurrency(Math.max(...stats.monthlyStats.map(m => m.revenue)))}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Reviews</span>
            <span className="summary-value">{stats.totalReviews}</span>
          </div>
        </div>
      </div>

      <style>{`
        .analytics-tab {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }

        .analytics-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-12);
          color: var(--color-text-secondary);
        }

        .analytics-tab h2 {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: var(--space-6);
        }

        .analytics-card {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
        }

        .analytics-card h3 {
          margin: 0 0 var(--space-4) 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .chart-placeholder {
          height: 200px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          background: var(--color-muted);
          border-radius: var(--radius-md);
          padding: var(--space-4);
        }

        .chart-bars {
          display: flex;
          align-items: flex-end;
          gap: var(--space-2);
          height: 100%;
          width: 100%;
        }

        .chart-bar {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          height: 100%;
        }

        .bar-fill {
          background: var(--color-primary);
          width: 100%;
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          min-height: 4px;
          transition: height 0.3s ease;
        }

        .bar-fill.revenue {
          background: var(--color-success);
        }

        .bar-label {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
        }

        .analytics-summary {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
        }

        .analytics-summary h3 {
          margin: 0 0 var(--space-4) 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .summary-label {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .summary-value {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .summary-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .summary-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PluginDeveloperDashboard;
