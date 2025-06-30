// ============================================================================
// MTYB Plugin SDK - Sample Plugin Example
// ============================================================================

import {
  Plugin,
  PluginContext,
  PluginAPI,
  PluginEvent,
  PluginPermission,
  PluginFeature,
} from '../sdk';

/**
 * Sample VPN Management Plugin
 *
 * This plugin demonstrates how to create a full-featured plugin using the MTYB SDK.
 * It includes:
 * - User interface interactions
 * - Data storage and retrieval
 * - Network API calls
 * - Event handling
 * - Configuration management
 * - Analytics tracking
 */
export class SampleVPNPlugin extends Plugin {
  private isActive: boolean = false;
  private servers: VPNServer[] = [];
  private currentConnection: VPNConnection | null = null;
  private ui: VPNPluginUI | null = null;

  // Required permissions for this plugin
  static readonly REQUIRED_PERMISSIONS: PluginPermission[] = [
    'storage.read',
    'storage.write',
    'network.http',
    'ui.toast',
    'ui.modal',
    'ui.notifications',
    'crypto.encrypt',
    'crypto.hash',
  ];

  // Optional features this plugin can use
  static readonly OPTIONAL_FEATURES: PluginFeature[] = ['analytics', 'authentication'];

  constructor(context: PluginContext, api: PluginAPI) {
    super(context, api);
  }

  // Plugin Lifecycle Methods

  async onInstall(): Promise<void> {
    console.log('🔒 VPN Plugin: Installing...');

    // Initialize default configuration
    const defaultConfig: VPNPluginConfig = {
      autoConnect: false,
      preferredRegion: 'us-east',
      encryptionLevel: 'high',
      killSwitch: true,
      dnsLeakProtection: true,
      notifications: true,
      theme: this.context.config.theme,
    };

    await this.api.storage.set('config', defaultConfig);
    await this.api.storage.set('installed', true);
    await this.api.storage.set('installDate', new Date().toISOString());

    // Track installation
    this.api.analytics.track('vpn_plugin.installed', {
      version: this.context.version,
      installDate: new Date().toISOString(),
    });

    this.api.ui.showToast('VPN Plugin installed successfully!', 'success');
    console.log('✅ VPN Plugin: Installation complete');
  }

  async onActivate(): Promise<void> {
    console.log('🔒 VPN Plugin: Activating...');

    this.isActive = true;

    // Load configuration
    const config = await this.loadConfig();

    // Initialize UI
    this.ui = new VPNPluginUI(this.api);
    await this.ui.initialize();

    // Load server list
    await this.loadServerList();

    // Auto-connect if enabled
    if (config.autoConnect) {
      await this.autoConnect();
    }

    // Track activation
    this.api.analytics.track('vpn_plugin.activated', {
      version: this.context.version,
      autoConnect: config.autoConnect,
    });

    this.api.ui.showToast('VPN Plugin activated!', 'success');
    console.log('✅ VPN Plugin: Activation complete');
  }

  async onDeactivate(): Promise<void> {
    console.log('🔒 VPN Plugin: Deactivating...');

    this.isActive = false;

    // Disconnect if connected
    if (this.currentConnection) {
      await this.disconnect();
    }

    // Cleanup UI
    if (this.ui) {
      this.ui.destroy();
      this.ui = null;
    }

    // Track deactivation
    this.api.analytics.track('vpn_plugin.deactivated', {
      version: this.context.version,
    });

    console.log('✅ VPN Plugin: Deactivation complete');
  }

  async onUninstall(): Promise<void> {
    console.log('🔒 VPN Plugin: Uninstalling...');

    // Disconnect and cleanup
    if (this.currentConnection) {
      await this.disconnect();
    }

    // Clear all stored data
    await this.api.storage.clear();

    // Track uninstallation
    this.api.analytics.track('vpn_plugin.uninstalled', {
      version: this.context.version,
    });

    this.api.ui.showToast('VPN Plugin uninstalled', 'info');
    console.log('✅ VPN Plugin: Uninstallation complete');
  }

