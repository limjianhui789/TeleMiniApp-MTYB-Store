import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EnhancedCheckoutFlow,
  type CheckoutItem,
} from '../../components/checkout/EnhancedCheckoutFlow';
import { cartService, type EnhancedCartItem } from '../../services/product/CartService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<EnhancedCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load cart data
  const loadCartData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const enhancedItems = await cartService.getEnhancedCartItems();
      setCartItems(enhancedItems);
      
      // If cart is empty, redirect back to products
      if (enhancedItems.length === 0) {
        navigate('/products');
        return;
      }
    } catch (err) {
      setError('Failed to load cart data');
      console.error('Error loading cart:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadCartData();

    const unsubscribe = cartService.onCartChange(() => {
      loadCartData();
    });

    return unsubscribe;
  }, [loadCartData]);

  // Convert cart items to checkout items
  const checkoutItems: CheckoutItem[] = cartItems.map(item => ({
    id: item.productId,
    name: item.product.name,
    description: item.product.shortDescription || item.product.description,
    price: item.product.price,
    quantity: item.quantity,
    image: item.product.images[0]?.url,
    category: item.product.category,
    metadata: {
      originalSubtotal: item.originalSubtotal,
      calculatedSubtotal: item.calculatedSubtotal,
      savings: item.savings,
      isAvailable: item.isAvailable,
    },
  }));

  const handleUpdateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      const result = await cartService.updateQuantity(itemId, quantity);
      if (!result.success) {
        setError(result.error?.message || 'Failed to update quantity');
      }
    } catch (err) {
      setError('Failed to update quantity');
      console.error('Error updating quantity:', err);
    }
  }, []);

  const handleRemoveItem = useCallback(async (itemId: string) => {
    try {
      const result = await cartService.removeFromCart(itemId);
      if (!result.success) {
        setError(result.error?.message || 'Failed to remove item');
      }
    } catch (err) {
      setError('Failed to remove item');
      console.error('Error removing item:', err);
    }
  }, []);

  const handleCheckout = useCallback(async (items: CheckoutItem[]) => {
    try {
      // Validate cart before proceeding
      const validation = await cartService.validateCartAdvanced();
      
      if (!validation.isValid) {
        setError(validation.errors.join('\n'));
        return;
      }
      
      if (validation.warnings.length > 0) {
        // Show warnings but allow to proceed
        console.warn('Cart validation warnings:', validation.warnings);
      }
      
      // The EnhancedCheckoutFlow will handle order creation and payment
    } catch (err) {
      setError('Failed to validate cart');
      console.error('Error validating cart:', err);
    }
  }, []);

  const handleBack = useCallback(() => {
    navigate('/cart');
  }, [navigate]);

  if (loading) {
    return (
      <div className="checkout-loading">
        <LoadingSpinner size="large" />
        <p>Loading checkout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="checkout-error">
        <h2>⚠️ Checkout Error</h2>
        <p>{error}</p>
        <div className="checkout-error-actions">
          <button onClick={() => setError(null)} className="retry-btn">
            Try Again
          </button>
          <button onClick={handleBack} className="back-btn">
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <EnhancedCheckoutFlow
        items={checkoutItems}
        onCheckout={handleCheckout}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onBack={handleBack}
        className="checkout-page__flow"
      />

      <style>{`
        .checkout-page {
          min-height: 100vh;
          background: var(--tg-theme-bg-color, #ffffff);
          color: var(--tg-theme-text-color, #000000);
        }

        .checkout-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
          gap: 1rem;
          color: var(--tg-theme-hint-color, #666666);
        }

        .checkout-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
          padding: 2rem;
          gap: 1rem;
        }

        .checkout-error h2 {
          margin: 0;
          color: var(--tg-theme-destructive-text-color, #ff4444);
        }

        .checkout-error p {
          margin: 0;
          color: var(--tg-theme-text-color, #000000);
          white-space: pre-line;
        }

        .checkout-error-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .retry-btn,
        .back-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .retry-btn {
          background: var(--tg-theme-button-color, #007AFF);
          color: var(--tg-theme-button-text-color, #ffffff);
        }

        .back-btn {
          background: var(--tg-theme-secondary-bg-color, #f0f0f0);
          color: var(--tg-theme-text-color, #000000);
        }

        .retry-btn:hover,
        .back-btn:hover {
          opacity: 0.8;
        }

        .checkout-page__flow {
          padding: 1rem;
        }

        @media (max-width: 640px) {
          .checkout-page__flow {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}; 