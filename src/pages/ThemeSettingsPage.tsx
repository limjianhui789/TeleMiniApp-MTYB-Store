import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { ThemeToggle, ThemePreview } from '../components/theme';
import { Button } from '../components/ui/Button';

export const ThemeSettingsPage: React.FC = () => {
  const { mode, isDark, isSystemDark, resetToSystem } = useTheme();

  return (
    <div className="theme-settings-page">
      <div className="page-header">
        <h1>Theme Settings</h1>
        <p>Customize the appearance of your interface</p>
      </div>

      <div className="settings-section">
        <div className="section-header">
          <h2>Theme Selection</h2>
          <p>Choose how you want the interface to appear</p>
        </div>

        <div className="theme-controls">
          <div className="control-group">
            <label>Quick Toggle</label>
            <ThemeToggle variant="switch" showLabel={true} />
          </div>

          <div className="control-group">
            <label>Theme Options</label>
            <ThemeToggle variant="dropdown" showLabel={true} />
          </div>

          <div className="control-group">
            <label>Current Theme</label>
            <div className="theme-info">
              <span className="theme-current">
                {mode === 'auto' ? `Auto (${isDark ? 'Dark' : 'Light'})` : mode}
              </span>
              <span className="theme-description">
                {mode === 'auto' && (
                  <>Follows your system preference ({isSystemDark ? 'Dark' : 'Light'})</>
                )}
                {mode === 'light' && <>Always use light theme</>}
                {mode === 'dark' && <>Always use dark theme</>}
              </span>
            </div>
          </div>

          {mode !== 'auto' && (
            <div className="control-group">
              <Button onClick={resetToSystem} variant="secondary" size="sm">
                Reset to System
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="settings-section">
        <div className="section-header">
          <h2>Theme Preview</h2>
          <p>See how your interface will look with different themes</p>
        </div>

        <ThemePreview showControls={true} />
      </div>

      <div className="settings-section">
        <div className="section-header">
          <h2>Accessibility</h2>
          <p>Theme settings that improve accessibility</p>
        </div>

        <div className="accessibility-info">
          <div className="info-item">
            <h4>System Theme Sync</h4>
            <p>
              When set to "Auto", the theme will automatically match your device's system preference
              and change when you update your system settings.
            </p>
          </div>

          <div className="info-item">
            <h4>Reduced Motion</h4>
            <p>
              Theme transitions respect your system's motion preferences. If you have reduced motion
              enabled, theme changes will be instant.
            </p>
          </div>

          <div className="info-item">
            <h4>High Contrast</h4>
            <p>
              Both light and dark themes are designed with sufficient contrast ratios to meet WCAG
              accessibility guidelines.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .theme-settings-page {
          min-height: 100vh;
          padding: var(--space-6);
          max-width: 800px;
          margin: 0 auto;
          font-family: var(--font-family-base);
          background: var(--color-background);
          color: var(--color-text-primary);
        }

        .page-header {
          text-align: center;
          margin-bottom: var(--space-8);
          padding-bottom: var(--space-6);
          border-bottom: 1px solid var(--color-border);
        }

        .page-header h1 {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .page-header p {
          margin: 0;
          font-size: var(--text-lg);
          color: var(--color-text-secondary);
        }

        .settings-section {
          margin-bottom: var(--space-8);
        }

        .section-header {
          margin-bottom: var(--space-6);
        }

        .section-header h2 {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .section-header p {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .theme-controls {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .control-group label {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .theme-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .theme-current {
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          text-transform: capitalize;
        }

        .theme-description {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .accessibility-info {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .info-item h4 {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .info-item p {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: var(--leading-normal);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .theme-settings-page {
            padding: var(--space-4);
          }

          .control-group {
            gap: var(--space-3);
          }

          .page-header h1 {
            font-size: var(--text-2xl);
          }

          .page-header p {
            font-size: var(--text-base);
          }
        }

        @media (max-width: 480px) {
          .theme-controls,
          .accessibility-info {
            padding: var(--space-4);
          }

          .settings-section {
            margin-bottom: var(--space-6);
          }
        }
      `}</style>
    </div>
  );
};

export default ThemeSettingsPage;