  async onUpdate(oldVersion: string, newVersion: string): Promise<void> {
    console.log(`🔒 VPN Plugin: Updating from ${oldVersion} to ${newVersion}`);

    // Handle data migrations
    if (oldVersion < '2.0.0' && newVersion >= '2.0.0') {
      await this.migrateToV2();
    }

    // Track update
    this.api.analytics.track('vpn_plugin.updated', {
      oldVersion,
      newVersion,
    });

    this.api.ui.showToast(`VPN Plugin updated to v${newVersion}!`, 'success');
    console.log('✅ VPN Plugin: Update complete');
  }

  async onConfigure?(config: VPNPluginConfig): Promise<void> {
    console.log('🔒 VPN Plugin: Configuring...');

    // Save new configuration
    await this.api.storage.set('config', config);

    // Apply configuration changes
    if (this.ui) {
      this.ui.updateTheme(config.theme);
    }

    // Track configuration change
    this.api.analytics.track('vpn_plugin.configured', {
      config: Object.keys(config),
    });

    this.api.ui.showToast('Configuration updated!', 'success');
  }

  async onEvent(event: PluginEvent): Promise<void> {
    console.log('🔒 VPN Plugin: Received event:', event.type);

    switch (event.type) {
      case 'network.online':
        await this.handleNetworkOnline();
        break;
      case 'network.offline':
        await this.handleNetworkOffline();
        break;
      case 'ui.theme.changed':
        await this.handleThemeChanged(event.data.theme);
        break;
      case 'system.resume':
        await this.handleSystemResume();
        break;
      case 'system.pause':
        await this.handleSystemPause();
        break;
    }
  }

  // Main Plugin Logic

  async run(): Promise<void> {
    console.log('🔒 VPN Plugin: Running...');

    if (!this.isActive) {
      await this.onActivate();
    }

    // Show main interface
    if (this.ui) {
      this.ui.show();
    }

    // Track plugin run
    this.api.analytics.track('vpn_plugin.run', {
      version: this.context.version,
      timestamp: Date.now(),
    });
  }

  // VPN-specific Methods

  private async loadConfig(): Promise<VPNPluginConfig> {
    const config = await this.api.storage.get('config');
    if (!config) {
      // Return default config if none exists
      const defaultConfig: VPNPluginConfig = {
        autoConnect: false,
        preferredRegion: 'us-east',
        encryptionLevel: 'high',
        killSwitch: true,
        dnsLeakProtection: true,
        notifications: true,
        theme: this.context.config.theme,
      };
      await this.api.storage.set('config', defaultConfig);
      return defaultConfig;
    }
    return config;
  }

