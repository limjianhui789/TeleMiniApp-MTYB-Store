import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';
import { ThemeToggle, ThemePreview } from '../theme';
import { Button } from '../ui/Button';
import { Toast, useToast } from '../feedback/Toast';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const ThemeDemo: React.FC = () => {
  const { mode, isDark, isSystemDark, setTheme } = useTheme();
  const { colorScheme } = useTelegramTheme();
  const { showToast } = useToast();

  const handleShowNotification = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: 'Theme applied successfully!',
      error: 'Failed to apply theme',
      warning: 'Theme change may affect performance',
      info: 'Theme synchronized with system',
    };

    showToast({
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Message`,
      message: messages[type],
    });
  };

  return (
    <div className="theme-demo">
      <div className="demo-header">
        <h1>Theme System Demo</h1>
        <p>Explore the comprehensive theme system with light/dark mode support</p>
      </div>

      {/* Theme Controls Section */}
      <section className="demo-section">
        <h2>Theme Controls</h2>
        <div className="controls-grid">
          <div className="control-item">
            <h3>Toggle Button</h3>
            <ThemeToggle variant="button" />
          </div>

          <div className="control-item">
            <h3>Switch Control</h3>
            <ThemeToggle variant="switch" />
          </div>

          <div className="control-item">
            <h3>Dropdown Menu</h3>
            <ThemeToggle variant="dropdown" />
          </div>
        </div>
      </section>

      {/* Theme Information */}
      <section className="demo-section">
        <h2>Current Theme Information</h2>
        <div className="info-grid">
          <div className="info-card">
            <h4>Theme Mode</h4>
            <p className="info-value">{mode}</p>
            <p className="info-description">
              {mode === 'auto' ? 'Follows system preference' : `Fixed ${mode} mode`}
            </p>
          </div>

          <div className="info-card">
            <h4>Current Appearance</h4>
            <p className="info-value">{isDark ? 'Dark' : 'Light'}</p>
            <p className="info-description">
              {mode === 'auto' && `System: ${isSystemDark ? 'Dark' : 'Light'}`}
            </p>
          </div>

          <div className="info-card">
            <h4>Color Scheme</h4>
            <p className="info-value">{colorScheme.name}</p>
            <p className="info-description">
              {colorScheme.isLight ? 'Light colors' : 'Dark colors'}
            </p>
          </div>
        </div>
      </section>

      {/* Sample Components */}
      <section className="demo-section">
        <h2>Sample Components</h2>
        <div className="components-showcase">
          {/* Buttons */}
          <div className="component-group">
            <h3>Buttons</h3>
            <div className="button-row">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="outline">Outline</Button>
            </div>
          </div>

          {/* Cards */}
          <div className="component-group">
            <h3>Cards</h3>
            <div className="cards-row">
              <div className="sample-card">
                <h4>Product Card</h4>
                <p>
                  This is a sample product description that shows how text appears in the current
                  theme.
                </p>
                <div className="card-footer">
                  <span className="price">$29.99</span>
                  <Button size="sm" variant="primary">
                    Buy Now
                  </Button>
                </div>
              </div>

              <div className="sample-card elevated">
                <h4>Elevated Card</h4>
                <p>This card has elevation and shows how shadows work in different themes.</p>
                <div className="card-stats">
                  <div className="stat">
                    <span className="stat-value">4.8</span>
                    <span className="stat-label">Rating</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">142</span>
                    <span className="stat-label">Reviews</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading States */}
          <div className="component-group">
            <h3>Loading States</h3>
            <div className="loading-row">
              <LoadingSpinner size="small" />
              <LoadingSpinner size="medium" />
              <LoadingSpinner size="large" />
            </div>
          </div>

          {/* Notifications */}
          <div className="component-group">
            <h3>Notifications</h3>
            <div className="notification-buttons">
              <Button variant="outline" size="sm" onClick={() => handleShowNotification('success')}>
                Success
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShowNotification('warning')}>
                Warning
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShowNotification('error')}>
                Error
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShowNotification('info')}>
                Info
              </Button>
            </div>
          </div>

          {/* Form Elements */}
          <div className="component-group">
            <h3>Form Elements</h3>
            <div className="form-showcase">
              <div className="form-group">
                <label htmlFor="demo-input">Text Input</label>
                <input
                  id="demo-input"
                  type="text"
                  placeholder="Enter some text..."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="demo-select">Select</label>
                <select id="demo-select" className="form-select">
                  <option value="">Choose option...</option>
                  <option value="light">Light Theme</option>
                  <option value="dark">Dark Theme</option>
                  <option value="auto">Auto Theme</option>
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" className="checkbox-input" />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">Enable notifications</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Theme Preview */}
      <section className="demo-section">
        <h2>Interactive Theme Preview</h2>
        <ThemePreview showControls={true} />
      </section>

      <style>{`
        .theme-demo {
          min-height: 100vh;
          padding: var(--space-6);
          max-width: 1200px;
          margin: 0 auto;
          font-family: var(--font-family-base);
          background: var(--color-background);
          color: var(--color-text-primary);
        }

        .demo-header {
          text-align: center;
          margin-bottom: var(--space-8);
          padding-bottom: var(--space-6);
          border-bottom: 2px solid var(--color-border);
        }

        .demo-header h1 {
          margin: 0 0 var(--space-3) 0;
          font-size: var(--text-4xl);
          font-weight: var(--font-weight-bold);
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .demo-header p {
          margin: 0;
          font-size: var(--text-lg);
          color: var(--color-text-secondary);
        }

        .demo-section {
          margin-bottom: var(--space-10);
        }

        .demo-section h2 {
          margin: 0 0 var(--space-6) 0;
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .controls-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-6);
        }

        .control-item {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          text-align: center;
        }

        .control-item h3 {
          margin: 0 0 var(--space-4) 0;
          font-size: var(--text-lg);
          color: var(--color-text-primary);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        }

        .info-card {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          text-align: center;
        }

        .info-card h4 {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
        }

        .info-value {
          margin: 0 0 var(--space-1) 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
          text-transform: capitalize;
        }

        .info-description {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text-tertiary);
        }

        .components-showcase {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }

        .component-group {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
        }

        .component-group h3 {
          margin: 0 0 var(--space-4) 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .button-row {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .cards-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-4);
        }

        .sample-card {
          background: var(--color-background-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          transition: all 0.2s ease;
        }

        .sample-card.elevated {
          box-shadow: var(--shadow-md);
        }

        .sample-card:hover {
          box-shadow: var(--shadow-lg);
          border-color: var(--color-primary-light);
        }

        .sample-card h4 {
          margin: 0 0 var(--space-3) 0;
          font-size: var(--text-lg);
          color: var(--color-text-primary);
        }

        .sample-card p {
          margin: 0 0 var(--space-4) 0;
          color: var(--color-text-secondary);
          line-height: var(--leading-normal);
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
        }

        .card-stats {
          display: flex;
          gap: var(--space-4);
        }

        .stat {
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

        .loading-row {
          display: flex;
          gap: var(--space-6);
          align-items: center;
          justify-content: center;
        }

        .notification-buttons {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .form-showcase {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          max-width: 400px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .form-group label {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .form-input,
        .form-select {
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
          flex-direction: row !important;
          align-items: center;
          gap: var(--space-2);
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

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .theme-demo {
            padding: var(--space-4);
          }

          .demo-header h1 {
            font-size: var(--text-3xl);
          }

          .controls-grid {
            grid-template-columns: 1fr;
          }

          .button-row {
            justify-content: center;
          }

          .cards-row {
            grid-template-columns: 1fr;
          }

          .card-footer {
            flex-direction: column;
            gap: var(--space-3);
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export default ThemeDemo;
