import React, { useState, useCallback } from 'react';
import { ThemeProvider } from '../components/theme';
import { ToastProvider } from '../components/feedback/Toast';
import {
  PluginSubmissionForm,
  PluginManagement,
  PluginDeveloperDashboard,
} from '../components/pluginStore';
import { PluginSubmission } from '../types/pluginStore';

type ViewMode = 'dashboard' | 'submit' | 'manage';

export const PluginPublishPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [editingSubmission, setEditingSubmission] = useState<PluginSubmission | null>(null);

  const handleSubmissionSuccess = useCallback((submission: PluginSubmission) => {
    console.log('Submission successful:', submission);
    setViewMode('manage');
    setEditingSubmission(null);
  }, []);

  const handleEditSubmission = useCallback((submission: PluginSubmission) => {
    setEditingSubmission(submission);
    setViewMode('submit');
  }, []);

  const handleCancelSubmission = useCallback(() => {
    setViewMode('dashboard');
    setEditingSubmission(null);
  }, []);

  const renderContent = () => {
    switch (viewMode) {
      case 'submit':
        return (
          <PluginSubmissionForm
            onSubmit={handleSubmissionSuccess}
            onCancel={handleCancelSubmission}
            existingSubmission={editingSubmission || undefined}
          />
        );

      case 'manage':
        return <PluginManagement userRole="developer" developerId="current-user" />;

      default:
        return <PluginDeveloperDashboard />;
    }
  };

  return (
    <ThemeProvider defaultTheme="auto">
      <ToastProvider>
        <div className="plugin-publish-page">
          {/* Navigation Header */}
          <div className="page-header">
            <div className="header-content">
              <h1>Developer Portal</h1>
              <p>Manage your plugins and submissions</p>
            </div>

            <nav className="page-nav">
              <button
                className={`nav-button ${viewMode === 'dashboard' ? 'active' : ''}`}
                onClick={() => setViewMode('dashboard')}
              >
                📊 Dashboard
              </button>
              <button
                className={`nav-button ${viewMode === 'submit' ? 'active' : ''}`}
                onClick={() => setViewMode('submit')}
              >
                📝 Submit Plugin
              </button>
              <button
                className={`nav-button ${viewMode === 'manage' ? 'active' : ''}`}
                onClick={() => setViewMode('manage')}
              >
                📦 My Submissions
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <main className="page-content">{renderContent()}</main>

          {/* Quick Actions Sidebar (Dashboard only) */}
          {viewMode === 'dashboard' && (
            <aside className="quick-actions">
              <div className="actions-card">
                <h3>Quick Actions</h3>
                <div className="actions-list">
                  <button className="action-button primary" onClick={() => setViewMode('submit')}>
                    <span className="action-icon">✨</span>
                    <div className="action-content">
                      <strong>Submit New Plugin</strong>
                      <p>Create and submit a new plugin to the store</p>
                    </div>
                  </button>

                  <button className="action-button" onClick={() => setViewMode('manage')}>
                    <span className="action-icon">📋</span>
                    <div className="action-content">
                      <strong>View Submissions</strong>
                      <p>Check status of your plugin submissions</p>
                    </div>
                  </button>

                  <button className="action-button">
                    <span className="action-icon">📚</span>
                    <div className="action-content">
                      <strong>Developer Docs</strong>
                      <p>Learn how to create amazing plugins</p>
                    </div>
                  </button>

                  <button className="action-button">
                    <span className="action-icon">💬</span>
                    <div className="action-content">
                      <strong>Get Support</strong>
                      <p>Contact our developer support team</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="stats-card">
                <h3>Store Statistics</h3>
                <div className="stats-list">
                  <div className="stat-item">
                    <span className="stat-value">1,247</span>
                    <span className="stat-label">Total Plugins</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">89</span>
                    <span className="stat-label">Pending Review</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">156K</span>
                    <span className="stat-label">Total Downloads</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">4.6</span>
                    <span className="stat-label">Avg Rating</span>
                  </div>
                </div>
              </div>

              <div className="tips-card">
                <h3>💡 Developer Tips</h3>
                <div className="tips-list">
                  <div className="tip-item">
                    <strong>Clear Documentation</strong>
                    <p>Provide comprehensive docs to speed up review process</p>
                  </div>
                  <div className="tip-item">
                    <strong>Follow Guidelines</strong>
                    <p>Adhere to our security and quality standards</p>
                  </div>
                  <div className="tip-item">
                    <strong>Test Thoroughly</strong>
                    <p>Test your plugin on multiple devices and scenarios</p>
                  </div>
                </div>
              </div>
            </aside>
          )}

          <style>{`
            .plugin-publish-page {
              min-height: 100vh;
              background: var(--color-background);
              color: var(--color-text-primary);
              font-family: var(--font-family-base);
              display: grid;
              grid-template-areas: 
                "header header"
                "content sidebar";
              grid-template-columns: 1fr 300px;
              grid-template-rows: auto 1fr;
              gap: 0;
            }

            .plugin-publish-page:not(:has(.quick-actions)) {
              grid-template-areas: 
                "header"
                "content";
              grid-template-columns: 1fr;
            }

            .page-header {
              grid-area: header;
              background: var(--color-card-background);
              border-bottom: 1px solid var(--color-border);
              padding: var(--space-6);
            }

            .header-content {
              text-align: center;
              margin-bottom: var(--space-6);
            }

            .header-content h1 {
              margin: 0 0 var(--space-2) 0;
              font-size: var(--text-3xl);
              font-weight: var(--font-weight-bold);
              background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }

            .header-content p {
              margin: 0;
              font-size: var(--text-lg);
              color: var(--color-text-secondary);
            }

            .page-nav {
              display: flex;
              justify-content: center;
              gap: var(--space-2);
              flex-wrap: wrap;
            }

            .nav-button {
              display: flex;
              align-items: center;
              gap: var(--space-2);
              padding: var(--space-3) var(--space-5);
              border: 1px solid var(--color-border);
              border-radius: var(--radius-lg);
              background: var(--color-background);
              color: var(--color-text-primary);
              font-size: var(--text-base);
              font-weight: var(--font-weight-medium);
              cursor: pointer;
              transition: all 0.2s ease;
              text-decoration: none;
              min-height: var(--touch-target-min);
            }

            .nav-button:hover {
              background: var(--color-hover);
              border-color: var(--color-primary-light);
            }

            .nav-button.active {
              background: var(--color-primary);
              color: var(--color-primary-contrast);
              border-color: var(--color-primary);
            }

            .page-content {
              grid-area: content;
              padding: var(--space-6);
              overflow-y: auto;
            }

            .quick-actions {
              grid-area: sidebar;
              background: var(--color-muted);
              border-left: 1px solid var(--color-border);
              padding: var(--space-6);
              overflow-y: auto;
              display: flex;
              flex-direction: column;
              gap: var(--space-6);
            }

            .actions-card,
            .stats-card,
            .tips-card {
              background: var(--color-card-background);
              border: 1px solid var(--color-border);
              border-radius: var(--radius-lg);
              padding: var(--space-5);
            }

            .actions-card h3,
            .stats-card h3,
            .tips-card h3 {
              margin: 0 0 var(--space-4) 0;
              font-size: var(--text-lg);
              font-weight: var(--font-weight-bold);
              color: var(--color-text-primary);
            }

            .actions-list {
              display: flex;
              flex-direction: column;
              gap: var(--space-3);
            }

            .action-button {
              display: flex;
              align-items: center;
              gap: var(--space-3);
              padding: var(--space-4);
              border: 1px solid var(--color-border);
              border-radius: var(--radius-md);
              background: var(--color-background);
              color: var(--color-text-primary);
              text-align: left;
              cursor: pointer;
              transition: all 0.2s ease;
              text-decoration: none;
            }

            .action-button:hover {
              border-color: var(--color-primary-light);
              box-shadow: var(--shadow-sm);
            }

            .action-button.primary {
              border-color: var(--color-primary);
              background: var(--color-primary-light);
            }

            .action-button.primary:hover {
              background: var(--color-primary);
              color: var(--color-primary-contrast);
            }

            .action-icon {
              font-size: 1.5rem;
              flex-shrink: 0;
            }

            .action-content {
              flex: 1;
              min-width: 0;
            }

            .action-content strong {
              display: block;
              font-size: var(--text-sm);
              font-weight: var(--font-weight-semibold);
              margin-bottom: var(--space-1);
              color: var(--color-text-primary);
            }

            .action-content p {
              margin: 0;
              font-size: var(--text-xs);
              color: var(--color-text-secondary);
              line-height: var(--leading-tight);
            }

            .stats-list {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: var(--space-4);
            }

            .stat-item {
              text-align: center;
            }

            .stat-value {
              display: block;
              font-size: var(--text-xl);
              font-weight: var(--font-weight-bold);
              color: var(--color-primary);
              margin-bottom: var(--space-1);
            }

            .stat-label {
              font-size: var(--text-xs);
              color: var(--color-text-secondary);
              font-weight: var(--font-weight-medium);
            }

            .tips-list {
              display: flex;
              flex-direction: column;
              gap: var(--space-4);
            }

            .tip-item strong {
              display: block;
              font-size: var(--text-sm);
              font-weight: var(--font-weight-semibold);
              color: var(--color-text-primary);
              margin-bottom: var(--space-1);
            }

            .tip-item p {
              margin: 0;
              font-size: var(--text-xs);
              color: var(--color-text-secondary);
              line-height: var(--leading-normal);
            }

            /* Mobile optimizations */
            @media (max-width: 1024px) {
              .plugin-publish-page {
                grid-template-areas: 
                  "header"
                  "content";
                grid-template-columns: 1fr;
                grid-template-rows: auto 1fr;
              }

              .quick-actions {
                display: none;
              }

              .page-header,
              .page-content {
                padding: var(--space-4);
              }

              .header-content h1 {
                font-size: var(--text-2xl);
              }

              .page-nav {
                justify-content: stretch;
              }

              .nav-button {
                flex: 1;
                justify-content: center;
                min-width: 0;
                padding: var(--space-3);
                font-size: var(--text-sm);
              }
            }

            @media (max-width: 768px) {
              .page-nav {
                flex-direction: column;
                gap: var(--space-2);
              }

              .nav-button {
                flex: none;
              }

              .header-content {
                margin-bottom: var(--space-4);
              }

              .header-content h1 {
                font-size: var(--text-xl);
              }

              .header-content p {
                font-size: var(--text-base);
              }
            }

            /* Print styles */
            @media print {
              .page-header,
              .quick-actions {
                display: none;
              }

              .plugin-publish-page {
                grid-template-areas: "content";
                grid-template-columns: 1fr;
              }

              .page-content {
                padding: 0;
              }
            }
          `}</style>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default PluginPublishPage;
