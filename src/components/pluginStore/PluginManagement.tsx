import React, { useState, useCallback, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useAsyncState } from '../../hooks/useAsyncState';
import { Button } from '../ui/Button';
import { LoadingSpinner, ErrorMessage } from '../common';
import { useToast } from '../feedback/Toast';
import { PluginSubmission, PluginStoreStatus, PluginReviewNote } from '../../types/pluginStore';

interface PluginManagementProps {
  userRole?: 'admin' | 'developer';
  developerId?: string;
  className?: string;
}

export const PluginManagement: React.FC<PluginManagementProps> = ({
  userRole = 'developer',
  developerId,
  className = '',
}) => {
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'submissions' | 'reviews' | 'published'>(
    'submissions'
  );
  const [selectedSubmission, setSelectedSubmission] = useState<PluginSubmission | null>(null);
  const [filterStatus, setFilterStatus] = useState<PluginStoreStatus | 'all'>('all');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_changes'>(
    'approve'
  );

  // Mock data fetching functions
  const fetchSubmissions = useCallback(async (): Promise<PluginSubmission[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const baseSubmissions: PluginSubmission[] = [
      {
        id: 'sub-001',
        name: 'vpn-premium-v2',
        displayName: 'VPN Premium Manager v2',
        shortDescription: 'Enhanced VPN management with AI-powered optimization',
        description: 'Next generation VPN management plugin with advanced AI features.',
        version: '2.0.0',
        category: 'vpn',
        tags: ['vpn', 'ai', 'security', 'premium'],
        icon: '🔒',
        screenshots: ['https://example.com/screenshot1.png', 'https://example.com/screenshot2.png'],
        pricing: { type: 'freemium', price: 12.99, currency: 'USD' },
        repositoryUrl: 'https://github.com/dev/vpn-premium-v2',
        documentationUrl: 'https://docs.example.com/vpn-premium-v2',
        homepageUrl: 'https://vpnpremium.example.com',
        compatibility: {
          minPlatformVersion: '1.2.0',
          supportedDevices: ['mobile', 'desktop'],
          requiredFeatures: [],
          dependencies: [],
        },
        metadata: {
          license: 'MIT',
          changelog: [
            {
              version: '2.0.0',
              date: new Date('2024-01-15'),
              changes: [
                'Added AI-powered server selection',
                'Improved connection stability',
                'New dashboard design',
              ],
            },
          ],
        },
        status: 'pending',
        submittedAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        developerId: 'dev-001',
        reviewNotes: [],
      },
      {
        id: 'sub-002',
        name: 'streaming-analytics',
        displayName: 'Streaming Analytics Pro',
        shortDescription: 'Advanced analytics for streaming service usage',
        description: 'Comprehensive analytics and insights for streaming services.',
        version: '1.0.0',
        category: 'streaming',
        tags: ['streaming', 'analytics', 'insights'],
        icon: '📊',
        screenshots: [],
        pricing: { type: 'paid', price: 19.99, currency: 'USD' },
        repositoryUrl: 'https://github.com/dev/streaming-analytics',
        documentationUrl: '',
        homepageUrl: '',
        compatibility: {
          minPlatformVersion: '1.0.0',
          supportedDevices: ['mobile', 'desktop', 'tablet'],
          requiredFeatures: [],
          dependencies: [],
        },
        metadata: {
          license: 'Commercial',
          changelog: [],
        },
        status: 'under_review',
        submittedAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-12'),
        developerId: 'dev-002',
        reviewNotes: [
          {
            id: 'note-001',
            reviewerId: 'admin-001',
            reviewerName: 'Admin User',
            type: 'comment',
            message: 'Please provide more detailed documentation for the API endpoints.',
            createdAt: new Date('2024-01-12'),
          },
        ],
      },
      {
        id: 'sub-003',
        name: 'security-audit-tool',
        displayName: 'Security Audit Tool',
        shortDescription: 'Comprehensive security auditing for digital assets',
        description: 'Professional security auditing tool with detailed reporting.',
        version: '1.5.0',
        category: 'software',
        tags: ['security', 'audit', 'compliance'],
        icon: '🛡️',
        screenshots: [],
        pricing: { type: 'free' },
        repositoryUrl: 'https://github.com/security/audit-tool',
        documentationUrl: 'https://docs.security.com/audit-tool',
        homepageUrl: 'https://security.com/audit-tool',
        compatibility: {
          minPlatformVersion: '1.0.0',
          supportedDevices: ['desktop'],
          requiredFeatures: [],
          dependencies: [],
        },
        metadata: {
          license: 'Apache-2.0',
          changelog: [],
        },
        status: 'changes_requested',
        submittedAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-11'),
        developerId: 'dev-003',
        reviewNotes: [
          {
            id: 'note-002',
            reviewerId: 'admin-001',
            reviewerName: 'Admin User',
            type: 'change_request',
            message:
              'The plugin needs to implement proper sandboxing for security scans. Please add isolation mechanisms before resubmission.',
            createdAt: new Date('2024-01-11'),
          },
        ],
      },
      {
        id: 'sub-004',
        name: 'gaming-optimizer',
        displayName: 'Gaming Performance Optimizer',
        shortDescription: 'Optimize gaming accounts and performance',
        description: 'Advanced gaming optimization with performance monitoring.',
        version: '3.1.0',
        category: 'gaming',
        tags: ['gaming', 'optimization', 'performance'],
        icon: '🎮',
        screenshots: [],
        pricing: { type: 'freemium', price: 8.99, currency: 'USD' },
        repositoryUrl: 'https://github.com/gaming/optimizer',
        documentationUrl: '',
        homepageUrl: '',
        compatibility: {
          minPlatformVersion: '1.1.0',
          supportedDevices: ['mobile', 'desktop'],
          requiredFeatures: [],
          dependencies: [],
        },
        metadata: {
          license: 'MIT',
          changelog: [],
        },
        status: 'approved',
        submittedAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-09'),
        developerId: 'dev-004',
        reviewNotes: [
          {
            id: 'note-003',
            reviewerId: 'admin-001',
            reviewerName: 'Admin User',
            type: 'approval',
            message: 'Excellent plugin with comprehensive features. Approved for publication.',
            createdAt: new Date('2024-01-09'),
          },
        ],
      },
      {
        id: 'sub-005',
        name: 'malicious-plugin',
        displayName: 'Data Harvester',
        shortDescription: 'Harvest user data for marketing',
        description: 'Collect and analyze user data for targeted marketing.',
        version: '1.0.0',
        category: 'software',
        tags: ['data', 'marketing', 'analytics'],
        icon: '📈',
        screenshots: [],
        pricing: { type: 'free' },
        repositoryUrl: '',
        documentationUrl: '',
        homepageUrl: '',
        compatibility: {
          minPlatformVersion: '1.0.0',
          supportedDevices: ['mobile'],
          requiredFeatures: [],
          dependencies: [],
        },
        metadata: {
          license: 'Other',
          changelog: [],
        },
        status: 'rejected',
        submittedAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-06'),
        developerId: 'dev-005',
        reviewNotes: [
          {
            id: 'note-004',
            reviewerId: 'admin-001',
            reviewerName: 'Admin User',
            type: 'rejection',
            message:
              'This plugin violates our privacy policy by collecting user data without explicit consent. Rejected permanently.',
            createdAt: new Date('2024-01-06'),
          },
        ],
      },
    ];

    // Filter by developer if specified
    if (userRole === 'developer' && developerId) {
      return baseSubmissions.filter(sub => sub.developerId === developerId);
    }

    return baseSubmissions;
  }, [userRole, developerId]);

  const updateSubmissionStatus = useCallback(
    async (submissionId: string, status: PluginStoreStatus, note: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate status update
      console.log('Updating submission:', { submissionId, status, note });

      if (status === 'rejected' && submissionId === 'sub-005') {
        throw new Error('Cannot update status of rejected malicious plugin');
      }
    },
    []
  );

  const [submissionsState, { execute: loadSubmissions }] = useAsyncState(fetchSubmissions);
  const [updateState, { execute: executeUpdate }] = useAsyncState(updateSubmissionStatus);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const filteredSubmissions =
    submissionsState.data?.filter(
      submission => filterStatus === 'all' || submission.status === filterStatus
    ) || [];

  const getStatusColor = (status: PluginStoreStatus) => {
    switch (status) {
      case 'pending':
        return 'var(--color-warning)';
      case 'under_review':
        return 'var(--color-info)';
      case 'approved':
        return 'var(--color-success)';
      case 'published':
        return 'var(--color-primary)';
      case 'rejected':
        return 'var(--color-error)';
      case 'changes_requested':
        return 'var(--color-warning)';
      case 'draft':
        return 'var(--color-text-secondary)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const getStatusLabel = (status: PluginStoreStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'under_review':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'published':
        return 'Published';
      case 'rejected':
        return 'Rejected';
      case 'changes_requested':
        return 'Changes Requested';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedSubmission || !reviewNote.trim()) {
      showToast('Please enter a review note', 'error');
      return;
    }

    const newStatus =
      reviewAction === 'approve'
        ? 'approved'
        : reviewAction === 'reject'
          ? 'rejected'
          : 'changes_requested';

    try {
      await executeUpdate(selectedSubmission.id, newStatus, reviewNote.trim());
      showToast(`Submission ${reviewAction}d successfully`, 'success');
      setSelectedSubmission(null);
      setReviewNote('');
      loadSubmissions(); // Refresh the list
    } catch (error) {
      showToast(`Failed to ${reviewAction} submission`, 'error');
    }
  };

  const renderSubmissionsList = () => (
    <div className="submissions-list">
      <div className="list-header">
        <h3>
          {userRole === 'admin' ? 'All Submissions' : 'My Submissions'}({filteredSubmissions.length}
          )
        </h3>

        <div className="list-filters">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as PluginStoreStatus | 'all')}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h4>No submissions found</h4>
          <p>
            {filterStatus === 'all'
              ? 'No plugin submissions yet.'
              : `No submissions with status "${getStatusLabel(filterStatus)}"`}
          </p>
        </div>
      ) : (
        <div className="submissions-grid">
          {filteredSubmissions.map(submission => (
            <div
              key={submission.id}
              className="submission-card"
              onClick={() => setSelectedSubmission(submission)}
            >
              <div className="submission-header">
                <div className="submission-icon">{submission.icon}</div>
                <div className="submission-info">
                  <h4>{submission.displayName}</h4>
                  <p className="submission-version">v{submission.version}</p>
                </div>
                <div
                  className="submission-status"
                  style={{ color: getStatusColor(submission.status) }}
                >
                  {getStatusLabel(submission.status)}
                </div>
              </div>

              <p className="submission-description">{submission.shortDescription}</p>

              <div className="submission-meta">
                <div className="meta-item">
                  <span className="meta-label">Submitted:</span>
                  <span className="meta-value">{submission.submittedAt.toLocaleDateString()}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Category:</span>
                  <span className="meta-value">{submission.category}</span>
                </div>
                {submission.pricing.type !== 'free' && (
                  <div className="meta-item">
                    <span className="meta-label">Price:</span>
                    <span className="meta-value">
                      {submission.pricing.type === 'freemium'
                        ? 'Freemium'
                        : `$${submission.pricing.price}`}
                    </span>
                  </div>
                )}
              </div>

              {submission.reviewNotes.length > 0 && (
                <div className="latest-review">
                  <strong>Latest Review:</strong>
                  <p>{submission.reviewNotes[submission.reviewNotes.length - 1].message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSubmissionDetails = () => {
    if (!selectedSubmission) return null;

    return (
      <div className="submission-details">
        <div className="details-header">
          <Button
            variant="ghost"
            onClick={() => setSelectedSubmission(null)}
            className="back-button"
          >
            ← Back to List
          </Button>
          <h3>{selectedSubmission.displayName}</h3>
        </div>

        <div className="details-content">
          <div className="details-section">
            <h4>Plugin Information</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{selectedSubmission.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Version:</span>
                <span className="detail-value">{selectedSubmission.version}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{selectedSubmission.category}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span
                  className="detail-value status-badge"
                  style={{ color: getStatusColor(selectedSubmission.status) }}
                >
                  {getStatusLabel(selectedSubmission.status)}
                </span>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h4>Description</h4>
            <p className="description-text">{selectedSubmission.description}</p>
          </div>

          <div className="details-section">
            <h4>Tags</h4>
            <div className="tags-list">
              {selectedSubmission.tags.map(tag => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {selectedSubmission.screenshots.length > 0 && (
            <div className="details-section">
              <h4>Screenshots</h4>
              <div className="screenshots-list">
                {selectedSubmission.screenshots.map((url, index) => (
                  <div key={index} className="screenshot-item">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      Screenshot {index + 1}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="details-section">
            <h4>Links</h4>
            <div className="links-list">
              {selectedSubmission.repositoryUrl && (
                <a
                  href={selectedSubmission.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Repository
                </a>
              )}
              {selectedSubmission.documentationUrl && (
                <a
                  href={selectedSubmission.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Documentation
                </a>
              )}
              {selectedSubmission.homepageUrl && (
                <a href={selectedSubmission.homepageUrl} target="_blank" rel="noopener noreferrer">
                  Homepage
                </a>
              )}
            </div>
          </div>

          <div className="details-section">
            <h4>Review History</h4>
            {selectedSubmission.reviewNotes.length === 0 ? (
              <p className="no-reviews">No review notes yet.</p>
            ) : (
              <div className="review-notes">
                {selectedSubmission.reviewNotes.map(note => (
                  <div key={note.id} className="review-note">
                    <div className="note-header">
                      <strong>{note.reviewerName}</strong>
                      <span className="note-date">{note.createdAt.toLocaleDateString()}</span>
                      <span className={`note-type ${note.type}`}>
                        {note.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="note-message">{note.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {userRole === 'admin' &&
            selectedSubmission.status !== 'published' &&
            selectedSubmission.status !== 'rejected' && (
              <div className="details-section">
                <h4>Review Action</h4>
                <div className="review-form">
                  <div className="review-actions">
                    <label className="action-option">
                      <input
                        type="radio"
                        name="reviewAction"
                        value="approve"
                        checked={reviewAction === 'approve'}
                        onChange={e => setReviewAction(e.target.value as any)}
                      />
                      <span>Approve</span>
                    </label>
                    <label className="action-option">
                      <input
                        type="radio"
                        name="reviewAction"
                        value="request_changes"
                        checked={reviewAction === 'request_changes'}
                        onChange={e => setReviewAction(e.target.value as any)}
                      />
                      <span>Request Changes</span>
                    </label>
                    <label className="action-option">
                      <input
                        type="radio"
                        name="reviewAction"
                        value="reject"
                        checked={reviewAction === 'reject'}
                        onChange={e => setReviewAction(e.target.value as any)}
                      />
                      <span>Reject</span>
                    </label>
                  </div>

                  <textarea
                    value={reviewNote}
                    onChange={e => setReviewNote(e.target.value)}
                    placeholder="Enter review notes..."
                    className="review-textarea"
                    rows={4}
                  />

                  <Button
                    variant="primary"
                    onClick={handleReviewSubmit}
                    disabled={updateState.loading || !reviewNote.trim()}
                    className="review-submit-button"
                  >
                    {updateState.loading ? (
                      <>
                        <LoadingSpinner size="small" />
                        Processing...
                      </>
                    ) : (
                      `${reviewAction.charAt(0).toUpperCase() + reviewAction.slice(1).replace('_', ' ')} Submission`
                    )}
                  </Button>
                </div>
              </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className={`plugin-management ${className}`}>
      <div className="management-header">
        <h2>{userRole === 'admin' ? 'Plugin Review Dashboard' : 'Plugin Submissions'}</h2>

        {userRole === 'admin' && (
          <div className="management-tabs">
            <button
              className={`tab ${activeTab === 'submissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('submissions')}
            >
              Submissions
            </button>
            <button
              className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
            <button
              className={`tab ${activeTab === 'published' ? 'active' : ''}`}
              onClick={() => setActiveTab('published')}
            >
              Published
            </button>
          </div>
        )}
      </div>

      <div className="management-content">
        {submissionsState.loading ? (
          <div className="loading-container">
            <LoadingSpinner size="large" />
            <p>Loading submissions...</p>
          </div>
        ) : submissionsState.error ? (
          <ErrorMessage
            title="Failed to load submissions"
            message={submissionsState.error.message}
            actions={[{ label: 'Retry', onClick: loadSubmissions, variant: 'primary' }]}
          />
        ) : selectedSubmission ? (
          renderSubmissionDetails()
        ) : (
          renderSubmissionsList()
        )}
      </div>

      <style>{`
        .plugin-management {
          font-family: var(--font-family-base);
          background: var(--color-background);
          color: var(--color-text-primary);
          min-height: 100vh;
        }

        .management-header {
          background: var(--color-card-background);
          border-bottom: 1px solid var(--color-border);
          padding: var(--space-6);
        }

        .management-header h2 {
          margin: 0 0 var(--space-4) 0;
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .management-tabs {
          display: flex;
          gap: var(--space-1);
        }

        .tab {
          padding: var(--space-3) var(--space-5);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-background);
          color: var(--color-text-secondary);
          font-size: var(--text-sm);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab:hover {
          background: var(--color-hover);
          color: var(--color-text-primary);
        }

        .tab.active {
          background: var(--color-primary);
          color: var(--color-primary-contrast);
          border-color: var(--color-primary);
        }

        .management-content {
          padding: var(--space-6);
          max-width: 1400px;
          margin: 0 auto;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-4);
          padding: var(--space-12);
          color: var(--color-text-secondary);
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
          gap: var(--space-4);
        }

        .list-header h3 {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .filter-select {
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          color: var(--color-text-primary);
          background: var(--color-background);
          min-width: 150px;
        }

        .filter-select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-light);
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
          font-size: 4rem;
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

        .submissions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: var(--space-5);
        }

        .submission-card {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submission-card:hover {
          border-color: var(--color-primary-light);
          box-shadow: var(--shadow-md);
        }

        .submission-header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }

        .submission-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .submission-info {
          flex: 1;
          min-width: 0;
        }

        .submission-info h4 {
          margin: 0 0 var(--space-1) 0;
          font-size: var(--text-base);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          word-break: break-word;
        }

        .submission-version {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .submission-status {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
          flex-shrink: 0;
        }

        .submission-description {
          margin: 0 0 var(--space-3) 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: var(--leading-normal);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .submission-meta {
          display: flex;
          gap: var(--space-4);
          margin-bottom: var(--space-3);
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          gap: var(--space-1);
          font-size: var(--text-xs);
        }

        .meta-label {
          color: var(--color-text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .meta-value {
          color: var(--color-text-primary);
        }

        .latest-review {
          background: var(--color-muted);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          font-size: var(--text-sm);
        }

        .latest-review strong {
          color: var(--color-text-primary);
        }

        .latest-review p {
          margin: var(--space-1) 0 0 0;
          color: var(--color-text-secondary);
          line-height: var(--leading-normal);
        }

        .submission-details {
          background: var(--color-card-background);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .details-header {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-5);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-muted);
        }

        .details-header h3 {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .details-content {
          padding: var(--space-5);
        }

        .details-section {
          margin-bottom: var(--space-6);
        }

        .details-section:last-child {
          margin-bottom: 0;
        }

        .details-section h4 {
          margin: 0 0 var(--space-3) 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-3);
        }

        .detail-item {
          display: flex;
          gap: var(--space-2);
        }

        .detail-label {
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
          min-width: 80px;
        }

        .detail-value {
          color: var(--color-text-primary);
        }

        .status-badge {
          font-weight: var(--font-weight-bold);
        }

        .description-text {
          margin: 0;
          line-height: var(--leading-normal);
          color: var(--color-text-primary);
          white-space: pre-wrap;
        }

        .tags-list {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .tag {
          background: var(--color-primary-light);
          color: var(--color-primary);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
        }

        .screenshots-list,
        .links-list {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .screenshot-item a,
        .links-list a {
          color: var(--color-primary);
          text-decoration: none;
          font-size: var(--text-sm);
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--color-primary);
          border-radius: var(--radius-md);
          transition: all 0.2s ease;
        }

        .screenshot-item a:hover,
        .links-list a:hover {
          background: var(--color-primary);
          color: var(--color-primary-contrast);
        }

        .no-reviews {
          margin: 0;
          color: var(--color-text-secondary);
          font-style: italic;
        }

        .review-notes {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .review-note {
          background: var(--color-muted);
          border-radius: var(--radius-md);
          padding: var(--space-4);
        }

        .note-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-2);
        }

        .note-header strong {
          color: var(--color-text-primary);
        }

        .note-date {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .note-type {
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          font-weight: var(--font-weight-medium);
          text-transform: capitalize;
        }

        .note-type.approval {
          background: var(--color-success-light);
          color: var(--color-success);
        }

        .note-type.rejection {
          background: var(--color-error-light);
          color: var(--color-error);
        }

        .note-type.change_request {
          background: var(--color-warning-light);
          color: var(--color-warning);
        }

        .note-type.comment {
          background: var(--color-info-light);
          color: var(--color-info);
        }

        .note-message {
          margin: 0;
          line-height: var(--leading-normal);
          color: var(--color-text-primary);
        }

        .review-form {
          background: var(--color-muted);
          border-radius: var(--radius-md);
          padding: var(--space-4);
        }

        .review-actions {
          display: flex;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
        }

        .action-option {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
        }

        .action-option input[type="radio"] {
          margin: 0;
        }

        .review-textarea {
          width: 100%;
          padding: var(--space-3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          color: var(--color-text-primary);
          background: var(--color-background);
          resize: vertical;
          margin-bottom: var(--space-4);
        }

        .review-textarea:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-light);
        }

        .review-submit-button {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .management-header,
          .management-content {
            padding: var(--space-4);
          }

          .list-header {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-3);
          }

          .submissions-grid {
            grid-template-columns: 1fr;
          }

          .submission-meta {
            flex-direction: column;
            gap: var(--space-2);
          }

          .details-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-3);
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .detail-item {
            flex-direction: column;
            gap: var(--space-1);
          }

          .detail-label {
            min-width: auto;
          }

          .review-actions {
            flex-direction: column;
            gap: var(--space-2);
          }

          .screenshots-list,
          .links-list {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default PluginManagement;
