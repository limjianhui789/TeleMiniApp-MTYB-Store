import React, { useState, useCallback } from 'react';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';
import { useAsyncState } from '../../hooks/useAsyncState';
import { LoadingSpinner, ErrorMessage } from '../common';
import { Button } from '../ui/Button';

// 插件配置类型
interface PluginConfigField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'password';
  required: boolean;
  description?: string;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

interface PluginConfigSchema {
  pluginId: string;
  pluginName: string;
  version: string;
  fields: PluginConfigField[];
}

interface PluginConfiguration {
  pluginId: string;
  config: Record<string, any>;
  isValid: boolean;
  lastUpdated: Date;
}

interface PluginSettingsProps {
  pluginId: string;
  className?: string;
  onConfigChanged?: (pluginId: string, config: Record<string, any>) => void;
  onClose?: () => void;
}

export const PluginSettings: React.FC<PluginSettingsProps> = ({
  pluginId,
  className = '',
  onConfigChanged,
  onClose,
}) => {
  const { colorScheme } = useTelegramTheme();
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // 获取插件配置架构
  const fetchConfigSchema = useCallback(async (): Promise<PluginConfigSchema> => {
    // 这里应该调用实际的插件配置API
    // 例如: return pluginManager.getPluginConfigSchema(pluginId);

    // 模拟数据用于演示
    await new Promise(resolve => setTimeout(resolve, 500));

    if (pluginId === 'vpn-plugin') {
      return {
        pluginId: 'vpn-plugin',
        pluginName: 'VPN Manager',
        version: '1.2.0',
        fields: [
          {
            key: 'apiEndpoint',
            label: 'API Endpoint',
            type: 'string',
            required: true,
            description: 'VPN service API endpoint URL',
            validation: {
              pattern: '^https?://.+',
            },
          },
          {
            key: 'apiKey',
            label: 'API Key',
            type: 'password',
            required: true,
            description: 'Authentication key for VPN service API',
          },
          {
            key: 'serverRegions',
            label: 'Available Server Regions',
            type: 'array',
            required: true,
            description: 'List of available VPN server regions',
            validation: {
              options: ['us-east', 'us-west', 'eu-west', 'eu-central', 'asia-pacific'],
            },
          },
          {
            key: 'defaultDuration',
            label: 'Default Account Duration (days)',
            type: 'number',
            required: false,
            description: 'Default duration for VPN accounts in days',
            defaultValue: 30,
            validation: {
              min: 1,
              max: 365,
            },
          },
          {
            key: 'enableAutoRenewal',
            label: 'Enable Auto Renewal',
            type: 'boolean',
            required: false,
            description: 'Automatically renew expiring accounts',
            defaultValue: false,
          },
        ],
      };
    }

    // 其他插件的默认配置
    return {
      pluginId,
      pluginName: 'Generic Plugin',
      version: '1.0.0',
      fields: [
        {
          key: 'enabled',
          label: 'Enabled',
          type: 'boolean',
          required: true,
          description: 'Enable or disable this plugin',
          defaultValue: true,
        },
      ],
    };
  }, [pluginId]);

  // 获取当前插件配置
  const fetchCurrentConfig = useCallback(async (): Promise<PluginConfiguration> => {
    // 这里应该调用实际的插件配置API
    // 例如: return pluginManager.getPluginConfig(pluginId);

    // 模拟数据用于演示
    await new Promise(resolve => setTimeout(resolve, 300));

    if (pluginId === 'vpn-plugin') {
      return {
        pluginId: 'vpn-plugin',
        config: {
          apiEndpoint: 'https://api.vpnservice.com',
          apiKey: '***hidden***',
          serverRegions: ['us-east', 'us-west', 'eu-west'],
          defaultDuration: 30,
          enableAutoRenewal: false,
        },
        isValid: true,
        lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
      };
    }

    return {
      pluginId,
      config: { enabled: true },
      isValid: true,
      lastUpdated: new Date(),
    };
  }, [pluginId]);

  const [schemaState, { execute: loadSchema }] = useAsyncState(fetchConfigSchema);
  const [configState, { execute: loadConfig }] = useAsyncState(fetchCurrentConfig);

  React.useEffect(() => {
    loadSchema();
    loadConfig();
  }, [loadSchema, loadConfig]);

  React.useEffect(() => {
    if (configState.data) {
      setConfigValues(configState.data.config);
    }
  }, [configState.data]);

  const validateField = (field: PluginConfigField, value: any): string | null => {
    if (field.required && (value === undefined || value === null || value === '')) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      const { min, max, pattern, options } = field.validation;

      if (field.type === 'number' && typeof value === 'number') {
        if (min !== undefined && value < min) {
          return `${field.label} must be at least ${min}`;
        }
        if (max !== undefined && value > max) {
          return `${field.label} must be at most ${max}`;
        }
      }

      if (field.type === 'string' && typeof value === 'string') {
        if (pattern && !new RegExp(pattern).test(value)) {
          return `${field.label} format is invalid`;
        }
      }

      if (field.type === 'array' && Array.isArray(value) && options) {
        const invalidItems = value.filter(item => !options.includes(item));
        if (invalidItems.length > 0) {
          return `Invalid options: ${invalidItems.join(', ')}`;
        }
      }
    }

    return null;
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setConfigValues(prev => ({
      ...prev,
      [fieldKey]: value,
    }));

    // 验证单个字段
    const field = schemaState.data?.fields.find(f => f.key === fieldKey);
    if (field) {
      const error = validateField(field, value);
      setValidationErrors(prev => ({
        ...prev,
        [fieldKey]: error || '',
      }));
    }
  };

  const validateAllFields = (): boolean => {
    if (!schemaState.data) return false;

    const errors: Record<string, string> = {};
    let hasErrors = false;

    schemaState.data.fields.forEach(field => {
      const value = configValues[field.key];
      const error = validateField(field, value);
      if (error) {
        errors[field.key] = error;
        hasErrors = true;
      }
    });

    setValidationErrors(errors);
    return !hasErrors;
  };

  const handleSave = async () => {
    if (!validateAllFields()) {
      return;
    }

    setIsSaving(true);
    try {
      // 这里应该调用实际的插件配置更新API
      // await pluginManager.updatePluginConfig(pluginId, configValues);

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      onConfigChanged?.(pluginId, configValues);

      // 重新加载配置
      await loadConfig();
    } catch (error) {
      console.error('Failed to save plugin configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (configState.data) {
      setConfigValues(configState.data.config);
      setValidationErrors({});
    }
  };

  if (schemaState.loading || configState.loading) {
    return (
      <div className="plugin-settings-loading">
        <LoadingSpinner size="large" />
        <p>Loading plugin settings...</p>
      </div>
    );
  }

  if (schemaState.error || configState.error) {
    return (
      <ErrorMessage
        title="Failed to load plugin settings"
        message={schemaState.error?.message || configState.error?.message || 'Unknown error'}
        actions={[
          {
            label: 'Retry',
            onClick: () => {
              loadSchema();
              loadConfig();
            },
            variant: 'primary',
          },
        ]}
      />
    );
  }

  const schema = schemaState.data;
  const hasChanges = JSON.stringify(configValues) !== JSON.stringify(configState.data?.config);
  const hasErrors = Object.values(validationErrors).some(error => error !== '');

  return (
    <div className={`plugin-settings ${className}`}>
      {/* Header */}
      <div className="settings-header">
        <div className="header-info">
          <h3>{schema?.pluginName} Settings</h3>
          <span className="plugin-version">v{schema?.version}</span>
        </div>

        {onClose && (
          <Button onClick={onClose} variant="ghost" size="sm">
            ✕
          </Button>
        )}
      </div>

      {/* Settings Form */}
      <div className="settings-form">
        {schema?.fields.map(field => (
          <FieldEditor
            key={field.key}
            field={field}
            value={configValues[field.key]}
            error={validationErrors[field.key]}
            onChange={value => handleFieldChange(field.key, value)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="settings-actions">
        <Button onClick={handleReset} variant="secondary" disabled={!hasChanges}>
          Reset
        </Button>

        <Button
          onClick={handleSave}
          variant="primary"
          disabled={!hasChanges || hasErrors || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <style>{`
        .plugin-settings {
          max-width: 600px;
          margin: 0 auto;
          font-family: var(--font-family-base);
        }

        .plugin-settings-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: var(--space-4);
          color: var(--color-text-secondary);
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-border);
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .header-info h3 {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .plugin-version {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
          background: var(--color-muted);
          padding: 2px var(--space-1);
          border-radius: var(--radius-sm);
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
          margin-bottom: var(--space-8);
        }

        .settings-actions {
          display: flex;
          gap: var(--space-3);
          justify-content: flex-end;
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border);
        }

        /* 移动端优化 */
        @media (max-width: 640px) {
          .plugin-settings {
            padding: var(--space-4);
          }

          .settings-actions {
            flex-direction: column;
          }

          .settings-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

// 字段编辑器组件
interface FieldEditorProps {
  field: PluginConfigField;
  value: any;
  error?: string;
  onChange: (value: any) => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, value, error, onChange }) => {
  const renderField = () => {
    switch (field.type) {
      case 'boolean':
        return (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={value || false}
              onChange={e => onChange(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-custom"></span>
            <span className="checkbox-text">{field.label}</span>
          </label>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
            min={field.validation?.min}
            max={field.validation?.max}
            placeholder={field.defaultValue?.toString()}
            className={`field-input ${error ? 'error' : ''}`}
          />
        );

      case 'password':
        return (
          <input
            type="password"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder="Enter password..."
            className={`field-input ${error ? 'error' : ''}`}
          />
        );

      case 'array':
        const arrayValue = Array.isArray(value) ? value : [];
        const options = field.validation?.options || [];

        if (options.length > 0) {
          return (
            <div className="multi-select">
              {options.map(option => (
                <label key={option} className="checkbox-label small">
                  <input
                    type="checkbox"
                    checked={arrayValue.includes(option)}
                    onChange={e => {
                      if (e.target.checked) {
                        onChange([...arrayValue, option]);
                      } else {
                        onChange(arrayValue.filter(item => item !== option));
                      }
                    }}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">{option}</span>
                </label>
              ))}
            </div>
          );
        }

        return (
          <textarea
            value={Array.isArray(value) ? value.join('\n') : ''}
            onChange={e => onChange(e.target.value.split('\n').filter(Boolean))}
            placeholder="Enter one item per line..."
            rows={4}
            className={`field-input ${error ? 'error' : ''}`}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.defaultValue?.toString()}
            className={`field-input ${error ? 'error' : ''}`}
          />
        );
    }
  };

  return (
    <div className="field-editor">
      {field.type !== 'boolean' && (
        <label className="field-label">
          {field.label}
          {field.required && <span className="required">*</span>}
        </label>
      )}

      {renderField()}

      {field.description && <div className="field-description">{field.description}</div>}

      {error && <div className="field-error">{error}</div>}

      <style>{`
        .field-editor {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .field-label {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .required {
          color: var(--color-error);
        }

        .field-input {
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

        .field-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-light);
        }

        .field-input.error {
          border-color: var(--color-error);
        }

        .field-input.error:focus {
          box-shadow: 0 0 0 2px var(--color-error-light);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
          padding: var(--space-2) 0;
          min-height: var(--touch-target-min);
        }

        .checkbox-label.small {
          padding: var(--space-1) 0;
          min-height: auto;
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

        .multi-select {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          padding: var(--space-3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-background);
        }

        .field-description {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          line-height: var(--leading-normal);
        }

        .field-error {
          font-size: var(--text-xs);
          color: var(--color-error);
          font-weight: var(--font-weight-medium);
        }
      `}</style>
    </div>
  );
};
