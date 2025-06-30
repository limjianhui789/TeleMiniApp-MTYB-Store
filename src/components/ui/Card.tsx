// ============================================================================
// MTYB Virtual Goods Platform - Card Component
// ============================================================================

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/css/classnames';

// ============================================================================
// Card Interfaces
// ============================================================================

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  actions?: ReactNode;
}

// ============================================================================
// Card Styles
// ============================================================================

const cardBaseStyles = ['bg-surface', 'rounded-lg', 'transition-all duration-200'];

const cardVariants = {
  default: ['border-0'],
  outlined: ['border border-border'],
  elevated: ['shadow-md hover:shadow-lg'],
};

const cardPadding = {
  none: [],
  sm: ['p-4'],
  md: ['p-6'],
  lg: ['p-8'],
};

const cardHover = ['hover:shadow-lg', 'hover:scale-[1.02]', 'cursor-pointer'];

// ============================================================================
// Card Component
// ============================================================================

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', hover = false, className, children, ...props }, ref) => {
    const cardClasses = cn(
      cardBaseStyles,
      cardVariants[variant],
      cardPadding[padding],
      hover && cardHover,
      className
    );

    return (
      <div ref={ref} className={cardClasses} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// ============================================================================
// Card Header Component
// ============================================================================

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, className, children, ...props }, ref) => {
    const headerClasses = cn('flex items-center justify-between', 'mb-4', className);

    return (
      <div ref={ref} className={headerClasses} {...props}>
        <div className="flex-1">
          {title && <h3 className="text-lg font-semibold text-text-primary">{title}</h3>}
          {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
          {children}
        </div>
        {action && <div className="ml-4 flex-shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// ============================================================================
// Card Content Component
// ============================================================================

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    const contentClasses = cn('text-text-primary', className);

    return (
      <div ref={ref} className={contentClasses} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// ============================================================================
// Card Footer Component
// ============================================================================

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ actions, className, children, ...props }, ref) => {
    const footerClasses = cn(
      'mt-4 pt-4',
      'border-t border-border',
      'flex items-center justify-between',
      className
    );

    return (
      <div ref={ref} className={footerClasses} {...props}>
        <div className="flex-1">{children}</div>
        {actions && <div className="ml-4 flex items-center space-x-2">{actions}</div>}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';
