import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useAsyncState } from '../../hooks/useAsyncState';
import { Button } from '../ui/Button';
import { LoadingSpinner, ErrorMessage } from '../common';
import {
  PluginStoreItem,
  PluginSearchQuery,
  PluginSortBy,
  PluginCategory,
} from '../../types/pluginStore';
import { pluginStoreService } from '../../services/plugin';

interface PluginStoreProps {
  className?: string;
}

export const PluginStore: React.FC<PluginStoreProps> = ({ className = '' }) => {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState<PluginSearchQuery>({
    query: '',
    sortBy: PluginSortBy.POPULARITY,
    page: 1,
    limit: 12,
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 使用新的插件商店服务
  const fetchFeaturedPlugins = useCallback(async (): Promise<PluginStoreItem[]> => {
    return await pluginStoreService.getFeaturedPlugins();
  }, []);

  const fetchCategories = useCallback(async (): Promise<PluginCategory[]> => {
    // 模拟分类数据（实际应该从服务获取）
    await new Promise(resolve => setTimeout(resolve, 300));

    return [
      {
        id: 'vpn',
        name: 'VPN Services',
        slug: 'vpn',
        description: 'VPN account management and automation plugins',
        icon: '🔒',
        pluginCount: 23,
        featured: true,
        order: 1,
      },
      {
        id: 'streaming',
        name: 'Streaming',
        slug: 'streaming',
        description: 'Streaming service account and content management',
        icon: '📺',
        pluginCount: 18,
        featured: true,
        order: 2,
      },
      {
        id: 'gaming',
        name: 'Gaming',
        slug: 'gaming',
        description: 'Gaming accounts, keys, and digital game management',
        icon: '🎮',
        pluginCount: 31,
        featured: true,
        order: 3,
      },
      {
        id: 'software',
        name: 'Software',
        slug: 'software',
        description: 'Software licenses and application management',
        icon: '💻',
        pluginCount: 27,
        featured: true,
        order: 4,
      },
      {
        id: 'digital_goods',
        name: 'Digital Goods',
        slug: 'digital-goods',
        description: 'General digital goods and content management',
        icon: '📦',
        pluginCount: 15,
        featured: false,
        order: 5,
      },
    ];
  }, []);

  const [featuredState, { execute: loadFeatured }] = useAsyncState(fetchFeaturedPlugins);
  const [categoriesState, { execute: loadCategories }] = useAsyncState(fetchCategories);

  useEffect(() => {
    loadFeatured();
    loadCategories();
  }, [loadFeatured, loadCategories]);

  const handleSearch = (query: string) => {
    setSearchQuery(prev => ({ ...prev, query, page: 1 }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchQuery(prev => ({
      ...prev,
      category: categoryId === 'all' ? undefined : categoryId,
      page: 1,
    }));
  };

  const handleSortChange = (sortBy: PluginSortBy) => {
    setSearchQuery(prev => ({ ...prev, sortBy, page: 1 }));
  };

  return (
    <div className={`plugin-store ${className}`}>
      {/* Header */}
      <div className="store-header">
        <div className="header-content">
          <h1>Plugin Store</h1>
          <p>Discover and install powerful plugins to enhance your experience</p>
        </div>

        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search plugins..."
              value={searchQuery.query || ''}
              onChange={e => handleSearch(e.target.value)}
              className="search-input"
            />
            <button className="search-button">🔍</button>
          </div>

          <div className="search-filters">
            <select
              value={selectedCategory}
              onChange={e => handleCategoryChange(e.target.value)}
              className="category-select"
            >
              <option value="all">All Categories</option>
              {categoriesState.data?.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name} ({category.pluginCount})
                </option>
              ))}
            </select>

            <select
              value={searchQuery.sortBy}
              onChange={e => handleSortChange(e.target.value as PluginSortBy)}
              className="sort-select"
            >
              <option value={PluginSortBy.POPULARITY}>Most Popular</option>
              <option value={PluginSortBy.RATING}>Highest Rated</option>
              <option value={PluginSortBy.DOWNLOADS}>Most Downloads</option>
              <option value={PluginSortBy.NEWEST}>Newest</option>
              <option value={PluginSortBy.UPDATED}>Recently Updated</option>
              <option value={PluginSortBy.NAME}>Name A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories */}
      <section className="categories-section">
        <h2>Browse Categories</h2>
        {categoriesState.loading ? (
          <div className="categories-loading">
            <LoadingSpinner size="medium" />
          </div>
        ) : categoriesState.error ? (
          <ErrorMessage
            title="Failed to load categories"
            message={categoriesState.error.message}
            actions={[{ label: 'Retry', onClick: loadCategories, variant: 'primary' }]}
          />
        ) : (
          <div className="categories-grid">
            {categoriesState.data
              ?.filter(cat => cat.featured)
              .map(category => (
                <button
                  key={category.id}
                  className={`category-card ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  <div className="category-icon">{category.icon}</div>
                  <div className="category-info">
                    <h3>{category.name}</h3>
                    <p>{category.pluginCount} plugins</p>
                  </div>
                </button>
              ))}
          </div>
        )}
      </section>

      {/* Featured Plugins */}
      <section className="featured-section">
        <div className="section-header">
          <h2>Featured Plugins</h2>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>

        {featuredState.loading ? (
          <div className="plugins-loading">
            <LoadingSpinner size="large" />
            <p>Loading featured plugins...</p>
          </div>
        ) : featuredState.error ? (
          <ErrorMessage
            title="Failed to load featured plugins"
            message={featuredState.error.message}
            actions={[{ label: 'Retry', onClick: loadFeatured, variant: 'primary' }]}
          />
        ) : (
          <div className="plugins-grid">
            {featuredState.data?.map(plugin => <PluginCard key={plugin.id} plugin={plugin} />)}
          </div>
        )}
      </section>

      <style>{`
        .plugin-store {
          min-height: 100vh;
          font-family: var(--font-family-base);
          background: var(--color-background);
          color: var(--color-text-primary);
        }

        .store-header {
          background: var(--color-card-background);
          border-bottom: 1px solid var(--color-border);
          padding: var(--space-8) var(--space-6);
        }

        .header-content {
          text-align: center;
          margin-bottom: var(--space-6);
        }

        .header-content h1 {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-4xl);
          font-weight: var(--font-weight-bold);
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-content p {
          margin: 0;
          font-size: var(--text-lg);
          color: var(--color-text-secondary);
        }

        .search-section {
          max-width: 800px;
          margin: 0 auto;
        }

        .search-bar {
          position: relative;
          margin-bottom: var(--space-4);
        }

        .search-input {
          width: 100%;
          padding: var(--space-4) var(--space-12) var(--space-4) var(--space-4);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-xl);
          font-size: var(--text-base);
          color: var(--color-text-primary);
          background: var(--color-background);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          min-height: var(--touch-target-min);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }

        .search-button {
          position: absolute;
          right: var(--space-2);
          top: 50%;
          transform: translateY(-50%);
          background: var(--color-primary);
          border: none;
          border-radius: var(--radius-lg);
          padding: var(--space-2) var(--space-3);
          font-size: var(--text-lg);
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .search-button:hover {
          background: var(--color-primary-dark);
        }

        .search-filters {
          display: flex;
          gap: var(--space-3);
          justify-content: center;
        }

        .category-select,
        .sort-select {
          padding: var(--space-3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          font-size: var(--text-sm);
          color: var(--color-text-primary);
          background: var(--color-background);
          min-height: var(--touch-target-min);
          min-width: 160px;
        }

        .category-select:focus,
        .sort-select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-light);
        }

        .categories-section,
        .featured-section {
          padding: var(--space-8) var(--space-6);
          max-width: 1400px;
          margin: 0 auto;
        }

        .categories-section h2,
        .featured-section h2 {
          margin: 0 0 var(--space-6) 0;
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
        }

        .categories-loading,
        .plugins-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-12);
          gap: var(--space-4);
          color: var(--color-text-secondary);
        }

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        }

        .category-card {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-5);
          background: var(--color-card-background);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          min-height: var(--touch-target-min);
        }

        .category-card:hover {
          border-color: var(--color-primary-light);
          box-shadow: var(--shadow-md);
        }

        .category-card.active {
          border-color: var(--color-primary);
          background: var(--color-primary-light);
        }

        .category-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .category-info h3 {
          margin: 0 0 var(--space-1) 0;
          font-size: var(--text-base);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .category-info p {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .plugins-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--space-6);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .store-header {
            padding: var(--space-6) var(--space-4);
          }

          .header-content h1 {
            font-size: var(--text-3xl);
          }

          .search-filters {
            flex-direction: column;
            gap: var(--space-3);
          }

          .category-select,
          .sort-select {
            width: 100%;
            min-width: auto;
          }

          .categories-section,
          .featured-section {
            padding: var(--space-6) var(--space-4);
          }

          .categories-grid {
            grid-template-columns: 1fr;
          }

          .plugins-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            gap: var(--space-3);
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

// Plugin Card Component
interface PluginCardProps {
  plugin: PluginStoreItem;
}

const PluginCard: React.FC<PluginCardProps> = ({ plugin }) => {
  const { isDark } = useTheme();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await pluginStoreService.installPlugin(plugin.id);
      console.log('Plugin installed successfully:', plugin.id);
    } catch (error) {
      console.error('Failed to install plugin:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const getPriceDisplay = () => {
    if (plugin.pricing.type === 'free') return 'Free';
    if (plugin.pricing.type === 'freemium') return 'Freemium';
    return `$${plugin.pricing.price}`;
  };

  const formatDownloads = (downloads: number) => {
    if (downloads >= 1000000) return `${(downloads / 1000000).toFixed(1)}M`;
    if (downloads >= 1000) return `${(downloads / 1000).toFixed(1)}K`;
    return downloads.toString();
  };

  return (
    <div className="plugin-card">
      <div className="plugin-header">
        <div className="plugin-icon">{plugin.icon}</div>
        <div className="plugin-info">
          <h3 className="plugin-name">{plugin.displayName}</h3>
          <p className="plugin-author">
            by {plugin.author.name}
            {plugin.author.verified && <span className="verified-badge">✓</span>}
          </p>
        </div>
        <div className="plugin-price">{getPriceDisplay()}</div>
      </div>

      <p className="plugin-description">{plugin.shortDescription}</p>

      <div className="plugin-stats">
        <div className="stat">
          <span className="stat-icon">⭐</span>
          <span className="stat-value">{plugin.stats.rating.toFixed(1)}</span>
        </div>
        <div className="stat">
          <span className="stat-icon">📥</span>
          <span className="stat-value">{formatDownloads(plugin.stats.downloads)}</span>
        </div>
        <div className="stat">
          <span className="stat-icon">💬</span>
          <span className="stat-value">{plugin.stats.reviewCount}</span>
        </div>
      </div>

      <div className="plugin-tags">
        {plugin.tags.slice(0, 3).map(tag => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="plugin-actions">
        <Button
          onClick={handleInstall}
          disabled={isInstalling}
          variant="primary"
          size="sm"
          className="install-button"
        >
          {isInstalling ? 'Installing...' : 'Install'}
        </Button>
        <Button variant="ghost" size="sm">
          Details
        </Button>
      </div>

      <style>{`
        .plugin-card {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .plugin-card:hover {
          border-color: var(--color-primary-light);
          box-shadow: var(--shadow-lg);
        }

        .plugin-header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
        }

        .plugin-icon {
          font-size: 2.5rem;
          flex-shrink: 0;
        }

        .plugin-info {
          flex: 1;
          min-width: 0;
        }

        .plugin-name {
          margin: 0 0 var(--space-1) 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          word-break: break-word;
        }

        .plugin-author {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .verified-badge {
          color: var(--color-success);
          font-size: var(--text-xs);
        }

        .plugin-price {
          font-size: var(--text-base);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
          flex-shrink: 0;
        }

        .plugin-description {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: var(--leading-normal);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .plugin-stats {
          display: flex;
          gap: var(--space-4);
        }

        .stat {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--text-sm);
        }

        .stat-icon {
          font-size: var(--text-base);
        }

        .stat-value {
          color: var(--color-text-primary);
          font-weight: var(--font-weight-medium);
        }

        .plugin-tags {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .tag {
          background: var(--color-muted);
          color: var(--color-text-secondary);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          font-weight: var(--font-weight-medium);
        }

        .plugin-actions {
          display: flex;
          gap: var(--space-2);
          margin-top: auto;
        }

        .install-button {
          flex: 1;
        }
      `}</style>
    </div>
  );
};

export default PluginStore;
