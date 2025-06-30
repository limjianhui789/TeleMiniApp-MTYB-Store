import React from 'react';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color,
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();

  const getSize = () => {
    switch (size) {
      case 'small':
        return '16px';
      case 'medium':
        return '24px';
      case 'large':
        return '32px';
      case 'xlarge':
        return '48px';
      default:
        return '24px';
    }
  };

  return (
    <div
      className={`loading-spinner ${className}`}
      style={{
        width: getSize(),
        height: getSize(),
        borderColor: `${color || 'var(--color-primary)'} transparent transparent transparent`,
      }}
      aria-label="Loading"
      role="status"
    >
      <style>{`
        .loading-spinner {
          border: 2px solid;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

interface LoadingDotsProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'medium',
  color,
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();

  const getDotSize = () => {
    switch (size) {
      case 'small':
        return '4px';
      case 'medium':
        return '6px';
      case 'large':
        return '8px';
      default:
        return '6px';
    }
  };

  return (
    <div className={`loading-dots ${className}`}>
      <div
        className="loading-dots__dot"
        style={{
          width: getDotSize(),
          height: getDotSize(),
          backgroundColor: color || 'var(--color-primary)',
        }}
      />
      <div
        className="loading-dots__dot"
        style={{
          width: getDotSize(),
          height: getDotSize(),
          backgroundColor: color || 'var(--color-primary)',
        }}
      />
      <div
        className="loading-dots__dot"
        style={{
          width: getDotSize(),
          height: getDotSize(),
          backgroundColor: color || 'var(--color-primary)',
        }}
      />

      <style>{`
        .loading-dots {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .loading-dots__dot {
          border-radius: 50%;
          animation: loading-dots 1.4s ease-in-out infinite both;
        }

        .loading-dots__dot:nth-child(1) {
          animation-delay: -0.32s;
        }

        .loading-dots__dot:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes loading-dots {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

interface LoadingPulseProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

export const LoadingPulse: React.FC<LoadingPulseProps> = ({
  size = 'medium',
  color,
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();

  const getSize = () => {
    switch (size) {
      case 'small':
        return '16px';
      case 'medium':
        return '24px';
      case 'large':
        return '32px';
      default:
        return '24px';
    }
  };

  return (
    <div
      className={`loading-pulse ${className}`}
      style={{
        width: getSize(),
        height: getSize(),
        backgroundColor: color || 'var(--color-primary)',
      }}
    >
      <style>{`
        .loading-pulse {
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

interface LoadingPageProps {
  title?: string;
  message?: string;
  showProgress?: boolean;
  progress?: number;
  className?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  title = 'Loading',
  message = 'Please wait while we load your content...',
  showProgress = false,
  progress = 0,
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();

  return (
    <div className={`loading-page ${className}`}>
      <div className="loading-page__content">
        <div className="loading-page__spinner">
          <LoadingSpinner size="xlarge" />
        </div>

        <div className="loading-page__text">
          <h2 className="loading-page__title">{title}</h2>
          <p className="loading-page__message">{message}</p>
        </div>

        {showProgress && (
          <div className="loading-page__progress">
            <div className="loading-page__progress-bar">
              <div
                className="loading-page__progress-fill"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
            <span className="loading-page__progress-text">{Math.round(progress)}%</span>
          </div>
        )}
      </div>

      <style>{`
        .loading-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: var(--space-8);
          background: var(--color-background);
          font-family: var(--font-family-base);
        }

        .loading-page__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 400px;
          width: 100%;
        }

        .loading-page__spinner {
          margin-bottom: var(--space-6);
        }

        .loading-page__text {
          margin-bottom: var(--space-6);
        }

        .loading-page__title {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .loading-page__message {
          margin: 0;
          font-size: var(--text-base);
          color: var(--color-text-secondary);
          line-height: var(--leading-normal);
        }

        .loading-page__progress {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          align-items: center;
        }

        .loading-page__progress-bar {
          width: 100%;
          height: 8px;
          background: var(--color-muted);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .loading-page__progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
          border-radius: var(--radius-full);
          transition: width 0.3s ease;
        }

        .loading-page__progress-text {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
        }

        /* 移动端优化 */
        @media (max-width: 640px) {
          .loading-page {
            padding: var(--space-4);
          }

          .loading-page__title {
            font-size: var(--text-lg);
          }

          .loading-page__message {
            font-size: var(--text-sm);
          }
        }
      `}</style>
    </div>
  );
};

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = 'var(--radius-sm)',
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();

  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
      }}
    >
      <style>{`
        .skeleton {
          background: linear-gradient(90deg, var(--color-muted) 25%, var(--color-border) 50%, var(--color-muted) 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
        }

        @keyframes skeleton-loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};

interface LoadingCardProps {
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  showImage = true,
  showTitle = true,
  showDescription = true,
  showActions = true,
  className = '',
}) => {
  return (
    <div className={`loading-card ${className}`}>
      {showImage && (
        <Skeleton
          width="100%"
          height="200px"
          borderRadius="var(--radius-md)"
          className="loading-card__image"
        />
      )}

      <div className="loading-card__content">
        {showTitle && <Skeleton width="80%" height="1.5rem" className="loading-card__title" />}

        {showDescription && (
          <div className="loading-card__description">
            <Skeleton width="100%" height="1rem" />
            <Skeleton width="70%" height="1rem" />
          </div>
        )}

        {showActions && (
          <div className="loading-card__actions">
            <Skeleton width="100px" height="2.5rem" borderRadius="var(--radius-md)" />
          </div>
        )}
      </div>

      <style>{`
        .loading-card {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .loading-card__image {
          margin-bottom: var(--space-2);
        }

        .loading-card__content {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .loading-card__description {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .loading-card__actions {
          margin-top: var(--space-2);
        }
      `}</style>
    </div>
  );
};

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  showSpinner?: boolean;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Loading...',
  showSpinner = true,
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();

  if (!isVisible) return null;

  return (
    <div className={`loading-overlay ${className}`}>
      <div className="loading-overlay__backdrop" />
      <div className="loading-overlay__content">
        {showSpinner && <LoadingSpinner size="large" />}
        {message && <p className="loading-overlay__message">{message}</p>}
      </div>

      <style>{`
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-overlay__backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .loading-overlay__content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          background: var(--color-card-background);
          padding: var(--space-6);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          max-width: 300px;
          text-align: center;
        }

        .loading-overlay__message {
          margin: 0;
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }
      `}</style>
    </div>
  );
};
