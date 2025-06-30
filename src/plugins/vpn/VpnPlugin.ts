// ============================================================================
// MTYB Virtual Goods Platform - VPN Service Plugin
// ============================================================================

import { BasePlugin } from '../../core/plugin/BasePlugin';
import type {
  PluginContext,
  DeliveryResult,
  ValidationResult,
  PluginHealthStatus,
  Order,
  Product,
} from '../../types';
import { Logger } from '../../core/utils/Logger';

// ============================================================================
// VPN Plugin Types
// ============================================================================

export interface VpnServerConfig {
  id: string;
  name: string;
  location: string;
  country: string;
  serverAddress: string;
  port: number;
  protocol: 'openvpn' | 'wireguard' | 'ipsec';
  maxUsers: number;
  currentUsers: number;
  isActive: boolean;
  load: number; // 0-100 percentage
  features: VpnFeature[];
}

export interface VpnFeature {
  name: string;
  enabled: boolean;
  description?: string;
}

export interface VpnAccount {
  id: string;
  username: string;
  password: string;
  serverId: string;
  expiresAt: Date;
  createdAt: Date;
  isActive: boolean;
  metadata: {
    bandwidth?: string;
    simultaneousConnections?: number;
    protocols?: string[];
  };
}

export interface VpnConfig {
  type: 'openvpn' | 'wireguard' | 'ipsec';
  serverAddress: string;
  port: number;
  username: string;
  password: string;
  configData: string;
  qrCode?: string;
  downloadUrl?: string;
}

export interface VpnApiConfig {
  baseUrl: string;
  apiKey: string;
  secretKey: string;
  timeout: number;
}

// ============================================================================
// VPN Service API Client
// ============================================================================

class VpnApiClient {
  private config: VpnApiConfig;
  private logger: Logger;

  constructor(config: VpnApiConfig) {
    this.config = config;
    this.logger = new Logger('VpnApiClient');
  }

  async getAvailableServers(): Promise<VpnServerConfig[]> {
    try {
      // Simulate API call - replace with actual VPN provider API
      await this.delay(1000);

      const mockServers: VpnServerConfig[] = [
        {
          id: 'us-west-1',
          name: 'US West Coast',
          location: 'Los Angeles',
          country: 'United States',
          serverAddress: 'us-west-1.vpnprovider.com',
          port: 1194,
          protocol: 'openvpn',
          maxUsers: 1000,
          currentUsers: 245,
          isActive: true,
          load: 25,
          features: [
            { name: 'Kill Switch', enabled: true },
            { name: 'Split Tunneling', enabled: true },
            { name: 'DNS Leak Protection', enabled: true },
          ],
        },
        {
          id: 'eu-central-1',
          name: 'EU Central',
          location: 'Frankfurt',
          country: 'Germany',
          serverAddress: 'eu-central-1.vpnprovider.com',
          port: 51820,
          protocol: 'wireguard',
          maxUsers: 800,
          currentUsers: 156,
          isActive: true,
          load: 20,
          features: [
            { name: 'Kill Switch', enabled: true },
            { name: 'Split Tunneling', enabled: false },
            { name: 'DNS Leak Protection', enabled: true },
          ],
        },
        {
          id: 'asia-1',
          name: 'Asia Pacific',
          location: 'Singapore',
          country: 'Singapore',
          serverAddress: 'asia-1.vpnprovider.com',
          port: 1194,
          protocol: 'openvpn',
          maxUsers: 600,
          currentUsers: 89,
          isActive: true,
          load: 15,
          features: [
            { name: 'Kill Switch', enabled: true },
            { name: 'Split Tunneling', enabled: true },
            { name: 'DNS Leak Protection', enabled: true },
          ],
        },
      ];

      return mockServers;
    } catch (error) {
      this.logger.error('Failed to fetch available servers', { error });
      throw new Error('Unable to fetch VPN servers');
    }
  }

