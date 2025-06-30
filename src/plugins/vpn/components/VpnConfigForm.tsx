import React, { useState, useEffect } from 'react';
import type { VpnServerConfig } from '../VpnPlugin';
import { vpnPlugin } from '../VpnPlugin';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

interface VpnConfigFormProps {
  initialConfig?: any;
  onConfigChange?: (config: any) => void;
  onSave?: (config: any) => void;
  className?: string;
}

export const VpnConfigForm: React.FC<VpnConfigFormProps> = ({
  initialConfig = {},
  onConfigChange,
  onSave,
  className = '',
}) => {
  const [config, setConfig] = useState({
    vpnDuration: initialConfig.vpnDuration || 30,
    serverRegion: initialConfig.serverRegion || '',
    serverId: initialConfig.serverId || '',
    allowServerSelection: initialConfig.allowServerSelection || false,
    maxConnections: initialConfig.maxConnections || 5,
    protocols: initialConfig.protocols || ['openvpn'],
    features: initialConfig.features || {
      killSwitch: true,
      splitTunneling: false,
      dnsLeakProtection: true,
    },
    ...initialConfig,
  });

  const [servers, setServers] = useState<VpnServerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServers();
  }, []);

  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(config);
    }
  }, [config, onConfigChange]);

  const loadServers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!vpnPlugin.isInitialized) {
        await vpnPlugin.initialize();
      }

      const serverList = await vpnPlugin.getAvailableServers();
      setServers(serverList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateFeature = (featureName: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureName]: enabled,
      },
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(config);
    }
  };

  const groupedServers = servers.reduce(
    (groups, server) => {
      const region = server.country;
      if (!groups[region]) {
        groups[region] = [];
      }
      groups[region].push(server);
      return groups;
    },
    {} as Record<string, VpnServerConfig[]>
  );

  if (loading) {
    return (
      <div className="vpn-config-form__loading">
        <LoadingSpinner size="medium" />
        <p>Loading VPN configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vpn-config-form__error">
        <p>❌ {error}</p>
        <Button onClick={loadServers} variant="secondary" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`vpn-config-form ${className}`}>
      <Card className="vpn-config-form__card">
        <h3 className="vpn-config-form__title">VPN Service Configuration</h3>

        {/* Duration Settings */}
        <div className="vpn-config-form__section">
          <label className="vpn-config-form__label">Subscription Duration (days)</label>
          <div className="vpn-config-form__duration-options">
            {[7, 30, 90, 365].map(days => (
              <button
                key={days}
                onClick={() => updateConfig('vpnDuration', days)}
                className={`vpn-config-form__duration-btn ${
                  config.vpnDuration === days ? 'active' : ''
                }`}
              >
                {days} days
                {days === 365 && <span className="vpn-config-form__popular">Most Popular</span>}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={config.vpnDuration}
            onChange={e => updateConfig('vpnDuration', parseInt(e.target.value))}
            min="1"
            max="3650"
            className="vpn-config-form__duration-input"
            placeholder="Custom duration"
          />
        </div>

        {/* Server Selection */}
        <div className="vpn-config-form__section">
          <label className="vpn-config-form__label">Server Configuration</label>

          <div className="vpn-config-form__server-mode">
            <label className="vpn-config-form__checkbox">
              <input
                type="checkbox"
                checked={config.allowServerSelection}
                onChange={e => updateConfig('allowServerSelection', e.target.checked)}
              />
              Allow users to select specific server
            </label>
          </div>

          {!config.allowServerSelection && (
            <div className="vpn-config-form__region-selection">
              <label className="vpn-config-form__sublabel">Default Region:</label>
              <select
                value={config.serverRegion}
                onChange={e => updateConfig('serverRegion', e.target.value)}
                className="vpn-config-form__select"
              >
                <option value="">Auto-select optimal server</option>
                {Object.keys(groupedServers).map(region => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          )}

          {config.allowServerSelection && (
            <div className="vpn-config-form__server-list">
              <label className="vpn-config-form__sublabel">Default Server:</label>
              <select
                value={config.serverId}
                onChange={e => updateConfig('serverId', e.target.value)}
                className="vpn-config-form__select"
              >
                <option value="">Let user choose</option>
                {Object.entries(groupedServers).map(([region, regionServers]) => (
                  <optgroup key={region} label={region}>
                    {regionServers.map(server => (
                      <option key={server.id} value={server.id}>
                        {server.name} - {server.location} (Load: {server.load}%)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Protocol Selection */}
        <div className="vpn-config-form__section">
          <label className="vpn-config-form__label">Supported Protocols</label>
          <div className="vpn-config-form__protocols">
            {['openvpn', 'wireguard', 'ipsec'].map(protocol => (
              <label key={protocol} className="vpn-config-form__checkbox">
                <input
                  type="checkbox"
                  checked={config.protocols.includes(protocol)}
                  onChange={e => {
                    const protocols = e.target.checked
                      ? [...config.protocols, protocol]
                      : config.protocols.filter((p: string) => p !== protocol);
                    updateConfig('protocols', protocols);
                  }}
                />
                {protocol.toUpperCase()}
              </label>
            ))}
          </div>
        </div>

        {/* Connection Settings */}
        <div className="vpn-config-form__section">
          <label className="vpn-config-form__label">Maximum Simultaneous Connections</label>
          <input
            type="number"
            value={config.maxConnections}
            onChange={e => updateConfig('maxConnections', parseInt(e.target.value))}
            min="1"
            max="10"
            className="vpn-config-form__input"
          />
        </div>

        {/* Features */}
        <div className="vpn-config-form__section">
          <label className="vpn-config-form__label">VPN Features</label>
          <div className="vpn-config-form__features">
            {[
              {
                key: 'killSwitch',
                name: 'Kill Switch',
                description: 'Blocks internet if VPN disconnects',
              },
              {
                key: 'splitTunneling',
                name: 'Split Tunneling',
                description: 'Route only specific traffic through VPN',
              },
              {
                key: 'dnsLeakProtection',
                name: 'DNS Leak Protection',
                description: 'Prevent DNS queries from leaking',
              },
              {
                key: 'autoConnect',
                name: 'Auto Connect',
                description: 'Automatically connect on startup',
              },
            ].map(feature => (
              <label key={feature.key} className="vpn-config-form__feature">
                <input
                  type="checkbox"
                  checked={config.features[feature.key] || false}
                  onChange={e => updateFeature(feature.key, e.target.checked)}
                />
                <div className="vpn-config-form__feature-info">
                  <span className="vpn-config-form__feature-name">{feature.name}</span>
                  <span className="vpn-config-form__feature-desc">{feature.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Server Status Display */}
        <div className="vpn-config-form__section">
          <label className="vpn-config-form__label">Server Status Overview</label>
          <div className="vpn-config-form__servers">
            {servers.map(server => (
              <div key={server.id} className="vpn-config-form__server">
                <div className="vpn-config-form__server-header">
                  <span className="vpn-config-form__server-name">{server.name}</span>
                  <span
                    className={`vpn-config-form__server-status ${
                      server.isActive ? 'online' : 'offline'
                    }`}
                  >
                    {server.isActive ? '🟢 Online' : '🔴 Offline'}
                  </span>
                </div>
                <div className="vpn-config-form__server-details">
                  <span>
                    📍 {server.location}, {server.country}
                  </span>
                  <span>
                    👥 {server.currentUsers}/{server.maxUsers} users
                  </span>
                  <span>📊 {server.load}% load</span>
                  <span>🔗 {server.protocol.toUpperCase()}</span>
                </div>
                <div className="vpn-config-form__server-load">
                  <div className="vpn-config-form__load-bar" style={{ width: `${server.load}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="vpn-config-form__actions">
          <Button onClick={handleSave} variant="primary" size="md">
            Save Configuration
          </Button>
        </div>
      </Card>

      <style>{`
        .vpn-config-form {
          max-width: 800px;
          margin: 0 auto;
        }

        .vpn-config-form__loading,
        .vpn-config-form__error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
          gap: 1rem;
        }

        .vpn-config-form__card {
          padding: 2rem;
        }

        .vpn-config-form__title {
          margin: 0 0 2rem 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--tg-theme-text-color, #000);
        }

        .vpn-config-form__section {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--tg-theme-secondary-bg-color, #f0f0f0);
        }

        .vpn-config-form__section:last-child {
          border-bottom: none;
        }

        .vpn-config-form__label {
          display: block;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--tg-theme-text-color, #000);
        }

        .vpn-config-form__sublabel {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: var(--tg-theme-hint-color, #666);
          font-size: 0.9rem;
        }

        .vpn-config-form__duration-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .vpn-config-form__duration-btn {
          position: relative;
          padding: 0.75rem 1rem;
          border: 2px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
          border-radius: 8px;
          background: var(--tg-theme-bg-color, #fff);
          color: var(--tg-theme-text-color, #000);
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .vpn-config-form__duration-btn:hover {
          border-color: var(--tg-theme-button-color, #007AFF);
        }

        .vpn-config-form__duration-btn.active {
          border-color: var(--tg-theme-button-color, #007AFF);
          background: var(--tg-theme-button-color, #007AFF);
          color: var(--tg-theme-button-text-color, #fff);
        }

        .vpn-config-form__popular {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ff6b35;
          color: white;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
        }

        .vpn-config-form__duration-input,
        .vpn-config-form__input,
        .vpn-config-form__select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
          border-radius: 8px;
          background: var(--tg-theme-bg-color, #fff);
          color: var(--tg-theme-text-color, #000);
          font-size: 1rem;
        }

        .vpn-config-form__duration-input {
          margin-top: 0.5rem;
        }

        .vpn-config-form__checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          cursor: pointer;
        }

        .vpn-config-form__protocols {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .vpn-config-form__feature {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          border: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
          border-radius: 8px;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .vpn-config-form__feature:hover {
          background: var(--tg-theme-secondary-bg-color, #f8f9fa);
        }

        .vpn-config-form__feature-info {
          flex: 1;
        }

        .vpn-config-form__feature-name {
          display: block;
          font-weight: 600;
          color: var(--tg-theme-text-color, #000);
          margin-bottom: 0.25rem;
        }

        .vpn-config-form__feature-desc {
          display: block;
          font-size: 0.9rem;
          color: var(--tg-theme-hint-color, #666);
        }

        .vpn-config-form__servers {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .vpn-config-form__server {
          border: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
          border-radius: 8px;
          padding: 1rem;
        }

        .vpn-config-form__server-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .vpn-config-form__server-name {
          font-weight: 600;
          color: var(--tg-theme-text-color, #000);
        }

        .vpn-config-form__server-status.online {
          color: #38a169;
        }

        .vpn-config-form__server-status.offline {
          color: #e53e3e;
        }

        .vpn-config-form__server-details {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.9rem;
          color: var(--tg-theme-hint-color, #666);
          margin-bottom: 0.75rem;
        }

        .vpn-config-form__server-load {
          width: 100%;
          height: 4px;
          background: var(--tg-theme-secondary-bg-color, #e0e0e0);
          border-radius: 2px;
          overflow: hidden;
        }

        .vpn-config-form__load-bar {
          height: 100%;
          background: linear-gradient(90deg, #38a169 0%, #ed8936 70%, #e53e3e 100%);
          transition: width 0.3s ease;
        }

        .vpn-config-form__actions {
          margin-top: 2rem;
          display: flex;
          justify-content: flex-end;
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .vpn-config-form__card {
            padding: 1rem;
          }

          .vpn-config-form__duration-options {
            grid-template-columns: 1fr 1fr;
          }

          .vpn-config-form__protocols {
            flex-direction: column;
          }

          .vpn-config-form__server-details {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};
