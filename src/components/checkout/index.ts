// ============================================================================
// Checkout Module Lazy Loading
// ============================================================================

import { lazy } from 'react';

// Lazy load checkout components for better performance
export const EnhancedCheckoutFlow = lazy(() =>
  import('./EnhancedCheckoutFlow').then(module => ({
    default: module.EnhancedCheckoutFlow,
  }))
);

// Export types for use in other modules
export type { CheckoutItem, CheckoutState, CheckoutFlowProps } from './EnhancedCheckoutFlow';
