import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';

export interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showLanguageToggle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'MTYB Shop',
  showBackButton = true,
  showLanguageToggle = true
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const isHomePage = location.pathname === '/' || location.pathname === '';

  return (
    <header className="app-header">
      <div className="app-header__container">
        {/* Left section - Back button or logo */}
        <div className="app-header__left">
          {showBackButton && !isHomePage ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBackClick}
              className="app-header__back-button"
            >
              ← Back
            </Button>
          ) : (
            <div className="app-header__logo">
              <span className="app-header__logo-icon">🛍️</span>
              <span className="app-header__logo-text">{title}</span>
            </div>
          )}
        </div>

        {/* Center section - Title on inner pages */}
        {showBackButton && !isHomePage && (
          <div className="app-header__center">
            <h1 className="app-header__title">{title}</h1>
          </div>
        )}

        {/* Right section - Language toggle and actions */}
        <div className="app-header__right">
          {showLanguageToggle && (
            <div className="app-header__language-toggle">
              <Button
                variant={i18n.language === 'en' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => changeLanguage('en')}
                className="app-header__lang-button"
              >
                EN
              </Button>
              <Button
                variant={i18n.language === 'zh' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => changeLanguage('zh')}
                className="app-header__lang-button"
              >
                中文
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .app-header {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: var(--tg-theme-header-bg-color, var(--tg-theme-bg-color, #ffffff));
          border-bottom: 1px solid var(--tg-theme-separator-color, #e1e4e8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .app-header__container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          max-width: 1200px;
          margin: 0 auto;
          min-height: 56px;
        }

        .app-header__left {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .app-header__center {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
        }

        .app-header__right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex: 1;
        }

        .app-header__logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: var(--tg-theme-text-color, #000000);
        }

        .app-header__logo-icon {
          font-size: 1.5rem;
        }

        .app-header__logo-text {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--tg-theme-text-color, #000000);
        }

        .app-header__title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
          color: var(--tg-theme-text-color, #000000);
          text-align: center;
        }

        .app-header__back-button {
          background: transparent !important;
          border: none !important;
          color: var(--tg-theme-link-color, #007AFF) !important;
          padding: 0.5rem !important;
        }

        .app-header__language-toggle {
          display: flex;
          gap: 0.25rem;
        }

        .app-header__lang-button {
          min-width: 40px;
          padding: 0.375rem 0.5rem !important;
          font-size: 0.875rem;
        }

        /* Dark theme adjustments */
        @media (prefers-color-scheme: dark) {
          .app-header {
            background: var(--tg-theme-header-bg-color, var(--tg-theme-bg-color, #1c1c1e));
            border-bottom-color: var(--tg-theme-separator-color, #38383a);
          }
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .app-header__container {
            padding: 0.5rem 0.75rem;
          }

          .app-header__logo-text {
            font-size: 1.125rem;
          }

          .app-header__title {
            font-size: 1rem;
          }

          .app-header__lang-button {
            min-width: 36px;
            padding: 0.25rem 0.375rem !important;
            font-size: 0.75rem;
          }
        }

        /* Very small screens */
        @media (max-width: 480px) {
          .app-header__container {
            padding: 0.5rem;
          }

          .app-header__logo-text {
            display: none;
          }

          .app-header__center {
            flex: 2;
          }
        }
      `}</style>
    </header>
  );
}; 