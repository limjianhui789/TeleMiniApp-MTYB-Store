import React, { useState } from 'react';
import { useTheme, ThemeMode } from '../../hooks/useTheme';
import { Button } from '../ui/Button';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'dropdown' | 'switch';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'button',
  size = 'md',
  showLabel = true,
}) => {
  const { mode, isDark, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const getThemeIcon = (themeMode: ThemeMode): string => {
    switch (themeMode) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'auto':
        return '🌓';
      default:
        return '🌓';
    }
  };

  const getThemeLabel = (themeMode: ThemeMode): string => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'auto':
        return 'Auto';
      default:
        return 'Auto';
    }
  };

  if (variant === 'button') {
    return (
      <Button
        onClick={toggleTheme}
        variant="ghost"
        size={size}
        className={`theme-toggle ${className}`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      >
        <span className="theme-icon">{isDark ? '☀️' : '🌙'}</span>
        {showLabel && <span className="theme-label">{isDark ? 'Light' : 'Dark'}</span>}
      </Button>
    );
  }

  if (variant === 'switch') {
    return (
      <div className={`theme-switch ${className}`}>
        <label className="switch-label">
          {showLabel && (
            <span className="switch-text">
              {getThemeIcon(mode)} {getThemeLabel(mode)}
            </span>
          )}
          <button
            className="switch-button"
            onClick={toggleTheme}
            aria-label={`Current theme: ${getThemeLabel(mode)}. Click to toggle.`}
          >
            <span className={`switch-slider ${isDark ? 'dark' : 'light'}`}>
              <span className="switch-handle">{getThemeIcon(isDark ? 'dark' : 'light')}</span>
            </span>
          </button>
        </label>

        <style>{`
          .theme-switch {
            display: flex;
            align-items: center;
            font-family: var(--font-family-base);
          }

          .switch-label {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            cursor: pointer;
          }

          .switch-text {
            font-size: var(--text-sm);
            color: var(--color-text-primary);
            min-width: 80px;
          }

          .switch-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
          }

          .switch-slider {
            display: flex;
            align-items: center;
            width: 52px;
            height: 28px;
            background: var(--color-muted);
            border-radius: 14px;
            border: 1px solid var(--color-border);
            transition: all 0.3s ease;
            position: relative;
          }

          .switch-slider.dark {
            background: var(--color-primary);
          }

          .switch-handle {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            background: var(--color-background);
            border-radius: 50%;
            font-size: 12px;
            transition: all 0.3s ease;
            box-shadow: var(--shadow-sm);
            transform: translateX(2px);
          }

          .switch-slider.dark .switch-handle {
            transform: translateX(24px);
          }

          .switch-button:focus .switch-slider {
            outline: 2px solid var(--color-focus);
            outline-offset: 2px;
          }
        `}</style>
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={`theme-dropdown ${className}`}>
        <div className="dropdown-wrapper">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            variant="ghost"
            size={size}
            className="dropdown-trigger"
            aria-label="Theme selection"
            aria-expanded={isOpen}
          >
            <span className="theme-icon">{getThemeIcon(mode)}</span>
            {showLabel && <span className="theme-label">{getThemeLabel(mode)}</span>}
            <span className="dropdown-arrow">{isOpen ? '▴' : '▾'}</span>
          </Button>

          {isOpen && (
            <div className="dropdown-menu">
              {(['light', 'dark', 'auto'] as const).map(themeMode => (
                <button
                  key={themeMode}
                  className={`dropdown-item ${mode === themeMode ? 'active' : ''}`}
                  onClick={() => {
                    setTheme(themeMode);
                    setIsOpen(false);
                  }}
                >
                  <span className="item-icon">{getThemeIcon(themeMode)}</span>
                  <span className="item-label">{getThemeLabel(themeMode)}</span>
                  {mode === themeMode && <span className="item-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Backdrop to close dropdown */}
        {isOpen && <div className="dropdown-backdrop" onClick={() => setIsOpen(false)} />}

        <style>{`
          .theme-dropdown {
            position: relative;
            font-family: var(--font-family-base);
          }

          .dropdown-wrapper {
            position: relative;
          }

          .dropdown-trigger {
            display: flex;
            align-items: center;
            gap: var(--space-2);
          }

          .dropdown-arrow {
            font-size: var(--text-xs);
            color: var(--color-text-secondary);
            transition: transform 0.2s ease;
          }

          .dropdown-menu {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: var(--space-1);
            background: var(--color-background-elevated);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            min-width: 140px;
            z-index: var(--z-popover);
            overflow: hidden;
          }

          .dropdown-item {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            width: 100%;
            padding: var(--space-3);
            background: none;
            border: none;
            font-size: var(--text-sm);
            color: var(--color-text-primary);
            cursor: pointer;
            transition: background-color 0.2s ease;
            min-height: var(--touch-target-min);
          }

          .dropdown-item:hover {
            background: var(--color-hover);
          }

          .dropdown-item.active {
            background: var(--color-primary-light);
            color: var(--color-primary);
          }

          .item-icon {
            font-size: 14px;
          }

          .item-label {
            flex: 1;
            text-align: left;
          }

          .item-check {
            font-size: var(--text-xs);
            color: var(--color-primary);
          }

          .dropdown-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: calc(var(--z-popover) - 1);
          }

          /* Mobile optimizations */
          @media (max-width: 640px) {
            .dropdown-menu {
              right: auto;
              left: 0;
              min-width: 120px;
            }
          }
        `}</style>
      </div>
    );
  }

  return null;
};

export default ThemeToggle;