  private async loadServerList(): Promise<void> {
    try {
      // Check cache first
      const cachedServers = await this.api.storage.get('servers');
      const lastUpdate = await this.api.storage.get('serversLastUpdate');

      const now = Date.now();
      const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

      if (cachedServers && lastUpdate && now - lastUpdate < cacheExpiry) {
        this.servers = cachedServers;
        return;
      }

      // Fetch fresh server list
      const response = await this.api.network.http.get('/api/vpn/servers');

      if (response.ok) {
        const data = await response.json();
        this.servers = data.servers;

        // Cache the results
        await this.api.storage.set('servers', this.servers);
        await this.api.storage.set('serversLastUpdate', now);
      } else {
        // Use cached data if available
        if (cachedServers) {
          this.servers = cachedServers;
        }
        throw new Error(`Failed to load servers: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to load server list:', error);
      this.api.ui.showToast('Failed to load server list', 'error');
    }
  }

  private async autoConnect(): Promise<void> {
    const config = await this.loadConfig();
    const preferredServer = this.servers.find(s => s.region === config.preferredRegion);

    if (preferredServer) {
      await this.connect(preferredServer);
    }
  }

  async connect(server: VPNServer): Promise<void> {
    try {
      if (this.currentConnection) {
        await this.disconnect();
      }

      this.api.ui.showToast('Connecting to VPN...', 'info');

      // Simulate connection process
      const response = await this.api.network.http.post('/api/vpn/connect', {
        serverId: server.id,
        encryption: (await this.loadConfig()).encryptionLevel,
      });

      if (response.ok) {
        const connectionData = await response.json();

        this.currentConnection = {
          server,
          connectedAt: new Date(),
          sessionId: connectionData.sessionId,
        };

        // Store connection info
        await this.api.storage.set('currentConnection', this.currentConnection);

        // Show notification if enabled
        const config = await this.loadConfig();
        if (config.notifications) {
          await this.api.ui.showNotification({
            title: 'VPN Connected',
            body: `Connected to ${server.name} (${server.country})`,
            icon: '🔒',
          });
        }

        this.api.ui.showToast(`Connected to ${server.name}!`, 'success');

        // Track connection
        this.api.analytics.track('vpn_plugin.connected', {
          serverId: server.id,
          serverName: server.name,
          country: server.country,
          region: server.region,
        });
      } else {
        throw new Error(`Connection failed: ${response.status}`);
      }
    } catch (error) {
      console.error('VPN connection failed:', error);
      this.api.ui.showToast('VPN connection failed', 'error');

      // Track connection failure
      this.api.analytics.track('vpn_plugin.connection_failed', {
        serverId: server.id,
        error: error.message,
      });
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (!this.currentConnection) {
        return;
      }

      this.api.ui.showToast('Disconnecting VPN...', 'info');

      const response = await this.api.network.http.post('/api/vpn/disconnect', {
        sessionId: this.currentConnection.sessionId,
      });

      if (response.ok) {
        // Track disconnection
        this.api.analytics.track('vpn_plugin.disconnected', {
          serverId: this.currentConnection.server.id,
          duration: Date.now() - this.currentConnection.connectedAt.getTime(),
        });

        this.currentConnection = null;
        await this.api.storage.remove('currentConnection');

        this.api.ui.showToast('VPN disconnected', 'info');
      } else {
        throw new Error(`Disconnection failed: ${response.status}`);
      }
    } catch (error) {
      console.error('VPN disconnection failed:', error);
      this.api.ui.showToast('VPN disconnection failed', 'error');
    }
  }

  // Event Handlers

  private async handleNetworkOnline(): Promise<void> {
    console.log('Network is back online');

    // Attempt to reconnect if we were connected before
    const lastConnection = await this.api.storage.get('currentConnection');
    if (lastConnection && !this.currentConnection) {
      const server = this.servers.find(s => s.id === lastConnection.server.id);
      if (server) {
        await this.connect(server);
      }
    }
  }

  private async handleNetworkOffline(): Promise<void> {
    console.log('Network went offline');

    // Show notification about network loss
    this.api.ui.showToast('Network connection lost', 'warning');
  }

  private async handleThemeChanged(theme: 'light' | 'dark'): Promise<void> {
    if (this.ui) {
      this.ui.updateTheme(theme);
    }

    // Update stored config
    const config = await this.loadConfig();
    config.theme = theme;
    await this.api.storage.set('config', config);
  }

  private async handleSystemResume(): Promise<void> {
    console.log('System resumed');

    // Check connection status and reconnect if needed
    if (this.currentConnection) {
      // Verify connection is still active
      try {
        const response = await this.api.network.http.get('/api/vpn/status');
        if (!response.ok || !(await response.json()).connected) {
          // Reconnect
          await this.connect(this.currentConnection.server);
        }
      } catch (error) {
        console.error('Failed to check VPN status:', error);
      }
    }
  }

  private async handleSystemPause(): Promise<void> {
    console.log('System paused');
    // Can implement pause-specific logic here
  }

  // Data Migration

  private async migrateToV2(): Promise<void> {
    console.log('Migrating data to v2.0.0');

    // Example migration: move old config format to new format
    const oldConfig = await this.api.storage.get('vpnConfig');
    if (oldConfig) {
      const newConfig: VPNPluginConfig = {
        autoConnect: oldConfig.autoConnect || false,
        preferredRegion: oldConfig.region || 'us-east',
        encryptionLevel: oldConfig.encryption || 'high',
        killSwitch: true,
        dnsLeakProtection: true,
        notifications: true,
        theme: this.context.config.theme,
      };

      await this.api.storage.set('config', newConfig);
      await this.api.storage.remove('vpnConfig');
    }
  }
}

// Supporting Classes

class VPNPluginUI {
  private api: PluginAPI;
  private container: HTMLElement | null = null;

  constructor(api: PluginAPI) {
    this.api = api;
  }

  async initialize(): Promise<void> {
    // Create UI container
    this.container = document.createElement('div');
    this.container.className = 'vpn-plugin-ui';
    this.container.innerHTML = this.getUITemplate();

    // Add styles
    this.addStyles();

    // Add event listeners
    this.addEventListeners();
  }

  show(): void {
    if (this.container && !document.body.contains(this.container)) {
      document.body.appendChild(this.container);
    }
  }

  hide(): void {
    if (this.container && document.body.contains(this.container)) {
      document.body.removeChild(this.container);
    }
  }

  destroy(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  updateTheme(theme: 'light' | 'dark'): void {
    if (this.container) {
      this.container.setAttribute('data-theme', theme);
    }
  }

  private getUITemplate(): string {
    return `
      <div class="vpn-widget">
        <div class="vpn-header">
          <h3>🔒 VPN Manager</h3>
          <button class="vpn-close">×</button>
        </div>
        <div class="vpn-content">
          <div class="vpn-status">
            <div class="status-indicator disconnected"></div>
            <span class="status-text">Disconnected</span>
          </div>
          <div class="vpn-actions">
            <button class="vpn-connect">Connect</button>
            <button class="vpn-disconnect" disabled>Disconnect</button>
          </div>
          <div class="vpn-servers">
            <label>Select Server:</label>
            <select class="server-select">
              <option value="">Loading servers...</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .vpn-plugin-ui {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        font-family: system-ui, sans-serif;
      }
      
      .vpn-widget {
        background: var(--color-card-background, #fff);
        border: 1px solid var(--color-border, #ddd);
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        width: 300px;
        overflow: hidden;
      }
      
      .vpn-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: var(--color-primary, #007bff);
        color: white;
      }
      
      .vpn-header h3 {
        margin: 0;
        font-size: 16px;
      }
      
      .vpn-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
      }
      
      .vpn-content {
        padding: 16px;
      }
      
      .vpn-status {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }
      
      .status-indicator.connected {
        background: #28a745;
        box-shadow: 0 0 8px rgba(40, 167, 69, 0.5);
      }
      
      .status-indicator.disconnected {
        background: #dc3545;
      }
      
      .vpn-actions {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .vpn-connect,
      .vpn-disconnect {
        flex: 1;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .vpn-connect {
        background: #28a745;
        color: white;
      }
      
      .vpn-connect:hover {
        background: #218838;
      }
      
      .vpn-disconnect {
        background: #dc3545;
        color: white;
      }
      
      .vpn-disconnect:hover:not(:disabled) {
        background: #c82333;
      }
      
      .vpn-disconnect:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
      
      .vpn-servers label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--color-text-primary, #333);
      }
      
      .server-select {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--color-border, #ddd);
        border-radius: 4px;
        background: var(--color-background, #fff);
        color: var(--color-text-primary, #333);
      }
      
      .vpn-plugin-ui[data-theme="dark"] .vpn-widget {
        background: #2d3748;
        border-color: #4a5568;
        color: #e2e8f0;
      }
      
      .vpn-plugin-ui[data-theme="dark"] .server-select {
        background: #4a5568;
        border-color: #718096;
        color: #e2e8f0;
      }
    `;
    document.head.appendChild(style);
  }

  private addEventListeners(): void {
    if (!this.container) return;

    const closeBtn = this.container.querySelector('.vpn-close');
    const connectBtn = this.container.querySelector('.vpn-connect');
    const disconnectBtn = this.container.querySelector('.vpn-disconnect');

    closeBtn?.addEventListener('click', () => this.hide());

    connectBtn?.addEventListener('click', () => {
      this.api.ui.showToast('Connection logic would be triggered here', 'info');
    });

    disconnectBtn?.addEventListener('click', () => {
      this.api.ui.showToast('Disconnection logic would be triggered here', 'info');
    });
  }
}

// Type Definitions

interface VPNPluginConfig {
  autoConnect: boolean;
  preferredRegion: string;
  encryptionLevel: 'low' | 'medium' | 'high';
  killSwitch: boolean;
  dnsLeakProtection: boolean;
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
}

interface VPNServer {
  id: string;
  name: string;
  country: string;
  region: string;
  city: string;
  load: number;
  ping: number;
  premium: boolean;
}

interface VPNConnection {
  server: VPNServer;
  connectedAt: Date;
  sessionId: string;
}

// Export the plugin class
export default SampleVPNPlugin;
