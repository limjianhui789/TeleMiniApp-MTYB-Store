// ============================================================================
// MTYB Virtual Goods Platform - Loading Spinner Component
// ============================================================================

import React from 'react';
import { Spinner } from '@telegram-apps/telegram-ui';
import './LoadingSpinner.css';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  overlay?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  overlay = false,
  className = ''
}) => {
  const sizeClasses = {
    small: 'loading-spinner--small',
    medium: 'loading-spinner--medium',
    large: 'loading-spinner--large'
  };

  const spinnerContent = (
    <div className={`loading-spinner ${sizeClasses[size]} ${className}`}>
      <Spinner size={size === 'small' ? 's' : size === 'large' ? 'l' : 'm'} />
      {message && (
        <div className="loading-spinner__message">
          {message}
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-spinner-overlay">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

export default LoadingSpinner;
