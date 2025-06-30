import React from 'react';
import { PluginManagement } from '../components/plugins';
import { useTelegramTheme } from '../hooks/useTelegramTheme';

export const PluginManagementPage: React.FC = () => {
  const { colorScheme } = useTelegramTheme();

  return (
    <div className="plugin-management-page">
      <PluginManagement />

      <style>{`
        .plugin-management-page {
          min-height: 100vh;
          background: var(--color-background);
          color: var(--color-text-primary);
        }
      `}</style>
    </div>
  );
};

export default PluginManagementPage;
