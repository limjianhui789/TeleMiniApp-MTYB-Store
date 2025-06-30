import React, { useState, useCallback } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useAsyncState } from '../../hooks/useAsyncState';
import { Button } from '../ui/Button';
import { LoadingSpinner, ErrorMessage } from '../common';
import { useToast } from '../feedback/Toast';
import {
  PluginSubmission,
  PluginStoreStatus,
  PluginCategory,
  PluginPricing,
} from '../../types/pluginStore';

interface PluginSubmissionFormProps {
  onSubmit?: (submission: PluginSubmission) => void;
  onCancel?: () => void;
  existingSubmission?: PluginSubmission;
  className?: string;
}

export const PluginSubmissionForm: React.FC<PluginSubmissionFormProps> = ({
  onSubmit,
  onCancel,
  existingSubmission,
  className = '',
}) => {
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<Partial<PluginSubmission>>({
    name: existingSubmission?.name || '',
    displayName: existingSubmission?.displayName || '',
    shortDescription: existingSubmission?.shortDescription || '',
    description: existingSubmission?.description || '',
    version: existingSubmission?.version || '1.0.0',
    category: existingSubmission?.category || undefined,
    tags: existingSubmission?.tags || [],
    icon: existingSubmission?.icon || '',
    screenshots: existingSubmission?.screenshots || [],
    pricing: existingSubmission?.pricing || { type: 'free' },
    repositoryUrl: existingSubmission?.repositoryUrl || '',
    documentationUrl: existingSubmission?.documentationUrl || '',
    homepageUrl: existingSubmission?.homepageUrl || '',
    compatibility: existingSubmission?.compatibility || {
      minPlatformVersion: '1.0.0',
      supportedDevices: ['mobile'],
      requiredFeatures: [],
      dependencies: [],
    },
    metadata: existingSubmission?.metadata || {
      license: 'MIT',
      changelog: [],
    },
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { id: 'basic', title: 'Basic Information', description: 'Plugin name, description, and icon' },
    { id: 'details', title: 'Plugin Details', description: 'Category, tags, and pricing' },
    { id: 'technical', title: 'Technical Info', description: 'Compatibility and dependencies' },
    { id: 'media', title: 'Media & Links', description: 'Screenshots and documentation' },
    { id: 'review', title: 'Review & Submit', description: 'Review all information' },
  ];

  // Mock functions
  const fetchCategories = useCallback(async (): Promise<PluginCategory[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: 'vpn',
        name: 'VPN Services',
        slug: 'vpn',
        description: 'VPN account management plugins',
        icon: '🔒',
        pluginCount: 23,
        featured: true,
        order: 1,
      },
      {
        id: 'streaming',
        name: 'Streaming',
        slug: 'streaming',
        description: 'Streaming service plugins',
        icon: '📺',
        pluginCount: 18,
        featured: true,
        order: 2,
      },
      {
        id: 'gaming',
        name: 'Gaming',
        slug: 'gaming',
        description: 'Gaming and digital game plugins',
        icon: '🎮',
        pluginCount: 31,
        featured: true,
        order: 3,
      },
      {
        id: 'software',
        name: 'Software',
        slug: 'software',
        description: 'Software license plugins',
        icon: '💻',
        pluginCount: 27,
        featured: true,
        order: 4,
      },
    ];
  }, []);

  const submitPlugin = useCallback(
    async (data: Partial<PluginSubmission>): Promise<PluginSubmission> => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const submission: PluginSubmission = {
        id: existingSubmission?.id || `submission-${Date.now()}`,
        ...(data as Omit<
          PluginSubmission,
          'id' | 'status' | 'submittedAt' | 'updatedAt' | 'developerId' | 'reviewNotes'
        >),
        status: 'pending',
        submittedAt: new Date(),
        updatedAt: new Date(),
        developerId: 'current-user',
        reviewNotes: [],
      };

      return submission;
    },
    [existingSubmission]
  );

  const [categoriesState, { execute: loadCategories }] = useAsyncState(fetchCategories);
  const [submitState, { execute: executeSubmit }] = useAsyncState(submitPlugin);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = 'Plugin name is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.name)) {
      errors.name = 'Plugin name must contain only lowercase letters, numbers, and hyphens';
    }

    if (!formData.displayName?.trim()) {
      errors.displayName = 'Display name is required';
    }

    if (!formData.shortDescription?.trim()) {
      errors.shortDescription = 'Short description is required';
    } else if (formData.shortDescription.length > 100) {
      errors.shortDescription = 'Short description must be 100 characters or less';
    }

    if (!formData.description?.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 100) {
      errors.description = 'Description must be at least 100 characters';
    }

    if (!formData.version?.trim()) {
      errors.version = 'Version is required';
    } else if (!/^\d+\.\d+\.\d+$/.test(formData.version)) {
      errors.version = 'Version must follow semantic versioning (e.g., 1.0.0)';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    if (!formData.tags?.length) {
      errors.tags = 'At least one tag is required';
    }

    if (
      formData.pricing?.type === 'paid' &&
      (!formData.pricing.price || formData.pricing.price <= 0)
    ) {
      errors.pricing = 'Price is required for paid plugins';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag.trim() && !formData.tags?.includes(tag.trim())) {
      handleInputChange('tags', [...(formData.tags || []), tag.trim()]);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  const handleScreenshotAdd = (url: string) => {
    if (url.trim() && !formData.screenshots?.includes(url.trim())) {
      handleInputChange('screenshots', [...(formData.screenshots || []), url.trim()]);
    }
  };

  const handleScreenshotRemove = (urlToRemove: string) => {
    handleInputChange(
      'screenshots',
      formData.screenshots?.filter(url => url !== urlToRemove) || []
    );
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Please fix the validation errors', 'error');
      return;
    }

    try {
      const submission = await executeSubmit(formData);
      showToast('Plugin submitted successfully!', 'success');
      onSubmit?.(submission);
    } catch (error) {
      showToast('Failed to submit plugin', 'error');
    }
  };

  const renderBasicInfo = () => (
    <div className="form-section">
      <h3>Basic Information</h3>

      <div className="form-group">
        <label htmlFor="name">Plugin Name *</label>
        <input
          type="text"
          id="name"
          value={formData.name || ''}
          onChange={e => handleInputChange('name', e.target.value)}
          placeholder="my-awesome-plugin"
          className={`form-input ${validationErrors.name ? 'error' : ''}`}
        />
        {validationErrors.name && <span className="error-text">{validationErrors.name}</span>}
        <small>Unique identifier for your plugin (lowercase, hyphens allowed)</small>
      </div>

      <div className="form-group">
        <label htmlFor="displayName">Display Name *</label>
        <input
          type="text"
          id="displayName"
          value={formData.displayName || ''}
          onChange={e => handleInputChange('displayName', e.target.value)}
          placeholder="My Awesome Plugin"
          className={`form-input ${validationErrors.displayName ? 'error' : ''}`}
        />
        {validationErrors.displayName && (
          <span className="error-text">{validationErrors.displayName}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="icon">Icon (Emoji)</label>
        <input
          type="text"
          id="icon"
          value={formData.icon || ''}
          onChange={e => handleInputChange('icon', e.target.value)}
          placeholder="🚀"
          className="form-input"
          maxLength={2}
        />
        <small>Single emoji to represent your plugin</small>
      </div>

      <div className="form-group">
        <label htmlFor="shortDescription">Short Description *</label>
        <input
          type="text"
          id="shortDescription"
          value={formData.shortDescription || ''}
          onChange={e => handleInputChange('shortDescription', e.target.value)}
          placeholder="Brief description of your plugin"
          className={`form-input ${validationErrors.shortDescription ? 'error' : ''}`}
          maxLength={100}
        />
        {validationErrors.shortDescription && (
          <span className="error-text">{validationErrors.shortDescription}</span>
        )}
        <small>{formData.shortDescription?.length || 0}/100 characters</small>
      </div>

      <div className="form-group">
        <label htmlFor="description">Full Description *</label>
        <textarea
          id="description"
          value={formData.description || ''}
          onChange={e => handleInputChange('description', e.target.value)}
          placeholder="Detailed description of your plugin features and benefits..."
          className={`form-textarea ${validationErrors.description ? 'error' : ''}`}
          rows={8}
        />
        {validationErrors.description && (
          <span className="error-text">{validationErrors.description}</span>
        )}
        <small>Supports Markdown formatting. Minimum 100 characters.</small>
      </div>

      <div className="form-group">
        <label htmlFor="version">Version *</label>
        <input
          type="text"
          id="version"
          value={formData.version || ''}
          onChange={e => handleInputChange('version', e.target.value)}
          placeholder="1.0.0"
          className={`form-input ${validationErrors.version ? 'error' : ''}`}
        />
        {validationErrors.version && <span className="error-text">{validationErrors.version}</span>}
        <small>Semantic versioning (major.minor.patch)</small>
      </div>
    </div>
  );

  const renderDetails = () => (
    <div className="form-section">
      <h3>Plugin Details</h3>

      <div className="form-group">
        <label htmlFor="category">Category *</label>
        <select
          id="category"
          value={formData.category || ''}
          onChange={e => handleInputChange('category', e.target.value)}
          className={`form-select ${validationErrors.category ? 'error' : ''}`}
        >
          <option value="">Select a category</option>
          {categoriesState.data?.map(category => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
        {validationErrors.category && (
          <span className="error-text">{validationErrors.category}</span>
        )}
      </div>

      <div className="form-group">
        <label>Tags *</label>
        <div className="tags-input">
          <div className="tags-list">
            {formData.tags?.map(tag => (
              <span key={tag} className="tag">
                {tag}
                <button onClick={() => handleTagRemove(tag)}>×</button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add a tag and press Enter"
            onKeyPress={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleTagAdd(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
            className="tag-input"
          />
        </div>
        {validationErrors.tags && <span className="error-text">{validationErrors.tags}</span>}
        <small>Press Enter to add tags. Examples: vpn, security, automation</small>
      </div>

      <div className="form-group">
        <label>Pricing Model</label>
        <div className="pricing-options">
          <label className="radio-option">
            <input
              type="radio"
              name="pricingType"
              value="free"
              checked={formData.pricing?.type === 'free'}
              onChange={() => handleInputChange('pricing', { type: 'free' })}
            />
            <span>Free</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="pricingType"
              value="freemium"
              checked={formData.pricing?.type === 'freemium'}
              onChange={() =>
                handleInputChange('pricing', { type: 'freemium', price: 0, currency: 'USD' })
              }
            />
            <span>Freemium</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="pricingType"
              value="paid"
              checked={formData.pricing?.type === 'paid'}
              onChange={() =>
                handleInputChange('pricing', { type: 'paid', price: 0, currency: 'USD' })
              }
            />
            <span>Paid</span>
          </label>
        </div>

        {(formData.pricing?.type === 'paid' || formData.pricing?.type === 'freemium') && (
          <div className="price-input">
            <label htmlFor="price">Price (USD) *</label>
            <input
              type="number"
              id="price"
              min="0"
              step="0.01"
              value={formData.pricing?.price || ''}
              onChange={e =>
                handleInputChange('pricing', {
                  ...formData.pricing,
                  price: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="9.99"
              className={`form-input ${validationErrors.pricing ? 'error' : ''}`}
            />
            {validationErrors.pricing && (
              <span className="error-text">{validationErrors.pricing}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderTechnical = () => (
    <div className="form-section">
      <h3>Technical Information</h3>

      <div className="form-group">
        <label>Supported Devices</label>
        <div className="checkbox-group">
          {['mobile', 'desktop', 'tablet'].map(device => (
            <label key={device} className="checkbox-option">
              <input
                type="checkbox"
                checked={formData.compatibility?.supportedDevices?.includes(device) || false}
                onChange={e => {
                  const devices = formData.compatibility?.supportedDevices || [];
                  const updatedDevices = e.target.checked
                    ? [...devices, device]
                    : devices.filter(d => d !== device);
                  handleInputChange('compatibility', {
                    ...formData.compatibility,
                    supportedDevices: updatedDevices,
                  });
                }}
              />
              <span>{device.charAt(0).toUpperCase() + device.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="minPlatformVersion">Minimum Platform Version</label>
        <input
          type="text"
          id="minPlatformVersion"
          value={formData.compatibility?.minPlatformVersion || ''}
          onChange={e =>
            handleInputChange('compatibility', {
              ...formData.compatibility,
              minPlatformVersion: e.target.value,
            })
          }
          placeholder="1.0.0"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="license">License</label>
        <select
          id="license"
          value={formData.metadata?.license || 'MIT'}
          onChange={e =>
            handleInputChange('metadata', {
              ...formData.metadata,
              license: e.target.value,
            })
          }
          className="form-select"
        >
          <option value="MIT">MIT License</option>
          <option value="Apache-2.0">Apache 2.0</option>
          <option value="GPL-3.0">GPL 3.0</option>
          <option value="BSD-3-Clause">BSD 3-Clause</option>
          <option value="Commercial">Commercial</option>
          <option value="Other">Other</option>
        </select>
      </div>
    </div>
  );

  const renderMedia = () => (
    <div className="form-section">
      <h3>Media & Links</h3>

      <div className="form-group">
        <label>Screenshots</label>
        <div className="screenshots-input">
          <div className="screenshots-list">
            {formData.screenshots?.map((url, index) => (
              <div key={index} className="screenshot-item">
                <span className="screenshot-url">{url}</span>
                <button onClick={() => handleScreenshotRemove(url)}>×</button>
              </div>
            ))}
          </div>
          <input
            type="url"
            placeholder="Add screenshot URL and press Enter"
            onKeyPress={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleScreenshotAdd(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
            className="screenshot-input"
          />
        </div>
        <small>Add URLs to plugin screenshots. Press Enter to add.</small>
      </div>

      <div className="form-group">
        <label htmlFor="repositoryUrl">Repository URL</label>
        <input
          type="url"
          id="repositoryUrl"
          value={formData.repositoryUrl || ''}
          onChange={e => handleInputChange('repositoryUrl', e.target.value)}
          placeholder="https://github.com/username/plugin-name"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="documentationUrl">Documentation URL</label>
        <input
          type="url"
          id="documentationUrl"
          value={formData.documentationUrl || ''}
          onChange={e => handleInputChange('documentationUrl', e.target.value)}
          placeholder="https://docs.example.com"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="homepageUrl">Homepage URL</label>
        <input
          type="url"
          id="homepageUrl"
          value={formData.homepageUrl || ''}
          onChange={e => handleInputChange('homepageUrl', e.target.value)}
          placeholder="https://example.com"
          className="form-input"
        />
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="form-section">
      <h3>Review & Submit</h3>

      <div className="review-summary">
        <div className="summary-section">
          <h4>Plugin Information</h4>
          <div className="summary-item">
            <span className="label">Name:</span>
            <span className="value">{formData.displayName}</span>
          </div>
          <div className="summary-item">
            <span className="label">Category:</span>
            <span className="value">
              {categoriesState.data?.find(c => c.id === formData.category)?.name ||
                formData.category}
            </span>
          </div>
          <div className="summary-item">
            <span className="label">Version:</span>
            <span className="value">{formData.version}</span>
          </div>
          <div className="summary-item">
            <span className="label">Pricing:</span>
            <span className="value">
              {formData.pricing?.type === 'free' && 'Free'}
              {formData.pricing?.type === 'freemium' && 'Freemium'}
              {formData.pricing?.type === 'paid' && `$${formData.pricing.price}`}
            </span>
          </div>
        </div>

        <div className="summary-section">
          <h4>Description</h4>
          <p className="description-preview">{formData.shortDescription}</p>
        </div>

        <div className="summary-section">
          <h4>Tags</h4>
          <div className="tags-preview">
            {formData.tags?.map(tag => (
              <span key={tag} className="tag-preview">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {formData.screenshots?.length > 0 && (
          <div className="summary-section">
            <h4>Screenshots</h4>
            <div className="screenshots-preview">
              {formData.screenshots.slice(0, 3).map((url, index) => (
                <div key={index} className="screenshot-preview">
                  {url}
                </div>
              ))}
              {formData.screenshots.length > 3 && (
                <div className="screenshot-count">+{formData.screenshots.length - 3} more</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="submission-notice">
        <h4>📋 Submission Process</h4>
        <ul>
          <li>Your plugin will be reviewed by our team within 3-5 business days</li>
          <li>You'll receive email notifications about the review status</li>
          <li>If approved, your plugin will be published to the store</li>
          <li>If changes are needed, you'll receive detailed feedback</li>
        </ul>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderDetails();
      case 2:
        return renderTechnical();
      case 3:
        return renderMedia();
      case 4:
        return renderReview();
      default:
        return null;
    }
  };

  return (
    <div className={`plugin-submission-form ${className}`}>
      {/* Progress Steps */}
      <div className="form-header">
        <h2>{existingSubmission ? 'Update Plugin' : 'Submit New Plugin'}</h2>
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="form-content">
        {categoriesState.loading ? (
          <div className="loading-container">
            <LoadingSpinner size="medium" />
            <p>Loading form data...</p>
          </div>
        ) : categoriesState.error ? (
          <ErrorMessage
            title="Failed to load form data"
            message={categoriesState.error.message}
            actions={[{ label: 'Retry', onClick: loadCategories, variant: 'primary' }]}
          />
        ) : (
          renderStepContent()
        )}
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <div className="action-buttons">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}

          {currentStep > 0 && (
            <Button variant="secondary" onClick={handlePrevious}>
              Previous
            </Button>
          )}

          {currentStep < steps.length - 1 ? (
            <Button variant="primary" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} disabled={submitState.loading}>
              {submitState.loading ? (
                <>
                  <LoadingSpinner size="small" />
                  Submitting...
                </>
              ) : existingSubmission ? (
                'Update Plugin'
              ) : (
                'Submit Plugin'
              )}
            </Button>
          )}
        </div>
      </div>

      <style>{`
        .plugin-submission-form {
          max-width: 800px;
          margin: 0 auto;
          background: var(--color-card-background);
          border-radius: var(--radius-lg);
          overflow: hidden;
          font-family: var(--font-family-base);
        }

        .form-header {
          padding: var(--space-6);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-muted);
        }

        .form-header h2 {
          margin: 0 0 var(--space-6) 0;
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          text-align: center;
        }

        .progress-steps {
          display: flex;
          gap: var(--space-2);
          overflow-x: auto;
          padding-bottom: var(--space-2);
        }

        .step {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          min-width: 200px;
          transition: all 0.2s ease;
        }

        .step.active {
          background: var(--color-primary-light);
          color: var(--color-primary);
        }

        .step.completed {
          background: var(--color-success-light);
          color: var(--color-success);
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-border);
          color: var(--color-text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-weight-bold);
          font-size: var(--text-sm);
          flex-shrink: 0;
        }

        .step.active .step-number {
          background: var(--color-primary);
          color: var(--color-primary-contrast);
        }

        .step.completed .step-number {
          background: var(--color-success);
          color: var(--color-success-contrast);
        }

        .step-info {
          flex: 1;
          min-width: 0;
        }

        .step-title {
          font-weight: var(--font-weight-semibold);
          font-size: var(--text-sm);
          margin-bottom: var(--space-1);
        }

        .step-description {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          line-height: var(--leading-tight);
        }

        .form-content {
          padding: var(--space-6);
          min-height: 400px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-4);
          padding: var(--space-8);
          color: var(--color-text-secondary);
        }

        .form-section h3 {
          margin: 0 0 var(--space-6) 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .form-group {
          margin-bottom: var(--space-5);
        }

        .form-group label {
          display: block;
          margin-bottom: var(--space-2);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .form-input,
        .form-textarea,
        .form-select {
          width: 100%;
          padding: var(--space-3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          color: var(--color-text-primary);
          background: var(--color-background);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-light);
        }

        .form-input.error,
        .form-textarea.error,
        .form-select.error {
          border-color: var(--color-error);
        }

        .form-textarea {
          resize: vertical;
          min-height: 120px;
        }

        .error-text {
          display: block;
          margin-top: var(--space-1);
          font-size: var(--text-sm);
          color: var(--color-error);
        }

        .form-group small {
          display: block;
          margin-top: var(--space-1);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .tags-input {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-2);
          background: var(--color-background);
        }

        .tags-list {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
          margin-bottom: var(--space-2);
        }

        .tag {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          background: var(--color-primary-light);
          color: var(--color-primary);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          font-size: var(--text-sm);
        }

        .tag button {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: var(--text-sm);
          padding: 0;
        }

        .tag-input {
          width: 100%;
          border: none;
          outline: none;
          padding: var(--space-2);
          font-size: var(--text-base);
          background: transparent;
          color: var(--color-text-primary);
        }

        .pricing-options {
          display: flex;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
        }

        .radio-option {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
        }

        .radio-option input[type="radio"] {
          margin: 0;
        }

        .price-input {
          margin-top: var(--space-3);
        }

        .checkbox-group {
          display: flex;
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .checkbox-option {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
        }

        .checkbox-option input[type="checkbox"] {
          margin: 0;
        }

        .screenshots-input {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-2);
          background: var(--color-background);
        }

        .screenshots-list {
          margin-bottom: var(--space-2);
        }

        .screenshot-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-2);
          padding: var(--space-2);
          background: var(--color-muted);
          border-radius: var(--radius-sm);
          margin-bottom: var(--space-2);
        }

        .screenshot-url {
          flex: 1;
          font-size: var(--text-sm);
          color: var(--color-text-primary);
          word-break: break-all;
        }

        .screenshot-item button {
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          font-size: var(--text-lg);
          padding: 0;
        }

        .screenshot-input {
          width: 100%;
          border: none;
          outline: none;
          padding: var(--space-2);
          font-size: var(--text-base);
          background: transparent;
          color: var(--color-text-primary);
        }

        .review-summary {
          background: var(--color-muted);
          border-radius: var(--radius-md);
          padding: var(--space-5);
          margin-bottom: var(--space-6);
        }

        .summary-section {
          margin-bottom: var(--space-5);
        }

        .summary-section:last-child {
          margin-bottom: 0;
        }

        .summary-section h4 {
          margin: 0 0 var(--space-3) 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .summary-item {
          display: flex;
          gap: var(--space-2);
          margin-bottom: var(--space-2);
        }

        .summary-item .label {
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
          min-width: 80px;
        }

        .summary-item .value {
          color: var(--color-text-primary);
        }

        .description-preview {
          margin: 0;
          font-size: var(--text-base);
          color: var(--color-text-primary);
          line-height: var(--leading-normal);
        }

        .tags-preview {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .tag-preview {
          background: var(--color-primary-light);
          color: var(--color-primary);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          font-size: var(--text-sm);
        }

        .screenshots-preview {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .screenshot-preview {
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: var(--space-2);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          word-break: break-all;
          max-width: 200px;
        }

        .screenshot-count {
          background: var(--color-text-secondary);
          color: var(--color-background);
          padding: var(--space-2);
          border-radius: var(--radius-sm);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
        }

        .submission-notice {
          background: var(--color-info-light);
          border: 1px solid var(--color-info);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          color: var(--color-info);
        }

        .submission-notice h4 {
          margin: 0 0 var(--space-3) 0;
          font-size: var(--text-base);
          font-weight: var(--font-weight-semibold);
        }

        .submission-notice ul {
          margin: 0;
          padding-left: var(--space-5);
        }

        .submission-notice li {
          margin-bottom: var(--space-2);
          line-height: var(--leading-normal);
        }

        .form-actions {
          padding: var(--space-6);
          border-top: 1px solid var(--color-border);
          background: var(--color-muted);
        }

        .action-buttons {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-3);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .plugin-submission-form {
            margin: 0;
            border-radius: 0;
          }

          .form-header,
          .form-content,
          .form-actions {
            padding: var(--space-4);
          }

          .progress-steps {
            flex-direction: column;
            gap: var(--space-2);
          }

          .step {
            min-width: auto;
          }

          .pricing-options {
            flex-direction: column;
            gap: var(--space-2);
          }

          .checkbox-group {
            flex-direction: column;
            gap: var(--space-2);
          }

          .action-buttons {
            flex-direction: column;
            gap: var(--space-3);
          }

          .action-buttons > * {
            width: 100%;
          }

          .summary-item {
            flex-direction: column;
            gap: var(--space-1);
          }

          .summary-item .label {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default PluginSubmissionForm;