  async createVpnAccount(serverId: string, duration: number): Promise<VpnAccount> {
    try {
      // Simulate API call
      await this.delay(2000);

      const server = await this.getServerById(serverId);
      if (!server) {
        throw new Error(`Server ${serverId} not found`);
      }

      if (server.currentUsers >= server.maxUsers) {
        throw new Error(`Server ${serverId} is at capacity`);
      }

      const account: VpnAccount = {
        id: `vpn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: `user_${Date.now().toString(36)}`,
        password: this.generateSecurePassword(),
        serverId,
        expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        isActive: true,
        metadata: {
          bandwidth: 'unlimited',
          simultaneousConnections: 5,
          protocols: [server.protocol],
        },
      };

      this.logger.info('VPN account created successfully', {
        accountId: account.id,
        serverId,
        duration,
      });

      return account;
    } catch (error) {
      this.logger.error('Failed to create VPN account', { error, serverId, duration });
      throw error;
    }
  }

  async generateVpnConfig(account: VpnAccount): Promise<VpnConfig> {
    try {
      const server = await this.getServerById(account.serverId);
      if (!server) {
        throw new Error(`Server ${account.serverId} not found`);
      }

      let configData: string;

      switch (server.protocol) {
        case 'openvpn':
          configData = this.generateOpenVpnConfig(server, account);
          break;
        case 'wireguard':
          configData = this.generateWireGuardConfig(server, account);
          break;
        case 'ipsec':
          configData = this.generateIpsecConfig(server, account);
          break;
        default:
          throw new Error(`Unsupported protocol: ${server.protocol}`);
      }

      const config: VpnConfig = {
        type: server.protocol,
        serverAddress: server.serverAddress,
        port: server.port,
        username: account.username,
        password: account.password,
        configData,
        qrCode: this.generateQrCode(configData),
        downloadUrl: this.generateDownloadUrl(account.id),
      };

      this.logger.info('VPN config generated successfully', {
        accountId: account.id,
        protocol: server.protocol,
      });

      return config;
    } catch (error) {
      this.logger.error('Failed to generate VPN config', { error, accountId: account.id });
      throw error;
    }
  }

  async getServerStatus(serverId: string): Promise<VpnServerConfig | null> {
    try {
      await this.delay(500);
      return await this.getServerById(serverId);
    } catch (error) {
      this.logger.error('Failed to get server status', { error, serverId });
      return null;
    }
  }

  async deactivateAccount(accountId: string): Promise<boolean> {
    try {
      await this.delay(1000);
      this.logger.info('VPN account deactivated', { accountId });
      return true;
    } catch (error) {
      this.logger.error('Failed to deactivate VPN account', { error, accountId });
      return false;
    }
  }

  private async getServerById(serverId: string): Promise<VpnServerConfig | null> {
    const servers = await this.getAvailableServers();
    return servers.find(s => s.id === serverId) || null;
  }

  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private generateOpenVpnConfig(server: VpnServerConfig, account: VpnAccount): string {
    return `
client
dev tun
proto udp
remote ${server.serverAddress} ${server.port}
resolv-retry infinite
nobind
persist-key
persist-tun
ca ca.crt
cert client.crt
key client.key
auth-user-pass
cipher AES-256-CBC
auth SHA256
comp-lzo
verb 3

<auth-user-pass>
${account.username}
${account.password}
</auth-user-pass>

<ca>
-----BEGIN CERTIFICATE-----
[CA Certificate Content - Replace with actual CA cert]
-----END CERTIFICATE-----
</ca>

<cert>
-----BEGIN CERTIFICATE-----
[Client Certificate Content - Replace with actual client cert]
-----END CERTIFICATE-----
</cert>

<key>
-----BEGIN PRIVATE KEY-----
[Private Key Content - Replace with actual private key]
-----END PRIVATE KEY-----
</key>
`.trim();
  }

  private generateWireGuardConfig(server: VpnServerConfig, account: VpnAccount): string {
    const privateKey = 'cOFA+dA2Co2ZvZ8h9KQPtR4ddV1WvZSnQ1W2Z4CtUQA='; // Mock key
    const publicKey = 'K5sF3RheRdHQBP8lv6l2xdxdKfNyW7L8vB9FVwU+UHk='; // Mock key

    return `
[Interface]
PrivateKey = ${privateKey}
Address = 10.8.0.2/24
DNS = 1.1.1.1, 1.0.0.1

[Peer]
PublicKey = ${publicKey}
Endpoint = ${server.serverAddress}:${server.port}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
`.trim();
  }

  private generateIpsecConfig(server: VpnServerConfig, account: VpnAccount): string {
    return `
# IPSec Configuration
conn vpn-connection
    type=tunnel
    left=%defaultroute
    leftauth=psk
    right=${server.serverAddress}
    rightauth=psk
    rightsourceip=10.8.0.0/24
    auto=start
    keyexchange=ikev2
    ike=aes256-sha256-modp2048!
    esp=aes256-sha256!
    
# Credentials
username=${account.username}
password=${account.password}
`.trim();
  }

  private generateQrCode(configData: string): string {
    // In a real implementation, you would generate an actual QR code
    return `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" fill="black">QR Code</text>
        <text x="100" y="120" text-anchor="middle" fill="gray" font-size="12">Config Data</text>
      </svg>
    `)}`;
  }

  private generateDownloadUrl(accountId: string): string {
    return `/api/vpn/config/download/${accountId}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// VPN Plugin Implementation
// ============================================================================

export class VpnPlugin extends BasePlugin {
  private apiClient: VpnApiClient;
  private accounts: Map<string, VpnAccount> = new Map();
  private configs: Map<string, VpnConfig> = new Map();

  constructor() {
    super();

    // Initialize API client with configuration
    const apiConfig: VpnApiConfig = {
      baseUrl: process.env.VPN_API_BASE_URL || 'https://api.vpnprovider.com',
      apiKey: process.env.VPN_API_KEY || 'demo_api_key',
      secretKey: process.env.VPN_SECRET_KEY || 'demo_secret_key',
      timeout: 30000,
    };

    this.apiClient = new VpnApiClient(apiConfig);
    this.logger.info('VPN Plugin initialized', { apiConfig: { baseUrl: apiConfig.baseUrl } });
  }

  getId(): string {
    return 'vpn-plugin';
  }

  getName(): string {
    return 'VPN Service Plugin';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'Provides VPN service accounts with automatic configuration file generation';
  }

  getAuthor(): string {
    return 'MTYB Virtual Goods Platform';
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing VPN Plugin...');

      // Test API connectivity
      const servers = await this.apiClient.getAvailableServers();
      this.logger.info(`VPN Plugin initialized successfully. Found ${servers.length} servers.`);

      this.isInitialized = true;
    } catch (error) {
      this.logger.error('Failed to initialize VPN Plugin', { error });
      throw new Error('VPN Plugin initialization failed');
    }
  }

  async validateOrder(context: PluginContext): Promise<ValidationResult> {
    const errors: any[] = [];
    const warnings: any[] = [];

    try {
      // Validate product configuration
      const { product, order } = context;

      if (!product.metadata.vpnDuration) {
        errors.push({
          field: 'vpnDuration',
          message: 'VPN duration is required',
          code: 'MISSING_DURATION',
        });
      }

      if (!product.metadata.serverRegion && !product.metadata.serverId) {
        errors.push({
          field: 'serverRegion',
          message: 'Server region or specific server ID is required',
          code: 'MISSING_SERVER',
        });
      }

      // Check server availability
      if (product.metadata.serverId) {
        const serverStatus = await this.apiClient.getServerStatus(product.metadata.serverId);
        if (!serverStatus) {
          errors.push({
            field: 'serverId',
            message: 'Selected server is not available',
            code: 'SERVER_UNAVAILABLE',
          });
        } else if (serverStatus.currentUsers >= serverStatus.maxUsers) {
          errors.push({
            field: 'serverId',
            message: 'Selected server is at capacity',
            code: 'SERVER_FULL',
          });
        } else if (serverStatus.load > 90) {
          warnings.push({
            field: 'serverId',
            message: 'Selected server has high load, performance may be affected',
            code: 'HIGH_SERVER_LOAD',
          });
        }
      }

      // Validate order quantity
      if (order.items.some(item => item.quantity > 10)) {
        warnings.push({
          field: 'quantity',
          message: 'Large quantity orders may take longer to process',
          code: 'LARGE_QUANTITY',
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error('Order validation failed', { error, orderId: context.order.id });
      return {
        isValid: false,
        errors: [
          {
            field: 'general',
            message: 'Validation failed due to system error',
            code: 'VALIDATION_ERROR',
          },
        ],
        warnings,
      };
    }
  }

  async processDelivery(context: PluginContext): Promise<DeliveryResult> {
    try {
      const { product, order, user } = context;
      const orderItem = order.items.find(item => item.productId === product.id);

      if (!orderItem) {
        throw new Error('Order item not found');
      }

      this.logger.info('Processing VPN delivery', {
        orderId: order.id,
        productId: product.id,
        userId: user.id,
        quantity: orderItem.quantity,
      });

      const deliveryData: any = {
        accounts: [],
        configs: [],
        instructions: '',
        supportInfo: {
          email: 'vpn-support@mtyb.com',
          telegram: '@mtyb_vpn_support',
          documentation: 'https://docs.mtyb.com/vpn',
        },
      };

      // Process each quantity as separate VPN account
      for (let i = 0; i < orderItem.quantity; i++) {
        const serverId =
          product.metadata.serverId ||
          (await this.selectOptimalServer(product.metadata.serverRegion));
        const duration = product.metadata.vpnDuration || 30; // Default 30 days

        // Create VPN account
        const account = await this.apiClient.createVpnAccount(serverId, duration);
        this.accounts.set(account.id, account);

        // Generate configuration
        const config = await this.apiClient.generateVpnConfig(account);
        this.configs.set(account.id, config);

        deliveryData.accounts.push({
          id: account.id,
          username: account.username,
          password: account.password,
          serverId: account.serverId,
          expiresAt: account.expiresAt.toISOString(),
          protocol: config.type,
        });

        deliveryData.configs.push({
          accountId: account.id,
          type: config.type,
          downloadUrl: config.downloadUrl,
          qrCode: config.qrCode,
          configData: config.configData,
        });
      }

      // Generate setup instructions
      deliveryData.instructions = this.generateSetupInstructions(deliveryData.configs[0]);

      this.logger.info('VPN delivery processed successfully', {
        orderId: order.id,
        accountsCreated: deliveryData.accounts.length,
      });

      return {
        success: true,
        deliveryData,
        metadata: {
          accountIds: deliveryData.accounts.map((acc: any) => acc.id),
          configTypes: [...new Set(deliveryData.configs.map((cfg: any) => cfg.type))],
          expirationDates: deliveryData.accounts.map((acc: any) => acc.expiresAt),
        },
      };
    } catch (error) {
      this.logger.error('VPN delivery failed', { error, orderId: context.order.id });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown delivery error',
        retryable: true,
        metadata: {
          failureReason: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  async getHealthStatus(): Promise<PluginHealthStatus> {
    try {
      const startTime = Date.now();

      // Check API connectivity
      const servers = await this.apiClient.getAvailableServers();
      const responseTime = Date.now() - startTime;

      const activeServers = servers.filter(s => s.isActive).length;
      const averageLoad = servers.reduce((sum, s) => sum + s.load, 0) / servers.length;

      return {
        isHealthy: activeServers > 0 && averageLoad < 95,
        lastCheck: new Date(),
        responseTime,
        metadata: {
          totalServers: servers.length,
          activeServers,
          averageLoad: Math.round(averageLoad),
          apiConnectivity: 'ok',
        },
      };
    } catch (error) {
      return {
        isHealthy: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Health check failed',
        metadata: {
          apiConnectivity: 'failed',
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      };
    }
  }

  private async selectOptimalServer(region?: string): Promise<string> {
    const servers = await this.apiClient.getAvailableServers();

    let candidates = servers.filter(s => s.isActive && s.currentUsers < s.maxUsers);

    if (region) {
      const regionCandidates = candidates.filter(
        s =>
          s.location.toLowerCase().includes(region.toLowerCase()) ||
          s.country.toLowerCase().includes(region.toLowerCase())
      );
      if (regionCandidates.length > 0) {
        candidates = regionCandidates;
      }
    }

    if (candidates.length === 0) {
      throw new Error('No available servers found');
    }

    // Select server with lowest load
    const optimalServer = candidates.reduce((best, current) =>
      current.load < best.load ? current : best
    );

    return optimalServer.id;
  }

  private generateSetupInstructions(config: any): string {
    const instructions = {
      openvpn: `
## OpenVPN Setup Instructions

### Windows:
1. Download and install OpenVPN client
2. Download your configuration file
3. Import the .ovpn file into OpenVPN
4. Connect using your username and password

### macOS:
1. Download Tunnelblick
2. Import your .ovpn configuration file
3. Connect with your credentials

### Android/iOS:
1. Install OpenVPN Connect app
2. Scan the QR code or import config file
3. Connect to your VPN

### Linux:
\`\`\`bash
sudo openvpn --config your-config.ovpn
\`\`\`
      `,
      wireguard: `
## WireGuard Setup Instructions

### Windows/macOS:
1. Download WireGuard client
2. Import configuration file or scan QR code
3. Activate the tunnel

### Android/iOS:
1. Install WireGuard app
2. Scan QR code or import config
3. Toggle connection on

### Linux:
\`\`\`bash
sudo wg-quick up /path/to/config.conf
\`\`\`
      `,
      ipsec: `
## IPSec Setup Instructions

### Windows:
1. Go to Network Settings
2. Add VPN connection
3. Choose IKEv2 protocol
4. Enter server details and credentials

### macOS:
1. System Preferences > Network
2. Add VPN (IKEv2)
3. Configure with provided settings

### Mobile:
1. Add VPN profile in system settings
2. Choose IKEv2
3. Enter server and authentication details
      `,
    };

    return (
      instructions[config.type as keyof typeof instructions] ||
      'Configuration instructions not available'
    );
  }

  // Additional VPN-specific methods
  async getAccountInfo(accountId: string): Promise<VpnAccount | null> {
    return this.accounts.get(accountId) || null;
  }

  async getConfigData(accountId: string): Promise<VpnConfig | null> {
    return this.configs.get(accountId) || null;
  }

  async extendAccount(accountId: string, additionalDays: number): Promise<boolean> {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    account.expiresAt = new Date(
      account.expiresAt.getTime() + additionalDays * 24 * 60 * 60 * 1000
    );
    this.accounts.set(accountId, account);

    this.logger.info('VPN account extended', { accountId, additionalDays });
    return true;
  }

  async deactivateAccount(accountId: string): Promise<boolean> {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    const success = await this.apiClient.deactivateAccount(accountId);
    if (success) {
      account.isActive = false;
      this.accounts.set(accountId, account);
      this.logger.info('VPN account deactivated', { accountId });
    }

    return success;
  }

  async getAvailableServers(): Promise<VpnServerConfig[]> {
    return await this.apiClient.getAvailableServers();
  }
}

// Export plugin instance
export const vpnPlugin = new VpnPlugin();
