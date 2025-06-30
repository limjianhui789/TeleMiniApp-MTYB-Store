// ============================================================================
// Payment Module Lazy Loading
// ============================================================================

import { lazy } from 'react';

// Lazy load payment components for better performance
export const PaymentForm = lazy(() => 
  import('./PaymentForm').then(module => ({
    default: module.PaymentForm
  }))
);

export const PaymentStatus = lazy(() => 
  import('./PaymentStatus').then(module => ({
    default: module.PaymentStatus
  }))
);

// Export types for use in other modules
export type {
  PaymentFormProps
} from './PaymentForm';

export type {
  PaymentStatusProps
} from './PaymentStatus';
