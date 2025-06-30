import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useAsyncState } from '../../hooks/useAsyncState';
import { Button } from '../ui/Button';
import { LoadingSpinner, ErrorMessage } from '../common';
import {
  PluginStoreItem,
  PluginSearchQuery,
  PluginSearchResult,
  PluginSortBy,
  PluginCategory,
} from '../../types/pluginStore';

interface PluginSearchProps {
  onResults?: (results: PluginSearchResult) => void;
  className?: string;
}

export const PluginSearch: React.FC<PluginSearchProps> = ({ onResults, className = '' }) => {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState<PluginSearchQuery>({
    query: '',
    sortBy: PluginSortBy.POPULARITY,
    page: 1,
    limit: 12,
  });
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Mock search function
  const performSearch = useCallback(
    async (query: PluginSearchQuery): Promise<PluginSearchResult> => {
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock search results
      const mockResults: PluginStoreItem[] = [
        {
          id: 'vpn-premium',
          name: 'vpn-premium',
          displayName: 'VPN Premium Manager',
          shortDescription: 'Advanced VPN account management with premium features',
          description: 'A comprehensive VPN management plugin with advanced features.',
          version: '2.1.0',
          latestVersion: '2.1.0',
          author: {
            id: 'mtyb-team',
            name: 'MTYB Team',
            email: 'plugins@mtyb.shop',
            verified: true,
            publishedPlugins: 12,
            totalDownloads: 45623,
            averageRating: 4.8,
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
        // Add more mock results based on search query...
      ];

      // Simulate filtering and searching
      let filteredResults = mockResults;

      if (query.query) {
        filteredResults = filteredResults.filter(
          plugin =>
            plugin.displayName.toLowerCase().includes(query.query!.toLowerCase()) ||
            plugin.description.toLowerCase().includes(query.query!.toLowerCase()) ||
            plugin.tags.some(tag => tag.toLowerCase().includes(query.query!.toLowerCase()))
        );
      }

      if (query.category) {
        filteredResults = filteredResults.filter(plugin => plugin.category === query.category);
      }

      if (query.tags?.length) {
        filteredResults = filteredResults.filter(plugin =>
          query.tags!.some(tag => plugin.tags.includes(tag))
        );
      }

      if (query.pricing) {
        filteredResults = filteredResults.filter(plugin => plugin.pricing.type === query.pricing);
      }

      if (query.rating) {
        filteredResults = filteredResults.filter(plugin => plugin.stats.rating >= query.rating!);
      }

      // Simulate sorting
      if (query.sortBy) {
        filteredResults.sort((a, b) => {
          switch (query.sortBy) {
            case PluginSortBy.POPULARITY:
              return b.stats.popularityScore - a.stats.popularityScore;
            case PluginSortBy.RATING:
              return b.stats.rating - a.stats.rating;
            case PluginSortBy.DOWNLOADS:
              return b.stats.downloads - a.stats.downloads;
            case PluginSortBy.NEWEST:
              return b.publishedAt.getTime() - a.publishedAt.getTime();
            case PluginSortBy.UPDATED:
              return b.updatedAt.getTime() - a.updatedAt.getTime();
            case PluginSortBy.NAME:
              return a.displayName.localeCompare(b.displayName);
            case PluginSortBy.PRICE:
              return (a.pricing.price || 0) - (b.pricing.price || 0);
            default:
              return 0;
          }
        });
      }

      // Simulate pagination
      const start = ((query.page || 1) - 1) * (query.limit || 12);
      const end = start + (query.limit || 12);
      const paginatedResults = filteredResults.slice(start, end);

      return {
        plugins: paginatedResults,
        total: filteredResults.length,
        page: query.page || 1,
        limit: query.limit || 12,
        hasNext: end < filteredResults.length,
        hasPrevious: (query.page || 1) > 1,
        facets: {
          categories: [
            { id: 'vpn', name: 'VPN Services', count: 23 },
            { id: 'streaming', name: 'Streaming', count: 18 },
            { id: 'gaming', name: 'Gaming', count: 31 },
            { id: 'software', name: 'Software', count: 27 },
          ],
          tags: [
            { name: 'security', count: 45 },
            { name: 'automation', count: 32 },
            { name: 'premium', count: 28 },
            { name: 'free', count: 67 },
            { name: 'vpn', count: 23 },
            { name: 'streaming', count: 18 },
          ],
          authors: [
            { id: 'mtyb-team', name: 'MTYB Team', count: 12 },
            { id: 'streamdev', name: 'StreamDev Studio', count: 8 },
            { id: 'security-corp', name: 'SecureCorp', count: 15 },
          ],
          pricing: [
            { type: 'free', count: 67 },
            { type: 'freemium', count: 32 },
            { type: 'paid', count: 24 },
          ],
          ratings: [
            { rating: 4, count: 89 },
            { rating: 3, count: 34 },
            { rating: 2, count: 12 },
            { rating: 1, count: 3 },
          ],
        },
      };
    },
    []
  );

  const fetchCategories = useCallback(async (): Promise<PluginCategory[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: 'vpn',
        name: 'VPN Services',
        slug: 'vpn',
        description: 'VPN account management plugins',
        icon: '🔒',
        pluginCount: 23,
        featured: true,
        order: 1,
      },
      {
        id: 'streaming',
        name: 'Streaming',
        slug: 'streaming',
        description: 'Streaming service plugins',
        icon: '📺',
        pluginCount: 18,
        featured: true,
        order: 2,
      },
      {
        id: 'gaming',
        name: 'Gaming',
        slug: 'gaming',
        description: 'Gaming and digital game plugins',
        icon: '🎮',
        pluginCount: 31,
        featured: true,
        order: 3,
      },
      {
        id: 'software',
        name: 'Software',
        slug: 'software',
        description: 'Software license plugins',
        icon: '💻',
        pluginCount: 27,
        featured: true,
        order: 4,
      },
    ];
  }, []);

  const [searchState, { execute: executeSearch }] = useAsyncState((query: PluginSearchQuery) =>
    performSearch(query)
  );
  const [categoriesState, { execute: loadCategories }] = useAsyncState(fetchCategories);

  // Available tags for filtering
  const availableTags = useMemo(
    () => [
      'security',
      'automation',
      'premium',
      'free',
      'vpn',
      'streaming',
      'gaming',
      'social',
      'productivity',
      'analytics',
      'monitoring',
      'backup',
      'encryption',
      'api',
      'integration',
      'mobile',
      'desktop',
    ],
    []
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const searchWithTags = { ...searchQuery, tags: selectedTags };
    executeSearch(searchWithTags);
  }, [executeSearch, searchQuery, selectedTags]);

  useEffect(() => {
    if (searchState.data && onResults) {
      onResults(searchState.data);
    }
  }, [searchState.data, onResults]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(prev => ({ ...prev, query, page: 1 }));
  };

  const handleFilterChange = (filters: Partial<PluginSearchQuery>) => {
    setSearchQuery(prev => ({ ...prev, ...filters, page: 1 }));
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const handleClearFilters = () => {
    setSearchQuery({
      query: '',
      sortBy: PluginSortBy.POPULARITY,
      page: 1,
      limit: 12,
    });
    setSelectedTags([]);
  };

  const hasActiveFilters = useMemo(() => {
    return !!(
      searchQuery.category ||
      searchQuery.pricing ||
      searchQuery.rating ||
      searchQuery.author ||
      selectedTags.length > 0
    );
  }, [searchQuery, selectedTags]);

  return (
    <div className={`plugin-search ${className}`}>
      {/* Main Search Bar */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search plugins, features, or categories..."
            value={searchQuery.query || ''}
            onChange={e => handleSearchChange(e.target.value)}
            className="search-input"
          />
          <button className="search-button">🔍</button>
        </div>

        <div className="search-controls">
          <select
            value={searchQuery.sortBy}
            onChange={e => handleFilterChange({ sortBy: e.target.value as PluginSortBy })}
            className="sort-select"
          >
            <option value={PluginSortBy.POPULARITY}>Most Popular</option>
            <option value={PluginSortBy.RATING}>Highest Rated</option>
            <option value={PluginSortBy.DOWNLOADS}>Most Downloads</option>
            <option value={PluginSortBy.NEWEST}>Newest</option>
            <option value={PluginSortBy.UPDATED}>Recently Updated</option>
            <option value={PluginSortBy.NAME}>Name A-Z</option>
            <option value={PluginSortBy.PRICE}>Price: Low to High</option>
          </select>

          <Button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            variant={isAdvancedOpen ? 'primary' : 'secondary'}
            size="sm"
            className="filter-toggle"
          >
            🔧 Filters{' '}
            {hasActiveFilters &&
              `(${[
                searchQuery.category && 1,
                searchQuery.pricing && 1,
                searchQuery.rating && 1,
                searchQuery.author && 1,
                selectedTags.length,
              ]
                .filter(Boolean)
                .reduce((a, b) => (a || 0) + (b || 0), 0)})`}
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {isAdvancedOpen && (
        <div className="advanced-filters">
          <div className="filters-header">
            <h3>Advanced Filters</h3>
            {hasActiveFilters && (
              <Button onClick={handleClearFilters} variant="ghost" size="sm">
                Clear All
              </Button>
            )}
          </div>

          <div className="filters-grid">
            {/* Category Filter */}
            <div className="filter-group">
              <label className="filter-label">Category</label>
              <select
                value={searchQuery.category || ''}
                onChange={e => handleFilterChange({ category: e.target.value || undefined })}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categoriesState.data?.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name} ({category.pluginCount})
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing Filter */}
            <div className="filter-group">
              <label className="filter-label">Pricing</label>
              <select
                value={searchQuery.pricing || ''}
                onChange={e =>
                  handleFilterChange({ pricing: (e.target.value as any) || undefined })
                }
                className="filter-select"
              >
                <option value="">All Pricing</option>
                <option value="free">Free</option>
                <option value="freemium">Freemium</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div className="filter-group">
              <label className="filter-label">Minimum Rating</label>
              <select
                value={searchQuery.rating || ''}
                onChange={e =>
                  handleFilterChange({
                    rating: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="filter-select"
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </select>
            </div>

            {/* Author Filter */}
            <div className="filter-group">
              <label className="filter-label">Author</label>
              <select
                value={searchQuery.author || ''}
                onChange={e => handleFilterChange({ author: e.target.value || undefined })}
                className="filter-select"
              >
                <option value="">All Authors</option>
                <option value="mtyb-team">MTYB Team</option>
                <option value="streamdev">StreamDev Studio</option>
                <option value="security-corp">SecureCorp</option>
              </select>
            </div>
          </div>

          {/* Tags Filter */}
          <div className="filter-group full-width">
            <label className="filter-label">Tags</label>
            <div className="tags-filter">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`tag-filter ${selectedTags.includes(tag) ? 'active' : ''}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Results Summary */}
      {searchState.data && (
        <div className="search-summary">
          <div className="results-count">
            {searchState.data.total} plugins found
            {searchQuery.query && <span className="search-term"> for "{searchQuery.query}"</span>}
          </div>

          {hasActiveFilters && (
            <div className="active-filters">
              <span className="filters-label">Active filters:</span>
              {searchQuery.category && (
                <span className="active-filter">
                  Category: {categoriesState.data?.find(c => c.id === searchQuery.category)?.name}
                  <button onClick={() => handleFilterChange({ category: undefined })}>×</button>
                </span>
              )}
              {searchQuery.pricing && (
                <span className="active-filter">
                  Pricing: {searchQuery.pricing}
                  <button onClick={() => handleFilterChange({ pricing: undefined })}>×</button>
                </span>
              )}
              {searchQuery.rating && (
                <span className="active-filter">
                  Rating: {searchQuery.rating}+ stars
                  <button onClick={() => handleFilterChange({ rating: undefined })}>×</button>
                </span>
              )}
              {selectedTags.map(tag => (
                <span key={tag} className="active-filter">
                  Tag: {tag}
                  <button onClick={() => handleTagToggle(tag)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {searchState.loading && (
        <div className="search-loading">
          <LoadingSpinner size="medium" />
          <p>Searching plugins...</p>
        </div>
      )}

      {/* Error State */}
      {searchState.error && (
        <ErrorMessage
          title="Search failed"
          message={searchState.error.message}
          actions={[
            {
              label: 'Retry',
              onClick: () => executeSearch(searchQuery),
              variant: 'primary',
            },
          ]}
        />
      )}

      <style>{`
        .plugin-search {
          font-family: var(--font-family-base);
        }

        .search-bar {
          display: flex;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
        }

        .search-input-wrapper {
          flex: 1;
          position: relative;
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

        .search-controls {
          display: flex;
          gap: var(--space-3);
          align-items: center;
        }

        .sort-select {
          padding: var(--space-3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          font-size: var(--text-sm);
          color: var(--color-text-primary);
          background: var(--color-background);
          min-height: var(--touch-target-min);
          min-width: 180px;
        }

        .sort-select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-light);
        }

        .advanced-filters {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          margin-bottom: var(--space-4);
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-5);
        }

        .filters-header h3 {
          margin: 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-5);
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .filter-group.full-width {
          grid-column: 1 / -1;
        }

        .filter-label {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .filter-select {
          padding: var(--space-3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          color: var(--color-text-primary);
          background: var(--color-background);
          min-height: var(--touch-target-min);
        }

        .filter-select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-light);
        }

        .tags-filter {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .tag-filter {
          background: var(--color-muted);
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: var(--touch-target-min);
        }

        .tag-filter:hover {
          background: var(--color-hover);
          color: var(--color-text-primary);
        }

        .tag-filter.active {
          background: var(--color-primary);
          color: var(--color-primary-contrast);
          border-color: var(--color-primary);
        }

        .search-summary {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-4);
          margin-bottom: var(--space-6);
          padding: var(--space-4);
          background: var(--color-muted);
          border-radius: var(--radius-lg);
        }

        .results-count {
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .search-term {
          color: var(--color-primary);
          font-weight: var(--font-weight-semibold);
        }

        .active-filters {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
          align-items: center;
        }

        .filters-label {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .active-filter {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          background: var(--color-primary-light);
          color: var(--color-primary);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          font-weight: var(--font-weight-medium);
        }

        .active-filter button {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: var(--text-sm);
          padding: 0;
          margin-left: var(--space-1);
        }

        .active-filter button:hover {
          opacity: 0.7;
        }

        .search-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-8);
          color: var(--color-text-secondary);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .search-bar {
            flex-direction: column;
            gap: var(--space-3);
          }

          .search-controls {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-3);
          }

          .sort-select {
            min-width: auto;
          }

          .filters-grid {
            grid-template-columns: 1fr;
          }

          .search-summary {
            flex-direction: column;
            gap: var(--space-3);
          }

          .active-filters {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default PluginSearch;
