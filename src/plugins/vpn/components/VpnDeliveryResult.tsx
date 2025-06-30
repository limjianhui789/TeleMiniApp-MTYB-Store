import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

interface VpnAccount {
  id: string;
  username: string;
  password: string;
  serverId: string;
  expiresAt: string;
  protocol: string;
}

interface VpnConfig {
  accountId: string;
  type: string;
  downloadUrl: string;
  qrCode: string;
  configData: string;
}

interface VpnDeliveryResultProps {
  deliveryData: {
    accounts: VpnAccount[];
    configs: VpnConfig[];
    instructions: string;
    supportInfo: {
      email: string;
      telegram: string;
      documentation: string;
    };
  };
  className?: string;
}

export const VpnDeliveryResult: React.FC<VpnDeliveryResultProps> = ({
  deliveryData,
  className = '',
}) => {
  const [selectedAccount, setSelectedAccount] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const currentAccount = deliveryData.accounts[selectedAccount];
  const currentConfig = deliveryData.configs.find(c => c.accountId === currentAccount.id);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadConfig = (config: VpnConfig) => {
    const blob = new Blob([config.configData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vpn-config-${config.accountId}.${config.type === 'openvpn' ? 'ovpn' : 'conf'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!deliveryData.accounts.length) {
    return (
      <div className="vpn-delivery-result__empty">
        <p>No VPN accounts found in delivery data.</p>
      </div>
    );
  }

  return (
    <div className={`vpn-delivery-result ${className}`}>
      {/* Success Header */}
      <div className="vpn-delivery-result__header">
        <div className="vpn-delivery-result__success-icon">✅</div>
        <h2 className="vpn-delivery-result__title">VPN Account(s) Ready!</h2>
        <p className="vpn-delivery-result__subtitle">
          Your VPN {deliveryData.accounts.length === 1 ? 'account has' : 'accounts have'} been
          created successfully
        </p>
      </div>

      {/* Account Selection */}
      {deliveryData.accounts.length > 1 && (
        <div className="vpn-delivery-result__account-tabs">
          {deliveryData.accounts.map((account, index) => (
            <button
              key={account.id}
              onClick={() => setSelectedAccount(index)}
              className={`vpn-delivery-result__tab ${selectedAccount === index ? 'active' : ''}`}
            >
              Account {index + 1}
            </button>
          ))}
        </div>
      )}

      {/* Account Details */}
      <Card className="vpn-delivery-result__account-card">
        <div className="vpn-delivery-result__account-header">
          <h3>Account Details</h3>
          <span className="vpn-delivery-result__protocol-badge">
            {currentAccount.protocol.toUpperCase()}
          </span>
        </div>

        <div className="vpn-delivery-result__credentials">
          <div className="vpn-delivery-result__credential">
            <label>Username</label>
            <div className="vpn-delivery-result__credential-input">
              <input type="text" value={currentAccount.username} readOnly />
              <Button
                onClick={() => copyToClipboard(currentAccount.username, 'username')}
                variant="ghost"
                size="sm"
                className="vpn-delivery-result__copy-btn"
              >
                {copiedField === 'username' ? '✓' : '📋'}
              </Button>
            </div>
          </div>

          <div className="vpn-delivery-result__credential">
            <label>Password</label>
            <div className="vpn-delivery-result__credential-input">
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentAccount.password}
                readOnly
              />
              <Button
                onClick={() => setShowPassword(!showPassword)}
                variant="ghost"
                size="sm"
                className="vpn-delivery-result__toggle-btn"
              >
                {showPassword ? '🙈' : '👁️'}
              </Button>
              <Button
                onClick={() => copyToClipboard(currentAccount.password, 'password')}
                variant="ghost"
                size="sm"
                className="vpn-delivery-result__copy-btn"
              >
                {copiedField === 'password' ? '✓' : '📋'}
              </Button>
            </div>
          </div>

          <div className="vpn-delivery-result__credential">
            <label>Account ID</label>
            <div className="vpn-delivery-result__credential-input">
              <input type="text" value={currentAccount.id} readOnly />
              <Button
                onClick={() => copyToClipboard(currentAccount.id, 'accountId')}
                variant="ghost"
                size="sm"
                className="vpn-delivery-result__copy-btn"
              >
                {copiedField === 'accountId' ? '✓' : '📋'}
              </Button>
            </div>
          </div>

          <div className="vpn-delivery-result__expiry">
            <span className="vpn-delivery-result__expiry-label">Expires:</span>
            <span className="vpn-delivery-result__expiry-date">
              {formatExpiryDate(currentAccount.expiresAt)}
            </span>
          </div>
        </div>
      </Card>

      {/* Configuration Download */}
      {currentConfig && (
        <Card className="vpn-delivery-result__config-card">
          <h3>Configuration Files</h3>

          <div className="vpn-delivery-result__config-options">
            {/* QR Code */}
            <div className="vpn-delivery-result__qr-section">
              <h4>Mobile Setup - Scan QR Code</h4>
              <div className="vpn-delivery-result__qr-code">
                <img
                  src={currentConfig.qrCode}
                  alt="VPN Configuration QR Code"
                  className="vpn-delivery-result__qr-image"
                />
              </div>
              <p className="vpn-delivery-result__qr-instructions">
                Use your VPN app to scan this QR code for instant setup
              </p>
            </div>

            {/* File Download */}
            <div className="vpn-delivery-result__download-section">
              <h4>Manual Setup - Download Config</h4>
              <Button
                onClick={() => downloadConfig(currentConfig)}
                variant="primary"
                size="md"
                className="vpn-delivery-result__download-btn"
              >
                📥 Download {currentConfig.type.toUpperCase()} Config
              </Button>
              <p className="vpn-delivery-result__download-instructions">
                Download and import this file into your VPN client
              </p>
            </div>
          </div>

          {/* Config Preview */}
          <div className="vpn-delivery-result__config-preview">
            <h4>Configuration Preview</h4>
            <textarea
              value={currentConfig.configData}
              readOnly
              className="vpn-delivery-result__config-text"
              rows={8}
            />
            <Button
              onClick={() => copyToClipboard(currentConfig.configData, 'configData')}
              variant="secondary"
              size="sm"
              className="vpn-delivery-result__copy-config-btn"
            >
              {copiedField === 'configData' ? '✓ Copied!' : '📋 Copy Config'}
            </Button>
          </div>
        </Card>
      )}

      {/* Setup Instructions */}
      <Card className="vpn-delivery-result__instructions-card">
        <h3>Setup Instructions</h3>
        <div
          className="vpn-delivery-result__instructions"
          dangerouslySetInnerHTML={{ __html: deliveryData.instructions.replace(/\n/g, '<br>') }}
        />
      </Card>

      {/* Support Information */}
      <Card className="vpn-delivery-result__support-card">
        <h3>Need Help?</h3>
        <div className="vpn-delivery-result__support-links">
          <a
            href={`mailto:${deliveryData.supportInfo.email}`}
            className="vpn-delivery-result__support-link"
          >
            📧 Email Support
          </a>
          <a
            href={`https://t.me/${deliveryData.supportInfo.telegram.replace('@', '')}`}
            className="vpn-delivery-result__support-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 Telegram Support
          </a>
          <a
            href={deliveryData.supportInfo.documentation}
            className="vpn-delivery-result__support-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            📖 Documentation
          </a>
        </div>
      </Card>

      {/* Important Notes */}
      <div className="vpn-delivery-result__notes">
        <h4>⚠️ Important Notes:</h4>
        <ul>
          <li>Save your credentials securely - they cannot be recovered</li>
          <li>Your VPN account will expire on {formatExpiryDate(currentAccount.expiresAt)}</li>
          <li>You can connect up to 5 devices simultaneously</li>
          <li>Contact support before your account expires for renewal options</li>
          <li>Do not share your credentials with others</li>
        </ul>
      </div>

      <style>{`
        .vpn-delivery-result {
          max-width: 800px;
          margin: 0 auto;
          padding: 1rem;
        }

        .vpn-delivery-result__empty {
          text-align: center;
          padding: 2rem;
          color: var(--tg-theme-hint-color, #666);
        }

        .vpn-delivery-result__header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .vpn-delivery-result__success-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .vpn-delivery-result__title {
          margin: 0 0 0.5rem 0;
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--tg-theme-text-color, #000);
        }

        .vpn-delivery-result__subtitle {
          margin: 0;
          color: var(--tg-theme-hint-color, #666);
          font-size: 1.1rem;
        }

        .vpn-delivery-result__account-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          overflow-x: auto;
        }

        .vpn-delivery-result__tab {
          padding: 0.75rem 1.5rem;
          border: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
          border-radius: 8px;
          background: var(--tg-theme-bg-color, #fff);
          color: var(--tg-theme-text-color, #000);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .vpn-delivery-result__tab.active {
          background: var(--tg-theme-button-color, #007AFF);
          color: var(--tg-theme-button-text-color, #fff);
          border-color: var(--tg-theme-button-color, #007AFF);
        }

        .vpn-delivery-result__account-card,
        .vpn-delivery-result__config-card,
        .vpn-delivery-result__instructions-card,
        .vpn-delivery-result__support-card {
          margin-bottom: 1.5rem;
          padding: 1.5rem;
        }

        .vpn-delivery-result__account-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .vpn-delivery-result__account-header h3 {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 600;
        }

        .vpn-delivery-result__protocol-badge {
          background: var(--tg-theme-button-color, #007AFF);
          color: var(--tg-theme-button-text-color, #fff);
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .vpn-delivery-result__credentials {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .vpn-delivery-result__credential {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .vpn-delivery-result__credential label {
          font-weight: 600;
          color: var(--tg-theme-text-color, #000);
        }

        .vpn-delivery-result__credential-input {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .vpn-delivery-result__credential-input input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
          border-radius: 8px;
          background: var(--tg-theme-secondary-bg-color, #f8f9fa);
          color: var(--tg-theme-text-color, #000);
          font-family: monospace;
        }

        .vpn-delivery-result__copy-btn,
        .vpn-delivery-result__toggle-btn {
          min-width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vpn-delivery-result__expiry {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(56, 161, 105, 0.1);
          border-radius: 8px;
          border-left: 4px solid #38a169;
        }

        .vpn-delivery-result__expiry-label {
          font-weight: 600;
          color: var(--tg-theme-text-color, #000);
        }

        .vpn-delivery-result__expiry-date {
          color: #38a169;
          font-weight: 600;
        }

        .vpn-delivery-result__config-card h3,
        .vpn-delivery-result__instructions-card h3,
        .vpn-delivery-result__support-card h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.3rem;
          font-weight: 600;
        }

        .vpn-delivery-result__config-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .vpn-delivery-result__qr-section,
        .vpn-delivery-result__download-section {
          text-align: center;
        }

        .vpn-delivery-result__qr-section h4,
        .vpn-delivery-result__download-section h4 {
          margin: 0 0 1rem 0;
          font-weight: 600;
        }

        .vpn-delivery-result__qr-code {
          margin: 1rem 0;
        }

        .vpn-delivery-result__qr-image {
          width: 200px;
          height: 200px;
          border: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
          border-radius: 8px;
        }

        .vpn-delivery-result__qr-instructions,
        .vpn-delivery-result__download-instructions {
          font-size: 0.9rem;
          color: var(--tg-theme-hint-color, #666);
          margin-top: 0.5rem;
        }

        .vpn-delivery-result__download-btn {
          margin: 1rem 0;
        }

        .vpn-delivery-result__config-preview {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
        }

        .vpn-delivery-result__config-preview h4 {
          margin: 0 0 1rem 0;
          font-weight: 600;
        }

        .vpn-delivery-result__config-text {
          width: 100%;
          padding: 1rem;
          border: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
          border-radius: 8px;
          background: var(--tg-theme-secondary-bg-color, #f8f9fa);
          font-family: monospace;
          font-size: 0.8rem;
          resize: vertical;
          margin-bottom: 0.5rem;
        }

        .vpn-delivery-result__instructions {
          line-height: 1.6;
          color: var(--tg-theme-text-color, #333);
        }

        .vpn-delivery-result__support-links {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .vpn-delivery-result__support-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: var(--tg-theme-button-color, #007AFF);
          color: var(--tg-theme-button-text-color, #fff);
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          transition: opacity 0.2s ease;
        }

        .vpn-delivery-result__support-link:hover {
          opacity: 0.8;
        }

        .vpn-delivery-result__notes {
          margin-top: 2rem;
          padding: 1.5rem;
          background: rgba(255, 193, 7, 0.1);
          border-radius: 8px;
          border-left: 4px solid #ffc107;
        }

        .vpn-delivery-result__notes h4 {
          margin: 0 0 1rem 0;
          font-weight: 600;
          color: var(--tg-theme-text-color, #000);
        }

        .vpn-delivery-result__notes ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .vpn-delivery-result__notes li {
          margin-bottom: 0.5rem;
          color: var(--tg-theme-text-color, #333);
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .vpn-delivery-result {
            padding: 0.5rem;
          }

          .vpn-delivery-result__config-options {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .vpn-delivery-result__qr-image {
            width: 150px;
            height: 150px;
          }

          .vpn-delivery-result__support-links {
            flex-direction: column;
          }

          .vpn-delivery-result__credential-input {
            flex-wrap: wrap;
          }

          .vpn-delivery-result__credential-input input {
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
};
