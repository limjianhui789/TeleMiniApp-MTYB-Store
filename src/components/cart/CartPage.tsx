import React, { useState, useEffect } from 'react';
import type { CartState, CartItem } from '../../types';
import { cartService } from '../../services/product/CartService';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface CartPageProps {
  onCheckout?: (items: CartItem[]) => void;
  onContinueShopping?: () => void;
  onProductClick?: (productId: string) => void;
  className?: string;
}

export const CartPage: React.FC<CartPageProps> = ({
  onCheckout,
  onContinueShopping,
  onProductClick,
  className = '',
}) => {
  const [cartState, setCartState] = useState<CartState>({
    items: [],
    total: 0,
    currency: 'USD',
    isLoading: false,
    error: null,
  });
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSavedItems, setShowSavedItems] = useState(false);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);

  useEffect(() => {
    // Initialize cart state
    setCartState(cartService.getCartState());
    setSavedItems(cartService.getSavedForLater());

    // Listen to cart changes
    const unsubscribe = cartService.onCartChange(newCartState => {
      setCartState(newCartState);
    });

    return unsubscribe;
  }, []);

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    try {
      setUpdating(productId);
      setError(null);

      const result = await cartService.updateQuantity(productId, quantity);
      if (!result.success) {
        setError(result.error?.message || 'Failed to update quantity');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      setUpdating(productId);
      setError(null);

      const result = await cartService.removeFromCart(productId);
      if (!result.success) {
        setError(result.error?.message || 'Failed to remove item');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const handleSaveForLater = async (productId: string) => {
    try {
      setUpdating(productId);
      setError(null);

      const result = await cartService.saveForLater(productId);
      if (result.success) {
        setSavedItems(cartService.getSavedForLater());
      } else {
        setError(result.error?.message || 'Failed to save for later');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save for later');
    } finally {
      setUpdating(null);
    }
  };

  const handleMoveToCart = async (productId: string) => {
    try {
      setUpdating(productId);
      setError(null);

      const result = await cartService.moveFromSavedToCart(productId);
      if (result.success) {
        setSavedItems(cartService.getSavedForLater());
      } else {
        setError(result.error?.message || 'Failed to move to cart');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move to cart');
    } finally {
      setUpdating(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return;

    try {
      setError(null);
      const result = await cartService.clearCart();
      if (!result.success) {
        setError(result.error?.message || 'Failed to clear cart');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
    }
  };

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout(cartState.items);
    }
  };

  const summary = cartService.getCartSummary();
  const isEmpty = cartState.items.length === 0;

  if (cartState.isLoading) {
    return (
      <div className="cart-page__loading">
        <LoadingSpinner size="large" />
        <p>Loading cart...</p>
      </div>
    );
  }

  return (
    <div className={`cart-page ${className}`}>
      <div className="cart-page__header">
        <h1 className="cart-page__title">Shopping Cart ({cartState.items.length})</h1>

        {!isEmpty && (
          <Button
            onClick={handleClearCart}
            variant="ghost"
            size="sm"
            className="cart-page__clear-btn"
          >
            Clear Cart
          </Button>
        )}
      </div>

      {error && <div className="cart-page__error">❌ {error}</div>}

      {isEmpty ? (
        <div className="cart-page__empty">
          <div className="cart-page__empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some products to get started!</p>
          {onContinueShopping && (
            <Button onClick={onContinueShopping} variant="primary">
              Continue Shopping
            </Button>
          )}
        </div>
      ) : (
        <div className="cart-page__content">
          {/* Cart Items */}
          <div className="cart-page__items">
            {cartState.items.map(item => (
              <div key={item.productId} className="cart-page__item">
                <div
                  className="cart-page__item-image"
                  onClick={() => onProductClick && onProductClick(item.productId)}
                >
                  {item.product.images[0] ? (
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/images/placeholder-product.png';
                      }}
                    />
                  ) : (
                    <div className="cart-page__item-placeholder">📦</div>
                  )}
                </div>

                <div className="cart-page__item-info">
                  <h3
                    className="cart-page__item-name"
                    onClick={() => onProductClick && onProductClick(item.productId)}
                  >
                    {item.product.name}
                  </h3>

                  <p className="cart-page__item-description">
                    {item.product.shortDescription || item.product.description}
                  </p>

                  <div className="cart-page__item-details">
                    <span className="cart-page__item-price">
                      {item.product.currency} {item.product.price.toFixed(2)}
                    </span>

                    {item.product.originalPrice &&
                      item.product.originalPrice > item.product.price && (
                        <span className="cart-page__item-original-price">
                          {item.product.currency} {item.product.originalPrice.toFixed(2)}
                        </span>
                      )}
                  </div>

                  <div className="cart-page__item-delivery">
                    <span className="cart-page__item-delivery-icon">
                      {item.product.deliveryInfo.type === 'instant' ? '⚡' : '📦'}
                    </span>
                    <span className="cart-page__item-delivery-text">
                      {item.product.deliveryInfo.estimatedTime}
                    </span>
                  </div>
                </div>

                <div className="cart-page__item-controls">
                  <div className="cart-page__quantity-controls">
                    <button
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1 || updating === item.productId}
                      className="cart-page__quantity-btn"
                    >
                      -
                    </button>
                    <span className="cart-page__quantity-display">
                      {updating === item.productId ? '...' : item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                      disabled={
                        updating === item.productId ||
                        (item.product.stock ? item.quantity >= item.product.stock.available : false)
                      }
                      className="cart-page__quantity-btn"
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-page__item-total">
                    {item.product.currency} {(item.product.price * item.quantity).toFixed(2)}
                  </div>

                  <div className="cart-page__item-actions">
                    <button
                      onClick={() => handleSaveForLater(item.productId)}
                      disabled={updating === item.productId}
                      className="cart-page__action-btn"
                    >
                      Save for Later
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      disabled={updating === item.productId}
                      className="cart-page__action-btn cart-page__remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="cart-page__summary">
            <h3 className="cart-page__summary-title">Order Summary</h3>

            <div className="cart-page__summary-details">
              <div className="cart-page__summary-row">
                <span>Subtotal ({summary.itemCount} items)</span>
                <span>
                  {summary.currency} {summary.subtotal.toFixed(2)}
                </span>
              </div>

              {summary.totalDiscount > 0 && (
                <div className="cart-page__summary-row cart-page__discount">
                  <span>Discount</span>
                  <span>
                    -{summary.currency} {summary.totalDiscount.toFixed(2)}
                  </span>
                </div>
              )}

              {summary.estimatedTax && (
                <div className="cart-page__summary-row">
                  <span>Estimated Tax</span>
                  <span>
                    {summary.currency} {summary.estimatedTax.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="cart-page__summary-row cart-page__total">
                <span>Total</span>
                <span>
                  {summary.currency} {summary.finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {summary.savings > 0 && (
              <div className="cart-page__savings">
                🎉 You're saving {summary.currency} {summary.savings.toFixed(2)}!
              </div>
            )}

            <div className="cart-page__checkout-actions">
              <Button onClick={handleCheckout} size="lg" className="cart-page__checkout-btn">
                Proceed to Checkout
              </Button>

              {onContinueShopping && (
                <Button
                  onClick={onContinueShopping}
                  variant="secondary"
                  size="sm"
                  className="cart-page__continue-btn"
                >
                  Continue Shopping
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved for Later */}
      {savedItems.length > 0 && (
        <div className="cart-page__saved">
          <div className="cart-page__saved-header">
            <h3>Saved for Later ({savedItems.length})</h3>
            <button
              onClick={() => setShowSavedItems(!showSavedItems)}
              className="cart-page__saved-toggle"
            >
              {showSavedItems ? 'Hide' : 'Show'}
            </button>
          </div>

          {showSavedItems && (
            <div className="cart-page__saved-items">
              {savedItems.map(item => (
                <div key={item.productId} className="cart-page__saved-item">
                  <div className="cart-page__saved-item-image">
                    {item.product.images[0] ? (
                      <img src={item.product.images[0].url} alt={item.product.name} />
                    ) : (
                      <div className="cart-page__saved-item-placeholder">📦</div>
                    )}
                  </div>

                  <div className="cart-page__saved-item-info">
                    <h4>{item.product.name}</h4>
                    <p>
                      {item.product.currency} {item.product.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="cart-page__saved-item-actions">
                    <Button
                      onClick={() => handleMoveToCart(item.productId)}
                      disabled={updating === item.productId}
                      size="sm"
                    >
                      Move to Cart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .cart-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
        }

        .cart-page__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          gap: 1rem;
        }

        .cart-page__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .cart-page__title {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--tg-theme-text-color, #000);
        }

        .cart-page__error {
          color: #e53e3e;
          background: rgba(229, 62, 62, 0.1);
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          text-align: center;
        }

        .cart-page__empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .cart-page__empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .cart-page__empty h2 {
          margin: 0 0 0.5rem 0;
          color: var(--tg-theme-text-color, #000);
        }

        .cart-page__empty p {
          margin: 0 0 2rem 0;
          color: var(--tg-theme-hint-color, #666);
        }

        .cart-page__content {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 2rem;
        }

        .cart-page__items {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cart-page__item {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          background: var(--tg-theme-bg-color, #fff);
          border: 1px solid var(--tg-theme-secondary-bg-color, #f0f0f0);
          border-radius: 12px;
        }

        .cart-page__item-image {
          width: 120px;
          height: 120px;
          border-radius: 8px;
          overflow: hidden;
          background: var(--tg-theme-secondary-bg-color, #f5f5f5);
          cursor: pointer;
          flex-shrink: 0;
        }

        .cart-page__item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cart-page__item-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 2rem;
          color: var(--tg-theme-hint-color, #999);
        }

        .cart-page__item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .cart-page__item-name {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--tg-theme-text-color, #000);
          cursor: pointer;
          line-height: 1.3;
        }

        .cart-page__item-name:hover {
          color: var(--tg-theme-button-color, #007AFF);
        }

        .cart-page__item-description {
          margin: 0;
          font-size: 0.9rem;
          color: var(--tg-theme-hint-color, #666);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .cart-page__item-details {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .cart-page__item-price {
          font-weight: 600;
          color: var(--tg-theme-button-color, #007AFF);
          font-size: 1.1rem;
        }

        .cart-page__item-original-price {
          text-decoration: line-through;
          color: var(--tg-theme-hint-color, #999);
          font-size: 0.9rem;
        }

        .cart-page__item-delivery {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--tg-theme-hint-color, #666);
        }

        .cart-page__item-controls {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1rem;
          min-width: 150px;
        }

        .cart-page__quantity-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
          border-radius: 8px;
          padding: 0.25rem;
        }

        .cart-page__quantity-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: var(--tg-theme-button-color, #007AFF);
          color: white;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-weight: 600;
        }

        .cart-page__quantity-btn:disabled {
          background: var(--tg-theme-hint-color, #ccc);
          cursor: not-allowed;
        }

        .cart-page__quantity-display {
          min-width: 2rem;
          text-align: center;
          font-weight: 600;
        }

        .cart-page__item-total {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--tg-theme-text-color, #000);
        }

        .cart-page__item-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .cart-page__action-btn {
          background: none;
          border: none;
          color: var(--tg-theme-button-color, #007AFF);
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0.25rem 0;
          text-decoration: underline;
        }

        .cart-page__remove-btn {
          color: #e53e3e;
        }

        .cart-page__action-btn:disabled {
          color: var(--tg-theme-hint-color, #ccc);
          cursor: not-allowed;
        }

        .cart-page__summary {
          background: var(--tg-theme-bg-color, #fff);
          border: 1px solid var(--tg-theme-secondary-bg-color, #f0f0f0);
          border-radius: 12px;
          padding: 1.5rem;
          height: fit-content;
          position: sticky;
          top: 1rem;
        }

        .cart-page__summary-title {
          margin: 0 0 1rem 0;
          font-size: 1.3rem;
          font-weight: 600;
          color: var(--tg-theme-text-color, #000);
        }

        .cart-page__summary-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .cart-page__summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cart-page__discount {
          color: #38a169;
        }

        .cart-page__total {
          padding-top: 0.75rem;
          border-top: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
          font-weight: 700;
          font-size: 1.1rem;
        }

        .cart-page__savings {
          background: rgba(56, 161, 105, 0.1);
          color: #38a169;
          padding: 0.75rem;
          border-radius: 8px;
          text-align: center;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .cart-page__checkout-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .cart-page__checkout-btn {
          width: 100%;
          font-size: 1.1rem;
          padding: 1rem;
        }

        .cart-page__continue-btn {
          width: 100%;
        }

        .cart-page__saved {
          margin-top: 3rem;
          border-top: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
          padding-top: 2rem;
        }

        .cart-page__saved-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .cart-page__saved-header h3 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .cart-page__saved-toggle {
          background: none;
          border: none;
          color: var(--tg-theme-button-color, #007AFF);
          cursor: pointer;
          text-decoration: underline;
        }

        .cart-page__saved-items {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }

        .cart-page__saved-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
          border-radius: 8px;
        }

        .cart-page__saved-item-image {
          width: 60px;
          height: 60px;
          border-radius: 6px;
          overflow: hidden;
          background: var(--tg-theme-secondary-bg-color, #f5f5f5);
          flex-shrink: 0;
        }

        .cart-page__saved-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cart-page__saved-item-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 1.5rem;
          color: var(--tg-theme-hint-color, #999);
        }

        .cart-page__saved-item-info {
          flex: 1;
        }

        .cart-page__saved-item-info h4 {
          margin: 0 0 0.25rem 0;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .cart-page__saved-item-info p {
          margin: 0;
          font-weight: 600;
          color: var(--tg-theme-button-color, #007AFF);
          font-size: 0.9rem;
        }

        .cart-page__saved-item-actions {
          display: flex;
          align-items: center;
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .cart-page__content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .cart-page__summary {
            position: static;
            order: -1;
          }

          .cart-page__item {
            flex-direction: column;
            gap: 1rem;
          }

          .cart-page__item-image {
            width: 100%;
            height: 200px;
          }

          .cart-page__item-controls {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            min-width: auto;
          }

          .cart-page__item-actions {
            flex-direction: row;
            gap: 1rem;
          }

          .cart-page__saved-items {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .cart-page {
            padding: 0.5rem;
          }

          .cart-page__item {
            padding: 1rem;
          }

          .cart-page__summary {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};
