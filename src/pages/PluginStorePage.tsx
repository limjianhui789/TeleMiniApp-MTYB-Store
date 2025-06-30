import React, { useState, useCallback } from 'react';
import { ThemeProvider } from '../components/theme';
import { ToastProvider } from '../components/feedback/Toast';
import { PluginStore, PluginDetails, PluginSearch } from '../components/pluginStore';
import { PluginSearchResult } from '../types/pluginStore';

type ViewMode = 'store' | 'search' | 'details';

export const PluginStorePage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('store');
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PluginSearchResult | null>(null);

  const handlePluginSelect = useCallback((pluginId: string) => {
    setSelectedPluginId(pluginId);
    setViewMode('details');
  }, []);

  const handleSearchResults = useCallback((results: PluginSearchResult) => {
    setSearchResults(results);
    setViewMode('search');
  }, []);

  const handleBackToStore = useCallback(() => {
    setViewMode('store');
    setSelectedPluginId(null);
    setSearchResults(null);
  }, []);

  const renderContent = () => {
    switch (viewMode) {
      case 'details':
        return <PluginDetails pluginId={selectedPluginId!} onBack={handleBackToStore} />;

      case 'search':
        return (
          <div className="search-page">
            <div className="search-header">
              <button onClick={handleBackToStore} className="back-button">
                ← Back to Store
              </button>
              <h1>Search Results</h1>
            </div>

            <PluginSearch onResults={handleSearchResults} />

            {searchResults && (
              <div className="search-results">
                {searchResults.plugins.length > 0 ? (
                  <div className="plugins-grid">
                    {searchResults.plugins.map(plugin => (
                      <PluginCard
                        key={plugin.id}
                        plugin={plugin}
                        onSelect={() => handlePluginSelect(plugin.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="no-results">
                    <div className="no-results-icon">🔍</div>
                    <h3>No plugins found</h3>
                    <p>Try adjusting your search terms or filters</p>
                  </div>
                )}

                {/* Pagination */}
                {searchResults.total > searchResults.limit && (
                  <div className="pagination">
                    <button disabled={!searchResults.hasPrevious} className="pagination-button">
                      Previous
                    </button>
                    <span className="pagination-info">
                      Page {searchResults.page} of{' '}
                      {Math.ceil(searchResults.total / searchResults.limit)}
                    </span>
                    <button disabled={!searchResults.hasNext} className="pagination-button">
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return <PluginStore />;
    }
  };

  return (
    <ThemeProvider defaultTheme="auto">
      <ToastProvider>
        <div className="plugin-store-page">
          {renderContent()}

          <style>{`
            .plugin-store-page {
              min-height: 100vh;
              background: var(--color-background);
              color: var(--color-text-primary);
            }

            .search-page {
              padding: var(--space-6);
              max-width: 1400px;
              margin: 0 auto;
            }

            .search-header {
              display: flex;
              align-items: center;
              gap: var(--space-4);
              margin-bottom: var(--space-6);
              padding-bottom: var(--space-4);
              border-bottom: 1px solid var(--color-border);
            }

            .back-button {
              background: none;
              border: none;
              color: var(--color-primary);
              font-size: var(--text-base);
              cursor: pointer;
              padding: var(--space-2);
              border-radius: var(--radius-md);
              transition: background-color 0.2s ease;
              min-height: var(--touch-target-min);
            }

            .back-button:hover {
              background: var(--color-hover);
            }

            .search-header h1 {
              margin: 0;
              font-size: var(--text-2xl);
              font-weight: var(--font-weight-bold);
              color: var(--color-text-primary);
            }

            .search-results {
              margin-top: var(--space-8);
            }

            .plugins-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
              gap: var(--space-6);
              margin-bottom: var(--space-8);
            }

            .no-results {
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

            .no-results-icon {
              font-size: 4rem;
              margin-bottom: var(--space-4);
              opacity: 0.5;
            }

            .no-results h3 {
              margin: 0 0 var(--space-2) 0;
              font-size: var(--text-xl);
              color: var(--color-text-primary);
            }

            .no-results p {
              margin: 0;
              color: var(--color-text-secondary);
            }

            .pagination {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: var(--space-4);
              padding: var(--space-6);
            }

            .pagination-button {
              padding: var(--space-3) var(--space-5);
              border: 1px solid var(--color-border);
              border-radius: var(--radius-lg);
              background: var(--color-card-background);
              color: var(--color-text-primary);
              font-size: var(--text-sm);
              cursor: pointer;
              transition: all 0.2s ease;
              min-height: var(--touch-target-min);
            }

            .pagination-button:hover:not(:disabled) {
              background: var(--color-hover);
              border-color: var(--color-primary-light);
            }

            .pagination-button:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            .pagination-info {
              font-size: var(--text-sm);
              color: var(--color-text-secondary);
              font-weight: var(--font-weight-medium);
            }

            /* Mobile optimizations */
            @media (max-width: 768px) {
              .search-page {
                padding: var(--space-4);
              }

              .search-header {
                flex-direction: column;
                align-items: flex-start;
                gap: var(--space-3);
              }

              .plugins-grid {
                grid-template-columns: 1fr;
              }

              .pagination {
                flex-direction: column;
                gap: var(--space-3);
              }
            }
          `}</style>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
};

// Plugin Card Component for search results
interface PluginCardProps {
  plugin: any;
  onSelect: () => void;
}

const PluginCard: React.FC<PluginCardProps> = ({ plugin, onSelect }) => {
  const formatDownloads = (downloads: number) => {
    if (downloads >= 1000000) return `${(downloads / 1000000).toFixed(1)}M`;
    if (downloads >= 1000) return `${(downloads / 1000).toFixed(1)}K`;
    return downloads.toString();
  };

  const getPriceDisplay = () => {
    if (plugin.pricing.type === 'free') return 'Free';
    if (plugin.pricing.type === 'freemium') return 'Freemium';
    return `$${plugin.pricing.price}`;
  };

  return (
    <div className="plugin-card" onClick={onSelect}>
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
        {plugin.tags.slice(0, 3).map((tag: string) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>

      <style>{`
        .plugin-card {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          cursor: pointer;
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
      `}</style>
    </div>
  );
};

export default PluginStorePage;
