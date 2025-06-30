import React from 'react';
import { useTheme, ThemeMode } from '../../hooks/useTheme';
import { Button } from '../ui/Button';

interface ThemePreviewProps {
  className?: string;
  showControls?: boolean;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({
  className = '',
  showControls = true,
}) => {
  const { mode, isDark, setTheme } = useTheme();

  const previewThemes: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light', label: 'Light', icon: '☀️' },
    { mode: 'dark', label: 'Dark', icon: '🌙' },
    { mode: 'auto', label: 'Auto', icon: '🌓' },
  ];

  return (
    <div className={`theme-preview ${className}`}>
      <div className="preview-header">
        <h3>Theme Preview</h3>
        <p>See how your interface looks in different themes</p>
      </div>

      {showControls && (
        <div className="preview-controls">
          {previewThemes.map(theme => (
            <button
              key={theme.mode}
              className={`theme-option ${mode === theme.mode ? 'active' : ''}`}
              onClick={() => setTheme(theme.mode)}
            >
              <span className="theme-icon">{theme.icon}</span>
              <span className="theme-label">{theme.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="preview-content">
        {/* Sample UI elements */}
        <div className="sample-card">
          <div className="card-header">
            <h4>Sample Product Card</h4>
            <span className="card-badge">Featured</span>
          </div>

          <div className="card-content">
            <p>This is how a typical product card would look in the current theme.</p>

            <div className="card-stats">
              <div className="stat-item">
                <span className="stat-value">$29.99</span>
                <span className="stat-label">Price</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">4.8</span>
                <span className="stat-label">Rating</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">142</span>
                <span className="stat-label">Reviews</span>
              </div>
            </div>
          </div>

          <div className="card-actions">
            <Button variant="secondary" size="sm">
              View Details
            </Button>
            <Button variant="primary" size="sm">
              Add to Cart
            </Button>
          </div>
        </div>

        <div className="sample-form">
          <h4>Sample Form</h4>
          <form>
            <div className="form-group">
              <label htmlFor="sample-input">Email Address</label>
              <input
                id="sample-input"
                type="email"
                placeholder="Enter your email"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="sample-select">Category</label>
              <select id="sample-select" className="form-select">
                <option value="">Select a category</option>
                <option value="vpn">VPN Services</option>
                <option value="streaming">Streaming</option>
                <option value="gaming">Gaming</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" className="checkbox-input" />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">Send notifications</span>
              </label>
            </div>
          </form>
        </div>

        <div className="sample-notifications">
          <h4>Sample Notifications</h4>
          <div className="notification success">
            <span className="notification-icon">✓</span>
            <span className="notification-text">Order completed successfully!</span>
          </div>
          <div className="notification warning">
            <span className="notification-icon">⚠️</span>
            <span className="notification-text">Payment pending verification</span>
          </div>
          <div className="notification error">
            <span className="notification-icon">❌</span>
            <span className="notification-text">Failed to process request</span>
          </div>
        </div>
      </div>

      <style>{`
        .theme-preview {
          font-family: var(--font-family-base);
          max-width: 600px;
          margin: 0 auto;
        }

        .preview-header {
          text-align: center;
          margin-bottom: var(--space-6);
        }

        .preview-header h3 {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-xl);
          color: var(--color-text-primary);
        }

        .preview-header p {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--text-sm);
        }

        .preview-controls {
          display: flex;
          gap: var(--space-2);
          margin-bottom: var(--space-6);
          padding: var(--space-1);
          background: var(--color-muted);
          border-radius: var(--radius-lg);
        }

        .theme-option {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-3);
          background: none;
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: var(--touch-target-min);
        }

        .theme-option:hover {
          background: var(--color-hover);
          color: var(--color-text-primary);
        }

        .theme-option.active {
          background: var(--color-primary);
          color: var(--color-primary-contrast);
        }

        .theme-icon {
          font-size: 16px;
        }

        .preview-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .sample-card {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border);
        }

        .card-header h4 {
          margin: 0;
          font-size: var(--text-lg);
          color: var(--color-text-primary);
        }

        .card-badge {
          background: var(--color-primary);
          color: var(--color-primary-contrast);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          font-weight: var(--font-weight-medium);
        }

        .card-content {
          padding: var(--space-4);
        }

        .card-content p {
          margin: 0 0 var(--space-4) 0;
          color: var(--color-text-secondary);
          line-height: var(--leading-normal);
        }

        .card-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-3);
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .stat-label {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
        }

        .card-actions {
          display: flex;
          gap: var(--space-2);
          padding: var(--space-4);
          border-top: 1px solid var(--color-border);
        }

        .sample-form {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
        }

        .sample-form h4 {
          margin: 0 0 var(--space-4) 0;
          font-size: var(--text-lg);
          color: var(--color-text-primary);
        }

        .form-group {
          margin-bottom: var(--space-4);
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          margin-bottom: var(--space-2);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: var(--space-3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          color: var(--color-text-primary);
          background: var(--color-background);
          transition: border-color 0.2s ease;
          min-height: var(--touch-target-min);
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-light);
        }

        .checkbox-label {
          display: flex !important;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: 0;
          cursor: pointer;
        }

        .checkbox-input {
          display: none;
        }

        .checkbox-custom {
          width: 18px;
          height: 18px;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-background);
          position: relative;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .checkbox-input:checked + .checkbox-custom {
          background: var(--color-primary);
          border-color: var(--color-primary);
        }

        .checkbox-input:checked + .checkbox-custom::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
          font-weight: bold;
        }

        .checkbox-text {
          font-size: var(--text-sm);
          color: var(--color-text-primary);
        }

        .sample-notifications {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
        }

        .sample-notifications h4 {
          margin: 0 0 var(--space-4) 0;
          font-size: var(--text-lg);
          color: var(--color-text-primary);
        }

        .notification {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-2);
          font-size: var(--text-sm);
        }

        .notification:last-child {
          margin-bottom: 0;
        }

        .notification.success {
          background: var(--color-success-light);
          color: var(--color-success);
        }

        .notification.warning {
          background: var(--color-warning-light);
          color: var(--color-warning);
        }

        .notification.error {
          background: var(--color-error-light);
          color: var(--color-error);
        }

        .notification-icon {
          font-size: 16px;
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .preview-controls {
            flex-direction: column;
          }

          .card-actions {
            flex-direction: column;
          }

          .card-stats {
            grid-template-columns: 1fr;
            gap: var(--space-2);
          }
        }
      `}</style>
    </div>
  );
};

export default ThemePreview;
