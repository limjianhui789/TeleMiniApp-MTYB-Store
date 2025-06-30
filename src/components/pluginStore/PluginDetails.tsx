import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useAsyncState } from '../../hooks/useAsyncState';
import { Button } from '../ui/Button';
import { LoadingSpinner, ErrorMessage } from '../common';
import { useToast } from '../feedback/Toast';
import {
  PluginStoreItem,
  PluginReview,
  PluginRatingBreakdown,
  PluginInstallationStatus,
} from '../../types/pluginStore';

interface PluginDetailsProps {
  pluginId: string;
  onBack?: () => void;
  className?: string;
}

export const PluginDetails: React.FC<PluginDetailsProps> = ({
  pluginId,
  onBack,
  className = '',
}) => {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'changelog'>('overview');
  const [installationStatus, setInstallationStatus] = useState<PluginInstallationStatus | null>(
    null
  );

  // Mock data fetching
  const fetchPluginDetails = useCallback(async (): Promise<PluginStoreItem> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      id: pluginId,
      name: 'vpn-premium',
      displayName: 'VPN Premium Manager',
      shortDescription: 'Advanced VPN account management with premium features',
      description: `# VPN Premium Manager

The most comprehensive VPN management plugin for MTYB platform. This plugin provides advanced features for managing VPN accounts across multiple providers with automation, monitoring, and premium features.

## Key Features

### 🔒 Multi-Provider Support
- Support for 15+ popular VPN providers
- Unified account management interface
- Automatic credential rotation
- Provider-specific optimizations

### 📊 Advanced Analytics
- Real-time bandwidth monitoring
- Connection quality metrics
- Usage statistics and reports
- Performance optimization suggestions

### ⚡ Automation Features
- Auto-failover between servers
- Smart server selection
- Scheduled connection management
- Load balancing across regions

### 🛡️ Security Enhancements
- Enhanced encryption protocols
- Kill switch functionality
- DNS leak protection
- Advanced firewall rules

## Installation Requirements

- MTYB Platform v1.0.0 or higher
- Minimum 50MB free storage
- Internet connection for provider APIs
- Administrator privileges (for advanced features)

## Supported Providers

The plugin currently supports the following VPN providers:

- ExpressVPN
- NordVPN
- Surfshark
- CyberGhost
- Private Internet Access
- And 10+ more providers

## Getting Started

1. Install the plugin from the store
2. Configure your VPN provider credentials
3. Select your preferred regions and servers
4. Enable automation features as needed
5. Monitor your connections through the dashboard

## Premium Features

Upgrade to premium to unlock:
- Unlimited concurrent connections
- Advanced analytics dashboard
- Priority customer support
- Early access to new features
- Custom automation rules`,
      version: '2.1.0',
      latestVersion: '2.1.0',
      author: {
        id: 'mtyb-team',
        name: 'MTYB Team',
        email: 'plugins@mtyb.shop',
        website: 'https://mtyb.shop',
        avatar: '👥',
        verified: true,
        publishedPlugins: 12,
        totalDownloads: 45623,
        averageRating: 4.8,
        joinedAt: new Date('2023-01-15'),
      },
      category: 'vpn' as any,
      tags: ['vpn', 'security', 'premium', 'automation', 'monitoring', 'multi-provider'],
      icon: '🔒',
      screenshots: [
        '/screenshots/vpn-dashboard.png',
        '/screenshots/vpn-settings.png',
        '/screenshots/vpn-analytics.png',
      ],
      pricing: {
        type: 'freemium',
        price: 9.99,
        currency: 'USD',
        freeTierLimits: {
          maxConnections: 3,
          maxProviders: 2,
          analytics: false,
          automation: false,
        },
        subscriptionOptions: [
          {
            id: 'monthly',
            name: 'Monthly Premium',
            price: 9.99,
            currency: 'USD',
            interval: 'monthly',
            features: [
              'Unlimited connections',
              'All VPN providers',
              'Advanced analytics',
              'Full automation suite',
              'Priority support',
            ],
          },
          {
            id: 'yearly',
            name: 'Yearly Premium',
            price: 99.99,
            currency: 'USD',
            interval: 'yearly',
            features: [
              'All monthly features',
              '2 months free',
              'Early access to updates',
              'Custom automation rules',
              'Dedicated support channel',
            ],
          },
        ],
      },
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
        requiredFeatures: ['network-access', 'storage'],
        dependencies: [],
      },
      metadata: {
        size: 2048576,
        downloadUrl: 'https://cdn.mtyb.shop/plugins/vpn-premium-2.1.0.zip',
        checksumSha256: 'abc123...',
        changelog: [
          {
            version: '2.1.0',
            date: new Date('2024-01-10'),
            changes: [
              'Added support for 3 new VPN providers',
              'Improved connection stability',
              'Enhanced analytics dashboard',
              'Fixed compatibility issues with mobile devices',
              'Added dark mode support',
            ],
            type: 'minor',
          },
          {
            version: '2.0.0',
            date: new Date('2023-12-15'),
            changes: [
              'Complete UI redesign',
              'New automation engine',
              'Advanced analytics suite',
              'Multi-provider management',
              'Breaking: New configuration format',
            ],
            type: 'major',
          },
          {
            version: '1.9.5',
            date: new Date('2023-11-20'),
            changes: [
              'Security vulnerability fixes',
              'Performance improvements',
              'Bug fixes and stability improvements',
            ],
            type: 'patch',
          },
        ],
        license: 'MIT',
        homepage: 'https://mtyb.shop/plugins/vpn-premium',
        repository: 'https://github.com/mtyb/vpn-premium-plugin',
        bugTracker: 'https://github.com/mtyb/vpn-premium-plugin/issues',
        documentation: 'https://docs.mtyb.shop/plugins/vpn-premium',
      },
      createdAt: new Date('2023-08-15'),
      updatedAt: new Date('2024-01-10'),
      publishedAt: new Date('2023-08-20'),
      status: 'published' as any,
    };
  }, [pluginId]);

  const fetchPluginReviews = useCallback(async (): Promise<PluginReview[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    return [
      {
        id: 'review-1',
        pluginId,
        userId: 'user-1',
        userName: 'Alex Chen',
        userAvatar: '👤',
        rating: 5,
        title: 'Excellent VPN management tool!',
        comment:
          'This plugin has completely transformed how I manage my VPN accounts. The automation features are incredible and save me hours each week. The analytics dashboard provides insights I never had before.',
        pros: ['Easy to use', 'Great automation', 'Excellent analytics', 'Fast support'],
        cons: ['Premium price', 'Learning curve for advanced features'],
        helpfulVotes: 23,
        totalVotes: 26,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
        verified: true,
        version: '2.1.0',
      },
      {
        id: 'review-2',
        pluginId,
        userId: 'user-2',
        userName: 'Sarah Johnson',
        userAvatar: '👩',
        rating: 4,
        title: 'Good plugin with room for improvement',
        comment:
          'The core functionality is solid and it works well with most VPN providers. However, I encountered some issues with the mobile interface and would love to see better integration with more providers.',
        pros: ['Reliable', 'Good provider support', 'Decent free tier'],
        cons: ['Mobile UI needs work', 'Limited free features', 'Some providers missing'],
        helpfulVotes: 15,
        totalVotes: 18,
        createdAt: new Date('2023-12-28'),
        updatedAt: new Date('2023-12-28'),
        verified: true,
        version: '2.0.0',
      },
      {
        id: 'review-3',
        pluginId,
        userId: 'user-3',
        userName: 'Mike Rodriguez',
        userAvatar: '👨',
        rating: 5,
        title: 'Perfect for power users',
        comment:
          'If you manage multiple VPN accounts across different providers, this is a must-have. The automation rules are incredibly powerful and the failover system has saved me from connection drops multiple times.',
        pros: [
          'Advanced automation',
          'Excellent failover',
          'Great documentation',
          'Active development',
        ],
        cons: ['Might be overkill for casual users'],
        helpfulVotes: 31,
        totalVotes: 33,
        createdAt: new Date('2023-12-20'),
        updatedAt: new Date('2023-12-20'),
        verified: true,
        version: '2.0.0',
      },
    ];
  }, [pluginId]);

  const fetchRatingBreakdown = useCallback(async (): Promise<PluginRatingBreakdown> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    return {
      total: 234,
      average: 4.8,
      distribution: {
        5: 156,
        4: 58,
        3: 15,
        2: 3,
        1: 2,
      },
    };
  }, []);

  const [pluginState, { execute: loadPlugin }] = useAsyncState(fetchPluginDetails);
  const [reviewsState, { execute: loadReviews }] = useAsyncState(fetchPluginReviews);
  const [ratingState, { execute: loadRating }] = useAsyncState(fetchRatingBreakdown);

  useEffect(() => {
    loadPlugin();
    loadReviews();
    loadRating();
  }, [loadPlugin, loadReviews, loadRating]);

  const handleInstall = async () => {
    try {
      setInstallationStatus(PluginInstallationStatus.INSTALLING);

      // Simulate installation process
      await new Promise(resolve => setTimeout(resolve, 3000));

      setInstallationStatus(PluginInstallationStatus.INSTALLED);
      showToast({
        type: 'success',
        title: 'Plugin Installed',
        message: 'VPN Premium Manager has been successfully installed!',
      });
    } catch (error) {
      setInstallationStatus(PluginInstallationStatus.FAILED);
      showToast({
        type: 'error',
        title: 'Installation Failed',
        message: 'Failed to install plugin. Please try again.',
      });
    }
  };

  const handleUninstall = async () => {
    try {
      setInstallationStatus(PluginInstallationStatus.UNINSTALLING);

      // Simulate uninstallation
      await new Promise(resolve => setTimeout(resolve, 2000));

      setInstallationStatus(null);
      showToast({
        type: 'success',
        title: 'Plugin Uninstalled',
        message: 'VPN Premium Manager has been uninstalled.',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Uninstallation Failed',
        message: 'Failed to uninstall plugin. Please try again.',
      });
    }
  };

  const getInstallButtonText = () => {
    switch (installationStatus) {
      case PluginInstallationStatus.INSTALLING:
        return 'Installing...';
      case PluginInstallationStatus.INSTALLED:
        return 'Installed';
      case PluginInstallationStatus.UNINSTALLING:
        return 'Uninstalling...';
      case PluginInstallationStatus.FAILED:
        return 'Retry Install';
      default:
        return 'Install Plugin';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (pluginState.loading) {
    return (
      <div className="plugin-details-loading">
        <LoadingSpinner size="large" />
        <p>Loading plugin details...</p>
      </div>
    );
  }

  if (pluginState.error || !pluginState.data) {
    return (
      <ErrorMessage
        title="Failed to load plugin details"
        message={pluginState.error?.message || 'Plugin not found'}
        actions={[
          { label: 'Retry', onClick: loadPlugin, variant: 'primary' },
          ...(onBack ? [{ label: 'Go Back', onClick: onBack, variant: 'secondary' }] : []),
        ]}
      />
    );
  }

  const plugin = pluginState.data;

  return (
    <div className={`plugin-details ${className}`}>
      {/* Header */}
      <div className="details-header">
        {onBack && (
          <Button onClick={onBack} variant="ghost" size="sm" className="back-button">
            ← Back to Store
          </Button>
        )}

        <div className="plugin-header">
          <div className="plugin-icon-large">{plugin.icon}</div>

          <div className="plugin-info">
            <h1 className="plugin-title">{plugin.displayName}</h1>
            <div className="plugin-meta">
              <span className="plugin-author">
                by {plugin.author.name}
                {plugin.author.verified && <span className="verified-badge">✓</span>}
              </span>
              <span className="plugin-version">v{plugin.version}</span>
              <span className="plugin-category">{plugin.category}</span>
            </div>
            <p className="plugin-short-desc">{plugin.shortDescription}</p>
          </div>

          <div className="plugin-actions">
            <div className="plugin-price">
              {plugin.pricing.type === 'free'
                ? 'Free'
                : plugin.pricing.type === 'freemium'
                  ? 'Freemium'
                  : `$${plugin.pricing.price}`}
            </div>

            {installationStatus === PluginInstallationStatus.INSTALLED ? (
              <div className="action-buttons">
                <Button variant="secondary" size="md">
                  Configure
                </Button>
                <Button onClick={handleUninstall} variant="outline" size="md">
                  Uninstall
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleInstall}
                disabled={installationStatus === PluginInstallationStatus.INSTALLING}
                variant="primary"
                size="lg"
                className="install-button"
              >
                {getInstallButtonText()}
              </Button>
            )}
          </div>
        </div>

        <div className="plugin-stats-bar">
          <div className="stat">
            <span className="stat-icon">⭐</span>
            <span className="stat-value">{plugin.stats.rating.toFixed(1)}</span>
            <span className="stat-label">({plugin.stats.reviewCount} reviews)</span>
          </div>
          <div className="stat">
            <span className="stat-icon">📥</span>
            <span className="stat-value">{plugin.stats.downloads.toLocaleString()}</span>
            <span className="stat-label">downloads</span>
          </div>
          <div className="stat">
            <span className="stat-icon">📱</span>
            <span className="stat-value">{plugin.stats.activeInstalls.toLocaleString()}</span>
            <span className="stat-label">active installs</span>
          </div>
          <div className="stat">
            <span className="stat-icon">📦</span>
            <span className="stat-value">{formatFileSize(plugin.metadata.size)}</span>
            <span className="stat-label">size</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="details-nav">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`nav-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews ({plugin.stats.reviewCount})
        </button>
        <button
          className={`nav-tab ${activeTab === 'changelog' ? 'active' : ''}`}
          onClick={() => setActiveTab('changelog')}
        >
          Changelog
        </button>
      </div>

      {/* Tab Content */}
      <div className="details-content">
        {activeTab === 'overview' && <OverviewTab plugin={plugin} />}

        {activeTab === 'reviews' && (
          <ReviewsTab
            reviews={reviewsState.data || []}
            rating={ratingState.data}
            loading={reviewsState.loading || ratingState.loading}
          />
        )}

        {activeTab === 'changelog' && <ChangelogTab changelog={plugin.metadata.changelog} />}
      </div>

      <style>{`
        .plugin-details {
          min-height: 100vh;
          font-family: var(--font-family-base);
          background: var(--color-background);
          color: var(--color-text-primary);
        }

        .plugin-details-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: var(--space-4);
          color: var(--color-text-secondary);
        }

        .details-header {
          background: var(--color-card-background);
          border-bottom: 1px solid var(--color-border);
          padding: var(--space-6);
        }

        .back-button {
          margin-bottom: var(--space-4);
        }

        .plugin-header {
          display: flex;
          gap: var(--space-6);
          align-items: flex-start;
          margin-bottom: var(--space-6);
        }

        .plugin-icon-large {
          font-size: 4rem;
          flex-shrink: 0;
        }

        .plugin-info {
          flex: 1;
          min-width: 0;
        }

        .plugin-title {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .plugin-meta {
          display: flex;
          gap: var(--space-4);
          margin-bottom: var(--space-3);
          flex-wrap: wrap;
        }

        .plugin-author {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .verified-badge {
          color: var(--color-success);
        }

        .plugin-version,
        .plugin-category {
          background: var(--color-muted);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          text-transform: capitalize;
        }

        .plugin-short-desc {
          margin: 0;
          font-size: var(--text-base);
          color: var(--color-text-secondary);
          line-height: var(--leading-relaxed);
        }

        .plugin-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          align-items: flex-end;
          flex-shrink: 0;
        }

        .plugin-price {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
          text-align: center;
        }

        .action-buttons {
          display: flex;
          gap: var(--space-2);
        }

        .install-button {
          min-width: 150px;
        }

        .plugin-stats-bar {
          display: flex;
          gap: var(--space-8);
          justify-content: center;
          padding: var(--space-4);
          background: var(--color-muted);
          border-radius: var(--radius-lg);
        }

        .stat {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
        }

        .stat-icon {
          font-size: var(--text-base);
        }

        .stat-value {
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .stat-label {
          color: var(--color-text-secondary);
        }

        .details-nav {
          display: flex;
          background: var(--color-card-background);
          border-bottom: 1px solid var(--color-border);
          overflow-x: auto;
        }

        .nav-tab {
          background: none;
          border: none;
          padding: var(--space-4) var(--space-6);
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s ease;
          white-space: nowrap;
          min-height: var(--touch-target-min);
        }

        .nav-tab:hover {
          color: var(--color-text-primary);
          background: var(--color-hover);
        }

        .nav-tab.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        .details-content {
          padding: var(--space-8) var(--space-6);
          max-width: 1000px;
          margin: 0 auto;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .details-header {
            padding: var(--space-4);
          }

          .plugin-header {
            flex-direction: column;
            gap: var(--space-4);
          }

          .plugin-actions {
            align-items: stretch;
            width: 100%;
          }

          .action-buttons {
            flex-direction: column;
          }

          .plugin-stats-bar {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--space-4);
            display: grid;
          }

          .details-content {
            padding: var(--space-6) var(--space-4);
          }

          .plugin-title {
            font-size: var(--text-2xl);
          }

          .plugin-meta {
            flex-direction: column;
            gap: var(--space-2);
          }
        }
      `}</style>
    </div>
  );
};

// Overview Tab Component
interface OverviewTabProps {
  plugin: PluginStoreItem;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ plugin }) => {
  return (
    <div className="overview-tab">
      <div className="description-section">
        <div
          className="plugin-description"
          dangerouslySetInnerHTML={{
            __html: plugin.description.replace(/\n/g, '<br />').replace(/# (.*)/g, '<h3>$1</h3>'),
          }}
        />
      </div>

      <div className="info-sections">
        <div className="info-section">
          <h3>Plugin Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Version</span>
              <span className="info-value">{plugin.version}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Category</span>
              <span className="info-value">{plugin.category}</span>
            </div>
            <div className="info-item">
              <span className="info-label">License</span>
              <span className="info-value">{plugin.metadata.license}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Updated</span>
              <span className="info-value">{plugin.updatedAt.toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>Compatibility</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Platform Version</span>
              <span className="info-value">{plugin.compatibility.minPlatformVersion}+</span>
            </div>
            <div className="info-item">
              <span className="info-label">Supported Devices</span>
              <span className="info-value">{plugin.compatibility.supportedDevices.join(', ')}</span>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>Tags</h3>
          <div className="plugin-tags">
            {plugin.tags.map(tag => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .overview-tab {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }

        .plugin-description {
          line-height: var(--leading-relaxed);
          color: var(--color-text-primary);
        }

        .plugin-description h3 {
          margin: var(--space-6) 0 var(--space-3) 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .info-sections {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .info-section h3 {
          margin: 0 0 var(--space-4) 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .info-label {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .info-value {
          font-size: var(--text-base);
          color: var(--color-text-primary);
        }

        .plugin-tags {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .tag {
          background: var(--color-primary-light);
          color: var(--color-primary);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
        }
      `}</style>
    </div>
  );
};

