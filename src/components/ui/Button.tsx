// ============================================================================
// MTYB Virtual Goods Platform - Enhanced Button Component
// ============================================================================

import { forwardRef, type ButtonHTMLAttributes, type ReactNode, useEffect } from 'react';
import { cn } from '@/css/classnames';

// ============================================================================
// Button Types
// ============================================================================

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'success'
    | 'warning'
    | 'info';
  size?: 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | boolean;
}

// ============================================================================
// Haptic Feedback Hook
// ============================================================================

const useHapticFeedback = (enabled: boolean | string, type: string = 'light') => {
  return () => {
    if (!enabled) return;

    try {
      // Telegram Mini App haptic feedback
      if (window.Telegram?.WebApp?.HapticFeedback) {
        const feedbackType = typeof enabled === 'string' ? enabled : type;
        if (feedbackType === 'light' || feedbackType === 'medium' || feedbackType === 'heavy') {
          window.Telegram.WebApp.HapticFeedback.impactOccurred(feedbackType);
        }
      }
      // iOS Safari haptic feedback fallback
      else if ('vibrate' in navigator) {
        const duration = type === 'heavy' ? 50 : type === 'medium' ? 30 : 10;
        navigator.vibrate(duration);
      }
    } catch (error) {
      // Silently fail if haptic feedback is not supported
    }
  };
};

// ============================================================================
// Button Styles using Design System
// ============================================================================

const baseStyles = [
  'btn-base',
  'focus-visible',
  'haptic-light',
  'transition-all',
  'duration-150',
  'ease-in-out',
  'disabled:opacity-50',
  'disabled:cursor-not-allowed',
  'select-none',
];

const variants = {
  primary: ['btn-primary', 'hover:bg-hover', 'active:bg-active', 'active:scale-95'],
  secondary: [
    'bg-surface-secondary',
    'text-primary',
    'border',
    'border-light',
    'hover:bg-surface-elevated',
    'active:scale-95',
  ],
  outline: [
    'bg-transparent',
    'text-primary',
    'border',
    'border-primary',
    'hover:bg-primary',
    'hover:text-on-primary',
    'active:scale-95',
  ],
  ghost: [
    'bg-transparent',
    'text-primary',
    'border-0',
    'hover:bg-surface-secondary',
    'active:scale-95',
  ],
  danger: [
    'bg-error',
    'text-white',
    'border',
    'border-error',
    'hover:opacity-90',
    'active:scale-95',
  ],
  success: [
    'bg-success',
    'text-white',
    'border',
    'border-success',
    'hover:opacity-90',
    'active:scale-95',
  ],
  warning: [
    'bg-warning',
    'text-white',
    'border',
    'border-warning',
    'hover:opacity-90',
    'active:scale-95',
  ],
  info: ['bg-info', 'text-white', 'border', 'border-info', 'hover:opacity-90', 'active:scale-95'],
};

const sizes = {
  sm: ['px-3', 'py-2', 'text-sm', 'rounded-md', 'touch-target-min'],
  md: ['px-4', 'py-3', 'text-base', 'rounded-lg', 'touch-target-comfortable'],
  lg: ['px-6', 'py-4', 'text-lg', 'rounded-xl', 'touch-target-large'],
  small: ['px-3', 'py-2', 'text-sm', 'rounded-md', 'touch-target-min'],
  medium: ['px-4', 'py-3', 'text-base', 'rounded-lg', 'touch-target-comfortable'],
  large: ['px-6', 'py-4', 'text-lg', 'rounded-xl', 'touch-target-large'],
};

// ============================================================================
// Enhanced Button Component
// ============================================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      hapticFeedback = true,
      children,
      className,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const triggerHaptic = useHapticFeedback(hapticFeedback, 'light');

    const buttonClasses = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      {
        'w-full': fullWidth,
        'pointer-events-none': loading,
      },
      className
    );

    const isDisabled = disabled || loading;

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        triggerHaptic();
        onClick?.(event);
      }
    };

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={isDisabled}
        onClick={handleClick}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <div className="flex items-center">
            <LoadingSpinner size="sm" className="mr-2" />
          </div>
        )}

        {!loading && leftIcon && (
          <span className="mr-2 flex items-center" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        <span className={loading ? 'opacity-0' : 'opacity-100'}>{children}</span>

        {!loading && rightIcon && (
          <span className="ml-2 flex items-center" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ============================================================================
// Loading Spinner Component
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner = ({ size = 'md', className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// ============================================================================
// Button Group Component
// ============================================================================

export interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ButtonGroup = ({
  children,
  orientation = 'horizontal',
  spacing = 'md',
  className,
}: ButtonGroupProps) => {
  const spacingClasses = {
    sm: orientation === 'horizontal' ? 'gap-2' : 'gap-2',
    md: orientation === 'horizontal' ? 'gap-3' : 'gap-3',
    lg: orientation === 'horizontal' ? 'gap-4' : 'gap-4',
  };

  const orientationClasses = {
    horizontal: 'flex flex-row items-center',
    vertical: 'flex flex-col items-stretch',
  };

  return (
    <div className={cn(orientationClasses[orientation], spacingClasses[spacing], className)}>
      {children}
    </div>
  );
};

ButtonGroup.displayName = 'ButtonGroup';
