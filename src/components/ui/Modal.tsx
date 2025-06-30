// ============================================================================
// MTYB Virtual Goods Platform - Modal Component
// ============================================================================

import React, { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/css/classnames';
import { Button } from './Button';

// ============================================================================
// Modal Interfaces
// ============================================================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdropClick?: boolean;
  closeOnEscapeKey?: boolean;
  showCloseButton?: boolean;
  children: ReactNode;
}

export interface ModalHeaderProps {
  title: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export interface ModalContentProps {
  children: ReactNode;
}

export interface ModalFooterProps {
  children: ReactNode;
}

// ============================================================================
// Modal Styles
// ============================================================================

const modalSizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

// ============================================================================
// Modal Component
// ============================================================================

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscapeKey = true,
  showCloseButton = true,
  children,
}: ModalProps) {
  // ============================================================================
  // Effects
  // ============================================================================

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscapeKey) return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, closeOnEscapeKey, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full bg-surface rounded-xl shadow-2xl',
          'transform transition-all',
          'max-h-[90vh] overflow-hidden',
          modalSizes[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {title && <ModalHeader title={title} onClose={onClose} showCloseButton={showCloseButton} />}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// ============================================================================
// Modal Header Component
// ============================================================================

export function ModalHeader({ title, onClose, showCloseButton = true }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-border">
      <h2 id="modal-title" className="text-xl font-semibold text-text-primary">
        {title}
      </h2>
      {showCloseButton && onClose && (
        <Button variant="ghost" size="sm" onClick={onClose} className="p-2 -mr-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Modal Content Component
// ============================================================================

export function ModalContent({ children }: ModalContentProps) {
  return <div className="p-6">{children}</div>;
}

// ============================================================================
// Modal Footer Component
// ============================================================================

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
      {children}
    </div>
  );
}
