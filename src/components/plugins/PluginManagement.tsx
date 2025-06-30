import React, { useState } from 'react';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';
import { Button } from '../ui/Button';
import { PluginDashboard } from './PluginDashboard';
import { PluginEventLog } from './PluginEventLog';
import { PluginSettings } from './PluginSettings';

// 插件管理主界面
interface PluginManagementProps {
  className?: string;
}

type ActiveTab = 'dashboard' | 'events' | 'settings';

export const PluginManagement: React.FC<PluginManagementProps> = ({ className = '' }) => {
  const { colorScheme } = useTelegramTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);

  const handleConfigChanged = (pluginId: string, config: Record<string, any>) => {
    console.log('Plugin config updated:', pluginId, config);
    // 这里可以触发重新加载或通知其他组件
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <PluginDashboard className="tab-content" />;

      case 'events':
        return <PluginEventLog className="tab-content" pluginId={selectedPlugin || undefined} />;

      case 'settings':
        if (!selectedPlugin) {
          return (
            <div className="no-plugin-selected">
              <div className="icon">⚙️</div>
              <h3>No Plugin Selected</h3>
              <p>Please select a plugin from the dashboard to configure its settings.</p>
              <Button onClick={() => setActiveTab('dashboard')} variant="primary">
                Go to Dashboard
              </Button>
            </div>
          );
        }

        return (
          <PluginSettings
            pluginId={selectedPlugin}
            className="tab-content"
            onConfigChanged={handleConfigChanged}
            onClose={() => {
              setSelectedPlugin(null);
              setActiveTab('dashboard');
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`plugin-management ${className}`}>
      {/* Navigation Tabs */}
      <div className="tab-navigation">
        <div className="tab-list">
          <button
            className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="tab-icon">📊</span>
            Dashboard
          </button>

          <button
            className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <span className="tab-icon">📝</span>
            Event Log
            {selectedPlugin && <span className="plugin-badge">{selectedPlugin}</span>}
          </button>

          <button
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            disabled={!selectedPlugin}
          >
            <span className="tab-icon">⚙️</span>
            Settings
            {selectedPlugin && <span className="plugin-badge">{selectedPlugin}</span>}
          </button>
        </div>

        {/* Plugin Selector for Events and Settings tabs */}
        {(activeTab === 'events' || activeTab === 'settings') && (
          <div className="plugin-selector">
            <select
              value={selectedPlugin || ''}
              onChange={e => {
                const value = e.target.value;
                setSelectedPlugin(value || null);
              }}
              className="plugin-select"
            >
              <option value="">All Plugins</option>
              <option value="vpn-plugin">VPN Manager</option>
              <option value="security-scanner">Security Scanner</option>
              <option value="backup-manager">Backup Manager</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="tab-content-wrapper">{renderTabContent()}</div>

      <style>{`
        .plugin-management {
          min-height: 100vh;
          font-family: var(--font-family-base);
        }

        .tab-navigation {
          background: var(--color-card-background);
          border-bottom: 1px solid var(--color-border);
          padding: var(--space-4) var(--space-6);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .tab-list {
          display: flex;
          gap: var(--space-1);
          margin-bottom: var(--space-4);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .tab-button {
          background: none;
          border: none;
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
          cursor: pointer;
          border-radius: var(--radius-lg);
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
          min-height: var(--touch-target-min);
          display: flex;
          align-items: center;
          gap: var(--space-2);
          position: relative;
        }

        .tab-button:hover:not(:disabled) {
          color: var(--color-text-primary);
          background: var(--color-muted);
        }

        .tab-button.active {
          color: var(--color-primary);
          background: var(--color-primary-light);
        }

        .tab-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tab-icon {
          font-size: 1rem;
        }

        .plugin-badge {
          font-size: var(--text-xs);
          background: var(--color-primary);
          color: white;
          padding: 2px var(--space-1);
          border-radius: var(--radius-sm);
          margin-left: var(--space-1);
        }

        .plugin-selector {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .plugin-select {
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          color: var(--color-text-primary);
          background: var(--color-background);
          min-width: 200px;
          min-height: var(--touch-target-min);
        }

        .plugin-select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-light);
        }

        .tab-content-wrapper {
          padding: var(--space-6);
          max-width: var(--max-width-container);
          margin: 0 auto;
        }

        .tab-content {
          min-height: 400px;
        }

        .no-plugin-selected {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-8);
        }

        .no-plugin-selected .icon {
          font-size: 4rem;
          margin-bottom: var(--space-4);
          opacity: 0.5;
        }

        .no-plugin-selected h3 {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-xl);
          color: var(--color-text-primary);
        }

        .no-plugin-selected p {
          margin: 0 0 var(--space-6) 0;
          color: var(--color-text-secondary);
          max-width: 300px;
          line-height: var(--leading-normal);
        }

        /* 移动端优化 */
        @media (max-width: 768px) {
          .tab-navigation {
            padding: var(--space-4);
          }

          .tab-content-wrapper {
            padding: var(--space-4);
          }

          .plugin-selector {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-2);
          }

          .plugin-select {
            min-width: auto;
            width: 100%;
          }

          .tab-list {
            margin-bottom: var(--space-3);
          }
        }

        @media (max-width: 480px) {
          .tab-button {
            padding: var(--space-2) var(--space-3);
            font-size: var(--text-xs);
          }

          .plugin-badge {
            display: none;
          }

          .no-plugin-selected {
            padding: var(--space-6);
          }

          .no-plugin-selected .icon {
            font-size: 3rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PluginManagement;