// Reviews Tab Component
interface ReviewsTabProps {
  reviews: PluginReview[];
  rating?: PluginRatingBreakdown;
  loading: boolean;
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({ reviews, rating, loading }) => {
  if (loading) {
    return (
      <div className="reviews-loading">
        <LoadingSpinner size="medium" />
        <p>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="reviews-tab">
      {rating && (
        <div className="rating-summary">
          <div className="rating-overview">
            <div className="rating-score">
              <span className="rating-number">{rating.average.toFixed(1)}</span>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    className={`star ${star <= Math.round(rating.average) ? 'filled' : ''}`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              <span className="rating-count">{rating.total} reviews</span>
            </div>

            <div className="rating-breakdown">
              {[5, 4, 3, 2, 1].map(stars => (
                <div key={stars} className="rating-bar">
                  <span className="rating-label">{stars}★</span>
                  <div className="rating-progress">
                    <div
                      className="rating-fill"
                      style={{
                        width: `${(rating.distribution[stars as keyof typeof rating.distribution] / rating.total) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="rating-count">
                    {rating.distribution[stars as keyof typeof rating.distribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="reviews-list">
        <h3>User Reviews</h3>
        {reviews.map(review => (
          <div key={review.id} className="review-card">
            <div className="review-header">
              <div className="reviewer-info">
                <span className="reviewer-avatar">{review.userAvatar}</span>
                <div className="reviewer-details">
                  <span className="reviewer-name">{review.userName}</span>
                  <div className="review-meta">
                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span
                          key={star}
                          className={`star ${star <= review.rating ? 'filled' : ''}`}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                    <span className="review-date">{review.createdAt.toLocaleDateString()}</span>
                    {review.verified && <span className="verified-purchase">✓ Verified</span>}
                  </div>
                </div>
              </div>
              <span className="review-version">v{review.version}</span>
            </div>

            <div className="review-content">
              <h4 className="review-title">{review.title}</h4>
              <p className="review-comment">{review.comment}</p>

              {(review.pros.length > 0 || review.cons.length > 0) && (
                <div className="review-pros-cons">
                  {review.pros.length > 0 && (
                    <div className="pros">
                      <h5>👍 Pros</h5>
                      <ul>
                        {review.pros.map((pro, index) => (
                          <li key={index}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {review.cons.length > 0 && (
                    <div className="cons">
                      <h5>👎 Cons</h5>
                      <ul>
                        {review.cons.map((con, index) => (
                          <li key={index}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="review-actions">
              <span className="helpful-votes">
                {review.helpfulVotes} of {review.totalVotes} found this helpful
              </span>
              <div className="review-buttons">
                <Button variant="ghost" size="sm">
                  👍 Helpful
                </Button>
                <Button variant="ghost" size="sm">
                  🚩 Report
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .reviews-tab {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }

        .reviews-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-8);
          color: var(--color-text-secondary);
        }

        .rating-summary {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
        }

        .rating-overview {
          display: flex;
          gap: var(--space-8);
          align-items: center;
        }

        .rating-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
        }

        .rating-number {
          font-size: var(--text-4xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
        }

        .rating-stars {
          display: flex;
          gap: var(--space-1);
        }

        .star {
          opacity: 0.3;
          transition: opacity 0.2s ease;
        }

        .star.filled {
          opacity: 1;
        }

        .rating-count {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .rating-breakdown {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .rating-bar {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .rating-label {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          min-width: 30px;
        }

        .rating-progress {
          flex: 1;
          height: 8px;
          background: var(--color-muted);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .rating-fill {
          height: 100%;
          background: var(--color-primary);
          transition: width 0.3s ease;
        }

        .reviews-list h3 {
          margin: 0 0 var(--space-6) 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .review-card {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          margin-bottom: var(--space-4);
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-4);
        }

        .reviewer-info {
          display: flex;
          gap: var(--space-3);
          align-items: center;
        }

        .reviewer-avatar {
          font-size: var(--text-2xl);
        }

        .reviewer-name {
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .review-meta {
          display: flex;
          gap: var(--space-3);
          align-items: center;
          margin-top: var(--space-1);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .review-version {
          background: var(--color-muted);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
        }

        .verified-purchase {
          color: var(--color-success);
          font-weight: var(--font-weight-medium);
        }

        .review-title {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .review-comment {
          margin: 0 0 var(--space-4) 0;
          line-height: var(--leading-relaxed);
          color: var(--color-text-primary);
        }

        .review-pros-cons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-4);
        }

        .pros h5,
        .cons h5 {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-sm);
          font-weight: var(--font-weight-semibold);
        }

        .pros ul,
        .cons ul {
          margin: 0;
          padding-left: var(--space-4);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .review-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-border);
        }

        .helpful-votes {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .review-buttons {
          display: flex;
          gap: var(--space-2);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .rating-overview {
            flex-direction: column;
            gap: var(--space-6);
          }

          .review-header {
            flex-direction: column;
            gap: var(--space-3);
          }

          .review-actions {
            flex-direction: column;
            gap: var(--space-3);
            align-items: stretch;
          }

          .review-buttons {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

// Changelog Tab Component
interface ChangelogTabProps {
  changelog: any[];
}

const ChangelogTab: React.FC<ChangelogTabProps> = ({ changelog }) => {
  return (
    <div className="changelog-tab">
      <h3>Version History</h3>
      <div className="changelog-list">
        {changelog.map(entry => (
          <div key={entry.version} className="changelog-entry">
            <div className="changelog-header">
              <div className="version-info">
                <h4 className="version-number">v{entry.version}</h4>
                <span className={`version-type ${entry.type}`}>{entry.type}</span>
              </div>
              <span className="release-date">{entry.date.toLocaleDateString()}</span>
            </div>

            <div className="changelog-content">
              <ul className="changes-list">
                {entry.changes.map((change: string, index: number) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .changelog-tab h3 {
          margin: 0 0 var(--space-6) 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .changelog-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .changelog-entry {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
        }

        .changelog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4);
        }

        .version-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .version-number {
          margin: 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .version-type {
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          font-weight: var(--font-weight-medium);
          text-transform: uppercase;
        }

        .version-type.major {
          background: var(--color-error-light);
          color: var(--color-error);
        }

        .version-type.minor {
          background: var(--color-warning-light);
          color: var(--color-warning);
        }

        .version-type.patch {
          background: var(--color-success-light);
          color: var(--color-success);
        }

        .release-date {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .changes-list {
          margin: 0;
          padding-left: var(--space-5);
          color: var(--color-text-primary);
          line-height: var(--leading-relaxed);
        }

        .changes-list li {
          margin-bottom: var(--space-2);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .changelog-header {
            flex-direction: column;
            gap: var(--space-2);
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default PluginDetails;
