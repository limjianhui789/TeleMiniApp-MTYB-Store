import React, { useState, useEffect, useCallback } from 'react';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';
import { useAsyncState } from '../../hooks/useAsyncState';
import { LoadingSpinner, ErrorMessage } from '../common';
import { Button } from '../ui/Button';

// 插件事件日志类型
interface PluginEvent {
  id: string;
  pluginId: string;
  pluginName: string;
  type: 'execution' | 'error' | 'health_check' | 'config_change' | 'status_change';
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  duration?: number;
  userId?: string;
  orderId?: string;
}

interface PluginEventLogProps {
  className?: string;
  pluginId?: string; // 如果指定，则只显示该插件的事件
  maxEvents?: number;
}

export const PluginEventLog: React.FC<PluginEventLogProps> = ({
  className = '',
  pluginId,
  maxEvents = 100,
}) => {
  const { colorScheme } = useTelegramTheme();
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  // 模拟事件日志API调用
  const fetchEvents = useCallback(async (): Promise<PluginEvent[]> => {
    // 这里应该调用实际的事件日志API
    // 例如: return eventLogger.getEvents({ pluginId, limit: maxEvents });

    // 模拟数据用于演示
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockEvents: PluginEvent[] = [
      {
        id: 'event-001',
        pluginId: 'vpn-plugin',
        pluginName: 'VPN Manager',
        type: 'execution',
        level: 'success',
        message: 'Successfully processed VPN account creation',
        details: {
          orderId: 'order-123',
          accountId: 'vpn-acc-456',
          region: 'us-east',
          duration: 30,
        },
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        duration: 1200,
        userId: 'user-789',
        orderId: 'order-123',
      },
      {
        id: 'event-002',
        pluginId: 'security-scanner',
        pluginName: 'Security Scanner',
        type: 'health_check',
        level: 'warning',
        message: 'API rate limit approaching',
        details: {
          currentRate: 95,
          maxRate: 100,
          resetTime: new Date(Date.now() + 10 * 60 * 1000),
        },
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        duration: 500,
      },
      {
        id: 'event-003',
        pluginId: 'vpn-plugin',
        pluginName: 'VPN Manager',
        type: 'error',
        level: 'error',
        message: 'Failed to connect to VPN API',
        details: {
          error: 'Connection timeout',
          endpoint: 'https://api.vpnservice.com/accounts',
          retryAttempt: 3,
        },
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        duration: 30000,
        orderId: 'order-124',
      },
      {
        id: 'event-004',
        pluginId: 'backup-manager',
        pluginName: 'Backup Manager',
        type: 'status_change',
        level: 'info',
        message: 'Plugin disabled by administrator',
        details: {
          previousStatus: 'enabled',
          newStatus: 'disabled',
          reason: 'Maintenance',
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: 'event-005',
        pluginId: 'security-scanner',
        pluginName: 'Security Scanner',
        type: 'config_change',
        level: 'info',
        message: 'Configuration updated',
        details: {
          changedFields: ['scanInterval', 'alertThreshold'],
          updatedBy: 'admin',
        },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
    ];

    // 过滤特定插件的事件
    return pluginId ? mockEvents.filter(event => event.pluginId === pluginId) : mockEvents;
  }, [pluginId, maxEvents]);

  const [eventsState, { execute: loadEvents }] = useAsyncState(fetchEvents);

  useEffect(() => {
    loadEvents();

    // 设置定期刷新
    const interval = setInterval(() => {
      loadEvents();
    }, 30000); // 每30秒刷新一次

    return () => clearInterval(interval);
  }, [loadEvents]);

  const filteredEvents =
    eventsState.data?.filter(event => {
      if (filter === 'all') return true;
      return event.level === filter;
    }) || [];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'var(--color-success)';
      case 'warning':
        return 'var(--color-warning)';
      case 'error':
        return 'var(--color-error)';
      case 'info':
        return 'var(--color-info)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'execution':
        return '⚡';
      case 'error':
        return '❌';
      case 'health_check':
        return '🏥';
      case 'config_change':
        return '⚙️';
      case 'status_change':
        return '🔄';
      default:
        return '📝';
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

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (eventsState.loading) {
    return (
      <div className="plugin-event-log-loading">
        <LoadingSpinner size="large" />
        <p>Loading event log...</p>
      </div>
    );
  }

  if (eventsState.error) {
    return (
      <ErrorMessage
        title="Failed to load event log"
        message={eventsState.error?.message || 'Unknown error'}
        actions={[
          {
            label: 'Retry',
            onClick: () => loadEvents(),
            variant: 'primary',
          },
        ]}
      />
    );
  }

  return (
    <div className={`plugin-event-log ${className}`}>
      {/* Header */}
      <div className="event-log-header">
        <div className="header-title">
          <h3>Plugin Event Log</h3>
          <span className="event-count">{filteredEvents.length} events</span>
        </div>

        <div className="header-actions">
          <Button onClick={() => loadEvents()} variant="secondary" size="sm">
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {(['all', 'success', 'info', 'warning', 'error'] as const).map(filterOption => (
          <button
            key={filterOption}
            className={`filter-tab ${filter === filterOption ? 'active' : ''}`}
            onClick={() => setFilter(filterOption)}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            <span className="filter-count">
              (
              {filterOption === 'all'
                ? eventsState.data?.length || 0
                : eventsState.data?.filter(e => e.level === filterOption).length || 0}
              )
            </span>
          </button>
        ))}
      </div>

      {/* Event List */}
      <div className="event-list">
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h4>No events found</h4>
            <p>
              {filter === 'all' ? 'No events have been logged yet.' : `No ${filter} events found.`}
            </p>
          </div>
        ) : (
          filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isSelected={selectedEvent === event.id}
              onSelect={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
            />
          ))
        )}
      </div>

      <style>{`
        .plugin-event-log {
          font-family: var(--font-family-base);
        }

        .plugin-event-log-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          gap: var(--space-4);
          color: var(--color-text-secondary);
        }

        .event-log-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-6);
        }

        .header-title h3 {
          margin: 0 0 var(--space-1) 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .event-count {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .filter-tabs {
          display: flex;
          gap: var(--space-2);
          margin-bottom: var(--space-6);
          border-bottom: 1px solid var(--color-border);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
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
          white-space: nowrap;
          flex-shrink: 0;
          min-height: var(--touch-target-min);
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .filter-tab:hover {
          color: var(--color-text-primary);
          background: var(--color-muted);
        }

        .filter-tab.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        .filter-count {
          font-size: var(--text-xs);
          opacity: 0.7;
        }

        .event-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
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
          font-size: 3rem;
          margin-bottom: var(--space-4);
          opacity: 0.5;
        }

        .empty-state h4 {
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
          .event-log-header {
            flex-direction: column;
            gap: var(--space-4);
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

// Event Card 组件
interface EventCardProps {
  event: PluginEvent;
  isSelected: boolean;
  onSelect: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, isSelected, onSelect }) => {
  const { colorScheme } = useTelegramTheme();

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'var(--color-success)';
      case 'warning':
        return 'var(--color-warning)';
      case 'error':
        return 'var(--color-error)';
      case 'info':
        return 'var(--color-info)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'execution':
        return '⚡';
      case 'error':
        return '❌';
      case 'health_check':
        return '🏥';
      case 'config_change':
        return '⚙️';
      case 'status_change':
        return '🔄';
      default:
        return '📝';
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

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className={`event-card ${isSelected ? 'selected' : ''}`}>
      <div className="event-card-header" onClick={onSelect}>
        <div className="event-icon">{getTypeIcon(event.type)}</div>

        <div className="event-info">
          <div className="event-main">
            <span className="event-plugin">{event.pluginName}</span>
            <div className="event-level" style={{ color: getLevelColor(event.level) }}>
              ● {event.level.toUpperCase()}
            </div>
            <span className="event-time">{formatRelativeTime(event.timestamp)}</span>
          </div>

          <div className="event-message">{event.message}</div>

          <div className="event-meta">
            <span className="event-type">{event.type.replace('_', ' ')}</span>
            {event.duration && (
              <span className="event-duration">Duration: {formatDuration(event.duration)}</span>
            )}
            {event.orderId && <span className="event-order">Order: {event.orderId}</span>}
          </div>
        </div>
      </div>

      {isSelected && event.details && (
        <div className="event-details">
          <h5>Event Details</h5>
          <div className="details-content">
            <pre>{JSON.stringify(event.details, null, 2)}</pre>
          </div>
        </div>
      )}

      <style>{`
        .event-card {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .event-card:hover {
          box-shadow: var(--shadow-sm);
          border-color: var(--color-primary-light);
        }

        .event-card.selected {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-md);
        }

        .event-card-header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-4);
        }

        .event-icon {
          font-size: 1.2rem;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-muted);
          border-radius: var(--radius-md);
          flex-shrink: 0;
        }

        .event-info {
          flex: 1;
          min-width: 0;
        }

        .event-main {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-2);
          flex-wrap: wrap;
        }

        .event-plugin {
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          font-size: var(--text-sm);
        }

        .event-level {
          font-size: var(--text-xs);
          font-weight: var(--font-weight-bold);
        }

        .event-time {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
          margin-left: auto;
        }

        .event-message {
          color: var(--color-text-primary);
          font-size: var(--text-sm);
          line-height: var(--leading-normal);
          margin-bottom: var(--space-2);
        }

        .event-meta {
          display: flex;
          gap: var(--space-3);
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          flex-wrap: wrap;
        }

        .event-type {
          text-transform: capitalize;
        }

        .event-details {
          border-top: 1px solid var(--color-border);
          padding: var(--space-4);
        }

        .event-details h5 {
          margin: 0 0 var(--space-3) 0;
          font-size: var(--text-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .details-content {
          background: var(--color-muted);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          overflow-x: auto;
        }

        .details-content pre {
          margin: 0;
          font-size: var(--text-xs);
          font-family: var(--font-family-mono);
          color: var(--color-text-secondary);
          white-space: pre-wrap;
          word-break: break-all;
        }

        /* 移动端优化 */
        @media (max-width: 640px) {
          .event-main {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-1);
          }

          .event-time {
            margin-left: 0;
          }

          .event-meta {
            flex-direction: column;
            gap: var(--space-1);
          }
        }
      `}</style>
    </div>
  );
};
