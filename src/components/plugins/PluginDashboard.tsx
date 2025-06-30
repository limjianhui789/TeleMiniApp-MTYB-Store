import React, { useState, useEffect, useCallback } from 'react';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';
import { useAsyncState } from '../../hooks/useAsyncState';
import { LoadingSpinner, ErrorMessage } from '../common';
import { Button } from '../ui/Button';

// 引用现有的插件系统类型
interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  status: 'enabled' | 'disabled' | 'error' | 'loading';
  isEnabled: boolean;
  lastHealthCheck?: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
    timestamp: Date;
  };
  executionStats?: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    lastExecution?: Date;
  };
  registeredAt: Date;
  lastUpdated: Date;
}

interface PluginManagerStats {
  totalPlugins: number;
  enabledPlugins: number;
  disabledPlugins: number;
  healthyPlugins: number;
  unhealthyPlugins: number;
  totalExecutions: number;
  successRate: number;
}

interface PluginDashboardProps {
  className?: string;
}

export const PluginDashboard: React.FC<PluginDashboardProps> = ({ className = '' }) => {
  const { colorScheme } = useTelegramTheme();
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled' | 'error'>('all');

  // 模拟插件管理器API调用（实际项目中应该连接到真实的PluginManager）
  const fetchPlugins = useCallback(async (): Promise<PluginInfo[]> => {
    // 这里应该调用实际的插件管理器
    // 例如: return pluginManager.getAllPlugins();

    // 模拟数据用于演示
    await new Promise(resolve => setTimeout(resolve, 1000));

    return [
      {
        id: 'vpn-plugin',
        name: 'VPN Manager',
        version: '1.2.0',
        description: 'Advanced VPN configuration and management tool for secure connections',
        author: 'MTYB Team',
        status: 'enabled',
        isEnabled: true,
        lastHealthCheck: {
          status: 'healthy',
          message: 'All systems operational',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
        },
        executionStats: {
          totalExecutions: 245,
          successfulExecutions: 243,
          failedExecutions: 2,
          averageExecutionTime: 1200,
          lastExecution: new Date(Date.now() - 2 * 60 * 1000),
        },
        registeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        id: 'security-scanner',
        name: 'Security Scanner',
        version: '2.1.5',
        description: 'Automated security vulnerability scanner and threat detection',
        author: 'Security Corp',
        status: 'enabled',
        isEnabled: true,
        lastHealthCheck: {
          status: 'degraded',
          message: 'API rate limit approaching',
          timestamp: new Date(Date.now() - 3 * 60 * 1000),
        },
        executionStats: {
          totalExecutions: 89,
          successfulExecutions: 87,
          failedExecutions: 2,
          averageExecutionTime: 3400,
          lastExecution: new Date(Date.now() - 15 * 60 * 1000),
        },
        registeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        id: 'backup-manager',
        name: 'Backup Manager',
        version: '1.0.3',
        description: 'Automated backup and restore system for data protection',
        author: 'Backup Solutions',
        status: 'disabled',
        isEnabled: false,
        lastHealthCheck: {
          status: 'healthy',
          message: 'Plugin disabled by user',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        executionStats: {
          totalExecutions: 12,
          successfulExecutions: 12,
          failedExecutions: 0,
          averageExecutionTime: 890,
          lastExecution: new Date(Date.now() - 25 * 60 * 60 * 1000),
        },
        registeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ];
  }, []);

  const fetchStats = useCallback(async (): Promise<PluginManagerStats> => {
    // 这里应该调用实际的插件管理器统计
    // 例如: return pluginManager.getManagerStats();

    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      totalPlugins: 3,
      enabledPlugins: 2,
      disabledPlugins: 1,
      healthyPlugins: 2,
      unhealthyPlugins: 1,
      totalExecutions: 346,
      successRate: 99.1,
    };
  }, []);

  const [pluginsState, { execute: loadPlugins }] = useAsyncState(fetchPlugins);
  const [statsState, { execute: loadStats }] = useAsyncState(fetchStats);

  useEffect(() => {
    loadPlugins();
    loadStats();

    // 设置定期刷新
    const interval = setInterval(() => {
      loadPlugins();
      loadStats();
    }, 30000); // 每30秒刷新一次

    return () => clearInterval(interval);
  }, [loadPlugins, loadStats]);

  const handleTogglePlugin = useCallback(
    async (pluginId: string, enable: boolean) => {
      try {
        // 这里应该调用实际的插件管理器
        // if (enable) {
        //   await pluginManager.enablePlugin(pluginId);
        // } else {
        //   await pluginManager.disablePlugin(pluginId);
        // }

        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 重新加载数据
        await loadPlugins();
        await loadStats();
      } catch (error) {
        console.error('Failed to toggle plugin:', error);
      }
    },
    [loadPlugins, loadStats]
  );

  const handleReloadPlugin = useCallback(
    async (pluginId: string) => {
      try {
        // 这里应该调用实际的插件管理器
        // await pluginManager.reloadPlugin(pluginId);

        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 重新加载数据
        await loadPlugins();
      } catch (error) {
        console.error('Failed to reload plugin:', error);
      }
    },
    [loadPlugins]
  );

  const filteredPlugins =
    pluginsState.data?.filter(plugin => {
      switch (filter) {
        case 'enabled':
          return plugin.isEnabled;
        case 'disabled':
          return !plugin.isEnabled;
        case 'error':
          return plugin.lastHealthCheck?.status === 'unhealthy';
        default:
          return true;
      }
    }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'var(--color-success)';
      case 'degraded':
        return 'var(--color-warning)';
      case 'unhealthy':
        return 'var(--color-error)';
      case 'enabled':
        return 'var(--color-success)';
      case 'disabled':
        return 'var(--color-text-tertiary)';
      case 'error':
        return 'var(--color-error)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (pluginsState.loading || statsState.loading) {
    return (
      <div className="plugin-dashboard-loading">
        <LoadingSpinner size="large" />
        <p>Loading plugin dashboard...</p>
      </div>
    );
  }

  if (pluginsState.error || statsState.error) {
    return (
      <ErrorMessage
        title="Failed to load plugin dashboard"
        message={pluginsState.error?.message || statsState.error?.message || 'Unknown error'}
        actions={[
          {
            label: 'Retry',
            onClick: () => {
              loadPlugins();
              loadStats();
            },
            variant: 'primary',
          },
        ]}
      />
    );
  }

  return (
    <div className={`plugin-dashboard ${className}`}>
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Plugin Dashboard</h2>
          <span className="last-updated">
            Last updated: {formatRelativeTime(new Date(Date.now() - 30000))}
          </span>
        </div>

        <div className="dashboard-actions">
          <Button
            onClick={() => {
              loadPlugins();
              loadStats();
            }}
            variant="secondary"
            size="sm"
          >
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statsState.data && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{statsState.data.totalPlugins}</div>
            <div className="stat-label">Total Plugins</div>
          </div>

          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>
              {statsState.data.enabledPlugins}
            </div>
            <div className="stat-label">Enabled</div>
          </div>

          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-text-tertiary)' }}>
              {statsState.data.disabledPlugins}
            </div>
            <div className="stat-label">Disabled</div>
          </div>

          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
              {statsState.data.successRate.toFixed(1)}%
            </div>
            <div className="stat-label">Success Rate</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {(['all', 'enabled', 'disabled', 'error'] as const).map(filterOption => (
          <button
            key={filterOption}
            className={`filter-tab ${filter === filterOption ? 'active' : ''}`}
            onClick={() => setFilter(filterOption)}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            {filterOption === 'all' && ` (${pluginsState.data?.length || 0})`}
            {filterOption === 'enabled' && ` (${statsState.data?.enabledPlugins || 0})`}
            {filterOption === 'disabled' && ` (${statsState.data?.disabledPlugins || 0})`}
            {filterOption === 'error' && ` (${statsState.data?.unhealthyPlugins || 0})`}
          </button>
        ))}
      </div>

      {/* Plugin List */}
      <div className="plugin-list">
        {filteredPlugins.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔌</div>
            <h3>No plugins found</h3>
            <p>
              {filter === 'all'
                ? 'No plugins are currently installed.'
                : `No ${filter} plugins found.`}
            </p>
          </div>
        ) : (
          filteredPlugins.map(plugin => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              isSelected={selectedPlugin === plugin.id}
              onSelect={() => setSelectedPlugin(selectedPlugin === plugin.id ? null : plugin.id)}
              onToggle={handleTogglePlugin}
              onReload={handleReloadPlugin}
            />
          ))
        )}
      </div>

      <style>{`
        .plugin-dashboard {
          padding: var(--space-6);
          max-width: var(--max-width-container);
          margin: 0 auto;
          font-family: var(--font-family-base);
        }

        .plugin-dashboard-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: var(--space-4);
          color: var(--color-text-secondary);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-6);
        }

        .dashboard-title h2 {
          margin: 0 0 var(--space-1) 0;
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .last-updated {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .stat-card {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          text-align: center;
          box-shadow: var(--shadow-sm);
        }

        .stat-value {
          font-size: var(--text-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
        }

        .stat-label {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .filter-tabs {
          display: flex;
          gap: var(--space-2);
          margin-bottom: var(--space-6);
          border-bottom: 1px solid var(--color-border);
        }

        .filter-tab {
          background: none;
          border: none;
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
          min-height: var(--touch-target-min);
        }

        .filter-tab:hover {
          color: var(--color-text-primary);
          background: var(--color-muted);
        }

        .filter-tab.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        .plugin-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
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
          font-size: var(--text-lg);
          color: var(--color-text-primary);
        }

        .empty-state p {
          margin: 0;
          color: var(--color-text-secondary);
        }

        /* 移动端优化 */
        @media (max-width: 768px) {
          .plugin-dashboard {
            padding: var(--space-4);
          }

          .dashboard-header {
            flex-direction: column;
            gap: var(--space-4);
            align-items: stretch;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .filter-tabs {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .filter-tab {
            white-space: nowrap;
            flex-shrink: 0;
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

// Plugin Card 组件
interface PluginCardProps {
  plugin: PluginInfo;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: (pluginId: string, enable: boolean) => Promise<void>;
  onReload: (pluginId: string) => Promise<void>;
}

const PluginCard: React.FC<PluginCardProps> = ({
  plugin,
  isSelected,
  onSelect,
  onToggle,
  onReload,
}) => {
  const { colorScheme } = useTelegramTheme();
  const [isToggling, setIsToggling] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggle(plugin.id, !plugin.isEnabled);
    } finally {
      setIsToggling(false);
    }
  };

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await onReload(plugin.id);
    } finally {
      setIsReloading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'var(--color-success)';
      case 'degraded':
        return 'var(--color-warning)';
      case 'unhealthy':
        return 'var(--color-error)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={`plugin-card ${isSelected ? 'selected' : ''}`}>
      <div className="plugin-card-header" onClick={onSelect}>
        <div className="plugin-info">
          <div className="plugin-main">
            <h3 className="plugin-name">{plugin.name}</h3>
            <span className="plugin-version">v{plugin.version}</span>
            <div
              className="plugin-status"
              style={{ color: getStatusColor(plugin.lastHealthCheck?.status || 'unknown') }}
            >
              ● {plugin.isEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          <div className="plugin-meta">
            <span className="plugin-author">by {plugin.author}</span>
            <span className="plugin-updated">Updated {formatRelativeTime(plugin.lastUpdated)}</span>
          </div>
        </div>

        <div className="plugin-controls">
          <Button
            onClick={e => {
              e.stopPropagation();
              handleToggle();
            }}
            variant={plugin.isEnabled ? 'secondary' : 'primary'}
            size="sm"
            disabled={isToggling}
            className="toggle-btn"
          >
            {isToggling ? 'Updating...' : plugin.isEnabled ? 'Disable' : 'Enable'}
          </Button>

          {plugin.isEnabled && (
            <Button
              onClick={e => {
                e.stopPropagation();
                handleReload();
              }}
              variant="ghost"
              size="sm"
              disabled={isReloading}
              className="reload-btn"
            >
              {isReloading ? '🔄' : '🔄'}
            </Button>
          )}
        </div>
      </div>

      <div className="plugin-description">{plugin.description}</div>

      {isSelected && (
        <div className="plugin-details">
          {/* Health Status */}
          {plugin.lastHealthCheck && (
            <div className="detail-section">
              <h4>Health Status</h4>
              <div className="health-status">
                <div
                  className="health-indicator"
                  style={{ backgroundColor: getStatusColor(plugin.lastHealthCheck.status) }}
                />
                <div className="health-info">
                  <span className="health-status-text">
                    {plugin.lastHealthCheck.status.charAt(0).toUpperCase() +
                      plugin.lastHealthCheck.status.slice(1)}
                  </span>
                  {plugin.lastHealthCheck.message && (
                    <span className="health-message">{plugin.lastHealthCheck.message}</span>
                  )}
                  <span className="health-time">
                    Checked {formatRelativeTime(plugin.lastHealthCheck.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Execution Statistics */}
          {plugin.executionStats && (
            <div className="detail-section">
              <h4>Execution Statistics</h4>
              <div className="stats-grid-small">
                <div className="stat-item">
                  <span className="stat-number">{plugin.executionStats.totalExecutions}</span>
                  <span className="stat-label">Total Runs</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number" style={{ color: 'var(--color-success)' }}>
                    {plugin.executionStats.successfulExecutions}
                  </span>
                  <span className="stat-label">Successful</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number" style={{ color: 'var(--color-error)' }}>
                    {plugin.executionStats.failedExecutions}
                  </span>
                  <span className="stat-label">Failed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {plugin.executionStats.averageExecutionTime < 1000
                      ? `${plugin.executionStats.averageExecutionTime}ms`
                      : `${(plugin.executionStats.averageExecutionTime / 1000).toFixed(1)}s`}
                  </span>
                  <span className="stat-label">Avg Time</span>
                </div>
              </div>
              {plugin.executionStats.lastExecution && (
                <div className="last-execution">
                  Last execution: {formatRelativeTime(plugin.executionStats.lastExecution)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        .plugin-card {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .plugin-card:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--color-primary-light);
        }

        .plugin-card.selected {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-md);
        }

        .plugin-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-4);
          margin-bottom: var(--space-3);
        }

        .plugin-info {
          flex: 1;
          min-width: 0;
        }

        .plugin-main {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-1);
        }

        .plugin-name {
          margin: 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .plugin-version {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
          background: var(--color-muted);
          padding: 2px var(--space-1);
          border-radius: var(--radius-sm);
        }

        .plugin-status {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
        }

        .plugin-meta {
          display: flex;
          gap: var(--space-3);
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
        }

        .plugin-controls {
          display: flex;
          gap: var(--space-2);
          flex-shrink: 0;
        }

        .plugin-description {
          color: var(--color-text-secondary);
          font-size: var(--text-sm);
          line-height: var(--leading-normal);
          margin-bottom: var(--space-3);
        }

        .plugin-details {
          border-top: 1px solid var(--color-border);
          padding-top: var(--space-4);
          margin-top: var(--space-4);
        }

        .detail-section {
          margin-bottom: var(--space-4);
        }

        .detail-section h4 {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .health-status {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .health-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .health-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .health-status-text {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .health-message {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
        }

        .health-time {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
        }

        .stats-grid-small {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-3);
          margin-bottom: var(--space-2);
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: var(--text-base);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .stat-label {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
        }

        .last-execution {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
          text-align: center;
        }

        /* 移动端优化 */
        @media (max-width: 640px) {
          .plugin-card-header {
            flex-direction: column;
            gap: var(--space-3);
          }

          .plugin-controls {
            align-self: stretch;
          }

          .toggle-btn {
            flex: 1;
          }

          .stats-grid-small {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};
