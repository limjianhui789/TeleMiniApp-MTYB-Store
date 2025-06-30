// ============================================================================
// MTYB Virtual Goods Platform - Enhanced Cart Page
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  cartService,
  type EnhancedCartItem,
  type CartSummary,
  type CartDiscount,
} from '../../services/product/CartService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';

// ============================================================================
// Interface Definitions
// ============================================================================

interface CartPageEnhancedProps {
  onCheckout?: () => void;
  onContinueShopping?: () => void;
  onProductClick?: (productId: string) => void;
}

interface CartItemComponentProps {
  item: EnhancedCartItem;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onSaveForLater: (productId: string) => void;
  onProductClick?: (productId: string) => void;
}

// ============================================================================
// Cart Item Component
// ============================================================================

const CartItemComponent: React.FC<CartItemComponentProps> = React.memo(({
  item,
  onQuantityChange,
  onRemove,
  onSaveForLater,
  onProductClick,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity === item.quantity) return;

    setIsUpdating(true);
    try {
      await onQuantityChange(item.productId, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const hasDiscount = item.priceCalculation && item.priceCalculation.totalDiscount > 0;
  const discountPercentage = hasDiscount
    ? Math.round((item.priceCalculation!.totalDiscount / item.priceCalculation!.basePrice) * 100)
    : 0;

  return (
    <div className="cart-item">
      <div className="cart-item-content">
        {/* Product Image */}
        <div className="cart-item-image">
          {item.product.images[0] ? (
            <img
              src={item.product.images[0].url}
              alt={item.product.name}
              onClick={() => onProductClick?.(item.productId)}
            />
          ) : (
            <div className="image-placeholder">📦</div>
          )}

          {!item.isAvailable && <div className="unavailable-overlay">Unavailable</div>}
        </div>

        {/* Product Info */}
        <div className="cart-item-info">
          <div className="product-header">
            <h3 className="product-name" onClick={() => onProductClick?.(item.productId)}>
              {item.product.name}
            </h3>

            {hasDiscount && <span className="discount-badge">-{discountPercentage}% OFF</span>}
          </div>

          <div className="product-details">
            <div className="category-badge" style={{ backgroundColor: '#007AFF' }}>
              {item.product.category}
            </div>

            {item.stockAlert && <div className="stock-alert">⚠️ {item.stockAlert}</div>}
          </div>

          {/* Price Information */}
          <div className="price-info">
            <div className="price-display">
              <span className="currency">{item.product.currency}</span>
              <span className="amount">{item.calculatedSubtotal.toFixed(2)}</span>
              {item.quantity > 1 && (
                <span className="unit-price">
                  (${(item.calculatedSubtotal / item.quantity).toFixed(2)} each)
                </span>
              )}
            </div>

            {item.originalSubtotal !== item.calculatedSubtotal && (
              <div className="original-price">
                <span className="currency">{item.product.currency}</span>
                <span className="amount">{item.originalSubtotal.toFixed(2)}</span>
              </div>
            )}

            {item.savings > 0 && (
              <div className="savings">
                You save: {item.product.currency} {item.savings.toFixed(2)}
              </div>
            )}
          </div>

          {/* Applied Discounts */}
          {item.priceCalculation?.discounts && item.priceCalculation.discounts.length > 0 && (
            <div className="applied-discounts">
              <h4>Applied Discounts:</h4>
              {item.priceCalculation.discounts.map((discount, index) => (
                <div key={index} className="discount-item">
                  <span className="discount-name">{discount.ruleName}</span>
                  <span className="discount-amount">
                    -{item.product.currency} {discount.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quantity and Actions */}
        <div className="cart-item-actions">
          <div className="quantity-controls">
            <label>Quantity:</label>
            <div className="quantity-selector">
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                className="quantity-btn"
              >
                -
              </button>
              <span className="quantity-display">{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={
                  isUpdating ||
                  (item.product.stock && item.quantity >= item.product.stock.available)
                }
                className="quantity-btn"
              >
                +
              </button>
            </div>
          </div>

          <div className="item-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSaveForLater(item.productId)}
              disabled={isUpdating}
            >
              💾 Save for Later
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(item.productId)}
              disabled={isUpdating}
              className="remove-btn"
            >
              🗑️ Remove
            </Button>
          </div>
        </div>
      </div>

      {isUpdating && (
        <div className="updating-overlay">
          <LoadingSpinner size="small" />
        </div>
      )}
    </div>
  );
});

// ============================================================================
// Enhanced Cart Page Component
// ============================================================================

export const CartPageEnhanced: React.FC<CartPageEnhancedProps> = ({
  onCheckout,
  onContinueShopping,
  onProductClick,
}) => {
  const { colorScheme } = useTelegramTheme();
  // ============================================================================
  // State Management
  // ============================================================================

  const [cartItems, setCartItems] = useState<EnhancedCartItem[]>([]);
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [savedItems, setSavedItems] = useState<EnhancedCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [smartDiscounts, setSmartDiscounts] = useState<CartDiscount[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // ============================================================================
  // Data Loading
  // ============================================================================

  const loadCartData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [enhancedItems, summary] = await Promise.all([
        cartService.getEnhancedCartItems(),
        Promise.resolve(cartService.getCartSummary()),
      ]);

      setCartItems(enhancedItems);
      setCartSummary(summary);

      // Load saved for later items
      const saved = cartService.getSavedForLater();
      // Convert saved items to enhanced format (simplified)
      const enhancedSaved = saved.map(item => ({
        ...item,
        originalSubtotal: item.product.price * item.quantity,
        calculatedSubtotal: item.product.price * item.quantity,
        savings: 0,
        isAvailable: true,
        lastUpdated: new Date(),
      })) as EnhancedCartItem[];
      setSavedItems(enhancedSaved);

      // Detect smart discounts
      const detectedDiscounts = await cartService.detectAndApplySmartDiscounts();
      setSmartDiscounts(detectedDiscounts);
    } catch (err) {
      setError('Failed to load cart data');
      console.error('Error loading cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCartData();

    const unsubscribe = cartService.onCartChange(() => {
      loadCartData();
    });

    return unsubscribe;
  }, [loadCartData]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleQuantityChange = async (productId: string, quantity: number) => {
    try {
      const result = await cartService.updateQuantity(productId, quantity);
      if (!result.success) {
        setError(result.error?.message || 'Failed to update quantity');
      }
    } catch (err) {
      setError('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      const result = await cartService.removeFromCart(productId);
      if (!result.success) {
        setError(result.error?.message || 'Failed to remove item');
      }
    } catch (err) {
      setError('Failed to remove item');
    }
  };

  const handleSaveForLater = async (productId: string) => {
    try {
      const result = await cartService.saveForLater(productId);
      if (!result.success) {
        setError(result.error?.message || 'Failed to save for later');
      }
    } catch (err) {
      setError('Failed to save for later');
    }
  };

  const handleMoveToCart = async (productId: string) => {
    try {
      const result = await cartService.moveFromSavedToCart(productId);
      if (!result.success) {
        setError(result.error?.message || 'Failed to move to cart');
      }
    } catch (err) {
      setError('Failed to move to cart');
    }
  };

  const handleValidateCart = async () => {
    try {
      setIsValidating(true);
      const validation = await cartService.validateCartAdvanced();

      if (!validation.isValid || validation.warnings.length > 0) {
        const messages = [...validation.errors, ...validation.warnings];
        setError(messages.join('\n'));
      } else {
        setError(null);
      }
    } catch (err) {
      setError('Failed to validate cart');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await cartService.clearCart();
      } catch (err) {
        setError('Failed to clear cart');
      }
    }
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  const analytics = useMemo(() => {
    return cartService.getCartAnalytics();
  }, [cartItems]);

  const isEmpty = cartItems.length === 0;
  const hasUnavailableItems = cartItems.some(item => !item.isAvailable);

  // ============================================================================
  // Render Methods
  // ============================================================================

  const renderCartSummary = () => {
    if (!cartSummary) return null;

    return (
      <div className="cart-summary">
        <h3>Order Summary</h3>

        <div className="summary-line">
          <span>Subtotal ({cartSummary.itemCount} items):</span>
          <span>
            {cartSummary.currency} {cartSummary.subtotal.toFixed(2)}
          </span>
        </div>

        {cartSummary.discounts.length > 0 && (
          <div className="discounts-section">
            <h4>Discounts Applied:</h4>
            {cartSummary.discounts.map(discount => (
              <div key={discount.id} className="summary-line discount">
                <span>{discount.description}:</span>
                <span>
                  -{cartSummary.currency}{' '}
                  {((cartSummary.subtotal * discount.value) / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="summary-line">
          <span>Total Savings:</span>
          <span className="savings">
            -{cartSummary.currency} {cartSummary.savings.toFixed(2)}
          </span>
        </div>

        <div className="summary-line">
          <span>Subtotal after discounts:</span>
          <span>
            {cartSummary.currency} {cartSummary.total.toFixed(2)}
          </span>
        </div>

        {cartSummary.estimatedTax && (
          <div className="summary-line">
            <span>Estimated Tax:</span>
            <span>
              {cartSummary.currency} {cartSummary.estimatedTax.toFixed(2)}
            </span>
          </div>
        )}

        <div className="summary-line total">
          <span>Total:</span>
          <span>
            {cartSummary.currency} {cartSummary.finalTotal.toFixed(2)}
          </span>
        </div>

        <div className="checkout-actions">
          <Button
            variant="primary"
            onClick={onCheckout}
            disabled={isEmpty || hasUnavailableItems}
            className="checkout-btn"
          >
            Proceed to Checkout
          </Button>

          <Button
            variant="secondary"
            onClick={onContinueShopping}
            className="continue-shopping-btn"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    if (!showAnalytics) return null;

    return (
      <div className="cart-analytics">
        <h3>Cart Analytics</h3>

        <div className="analytics-grid">
          <div className="analytics-item">
            <span className="label">Average Item Price:</span>
            <span className="value">${analytics.averageItemPrice.toFixed(2)}</span>
          </div>

          <div className="analytics-item">
            <span className="label">Price Efficiency:</span>
            <span className="value">{(analytics.priceEfficiency * 100).toFixed(1)}%</span>
          </div>

          <div className="analytics-item">
            <span className="label">Potential Savings:</span>
            <span className="value">${analytics.potentialSavings.toFixed(2)}</span>
          </div>
        </div>

        <div className="category-breakdown">
          <h4>Category Breakdown:</h4>
          {Object.entries(analytics.categoryBreakdown).map(([category, data]) => (
            <div key={category} className="category-item">
              <span className="category-name">{category}</span>
              <span className="category-stats">
                {data.count} items • ${data.value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  if (loading) {
    return (
      <div className="cart-loading">
        <LoadingSpinner />
        <p>Loading your cart...</p>
      </div>
    );
  }

  return (
    <div className="cart-page-enhanced">
      {/* Header */}
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <div className="cart-actions">
          <Button variant="ghost" size="sm" onClick={() => setShowAnalytics(!showAnalytics)}>
            📊 {showAnalytics ? 'Hide' : 'Show'} Analytics
          </Button>
          <Button variant="ghost" size="sm" onClick={handleValidateCart} disabled={isValidating}>
            {isValidating ? '🔄' : '✅'} Validate Cart
          </Button>
          {!isEmpty && (
            <Button variant="ghost" size="sm" onClick={handleClearCart} className="clear-cart-btn">
              🗑️ Clear Cart
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Smart Discounts */}
      {smartDiscounts.length > 0 && (
        <div className="smart-discounts">
          <h3>🎉 Smart Discounts Applied!</h3>
          {smartDiscounts.map(discount => (
            <div key={discount.id} className="smart-discount-item">
              <span className="discount-description">{discount.description}</span>
              <span className="discount-value">-{discount.value}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Analytics */}
      {renderAnalytics()}

      <div className="cart-content">
        {/* Cart Items */}
        <div className="cart-items-section">
          {isEmpty ? (
            <div className="empty-cart">
              <div className="empty-cart-content">
                <h2>🛒 Your cart is empty</h2>
                <p>Start shopping to add items to your cart!</p>
                <Button variant="primary" onClick={onContinueShopping}>
                  Start Shopping
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="cart-items-header">
                <h2>Cart Items ({cartItems.length})</h2>
                {hasUnavailableItems && (
                  <div className="availability-warning">⚠️ Some items are no longer available</div>
                )}
              </div>

              <div className="cart-items-list">
                {cartItems.map(item => (
                  <CartItemComponent
                    key={item.productId}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemoveItem}
                    onSaveForLater={handleSaveForLater}
                    onProductClick={onProductClick}
                  />
                ))}
              </div>
            </>
          )}

          {/* Saved for Later */}
          {savedItems.length > 0 && (
            <div className="saved-items-section">
              <h3>💾 Saved for Later ({savedItems.length})</h3>
              <div className="saved-items-list">
                {savedItems.map(item => (
                  <div key={item.productId} className="saved-item">
                    <div className="saved-item-content">
                      <div className="saved-item-info">
                        <h4>{item.product.name}</h4>
                        <p>
                          {item.product.currency} {item.product.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="saved-item-actions">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleMoveToCart(item.productId)}
                        >
                          Move to Cart
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.productId)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cart Summary */}
        {!isEmpty && <div className="cart-summary-section">{renderCartSummary()}</div>}
      </div>

      {/* Enhanced Styles */}
      <style>{`
        .cart-page-enhanced {
          padding: var(--space-4);
          max-width: var(--max-width-container);
          margin: 0 auto;
          font-family: var(--font-family-base);
          color: var(--color-text-primary);
          background: var(--color-background);
          min-height: 100vh;
        }

        .cart-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
          gap: var(--space-4);
          color: var(--color-text-secondary);
        }

        .cart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-border);
        }

        .cart-header h1 {
          margin: 0;
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .cart-actions {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .error-message {
          background: var(--color-error-background);
          border: 1px solid var(--color-error);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          margin-bottom: var(--space-4);
          display: flex;
          justify-content: space-between;
          align-items: center;
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .error-message p {
          margin: 0;
          color: var(--color-error);
          white-space: pre-line;
          font-size: var(--text-sm);
        }

        .smart-discounts {
          margin-bottom: var(--space-4);
          background: linear-gradient(45deg, var(--color-success), var(--color-success-dark));
          color: white;
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
        }

        .smart-discounts h3 {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
        }

        .smart-discount-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-2) 0;
          font-size: var(--text-sm);
        }

        .cart-analytics {
          margin-bottom: var(--space-4);
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          box-shadow: var(--shadow-sm);
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .analytics-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--tg-theme-section-separator-color, #eee);
        }

        .analytics-item .label {
          font-weight: 500;
        }

        .analytics-item .value {
          font-weight: 600;
          color: var(--tg-theme-button-color, #007AFF);
        }

        .category-breakdown h4 {
          margin: 0 0 0.5rem 0;
        }

        .category-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.25rem 0;
        }

        .cart-content {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 2rem;
          align-items: start;
        }

        .cart-items-section {
          min-width: 0;
        }

        .cart-items-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .cart-items-header h2 {
          margin: 0;
        }

        .availability-warning {
          color: #f59e0b;
          font-weight: 500;
        }

        .cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cart-item {
          position: relative;
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          box-shadow: var(--shadow-sm);
          transition: all 0.2s ease;
        }
        
        .cart-item:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--color-primary-light);
        }

        .cart-item-content {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: var(--space-4);
          align-items: start;
        }
        
        @media (max-width: 640px) {
          .cart-item-content {
            grid-template-columns: 1fr;
            gap: var(--space-3);
          }
        }

        .cart-item-image {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: var(--radius-md);
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .cart-item-image:hover {
          transform: scale(1.05);
        }
        
        @media (max-width: 640px) {
          .cart-item-image {
            width: 60px;
            height: 60px;
          }
        }

        .cart-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: var(--color-muted);
          font-size: 2rem;
          color: var(--color-text-tertiary);
        }

        .unavailable-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .cart-item-info {
          min-width: 0;
        }

        .product-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .product-name {
          margin: 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          cursor: pointer;
          color: var(--color-text-primary);
          transition: color 0.2s ease;
        }

        .product-name:hover {
          color: var(--color-primary);
        }

        .discount-badge {
          background: var(--color-error);
          color: white;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          font-weight: var(--font-weight-semibold);
        }

        .product-details {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .category-badge {
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          color: white;
          font-size: var(--text-xs);
          font-weight: var(--font-weight-medium);
        }

        .stock-alert {
          color: #f59e0b;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .price-info {
          margin-bottom: 0.5rem;
        }

        .price-display {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          margin-bottom: 0.25rem;
        }

        .price-display .currency {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .price-display .amount {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
        }

        .unit-price {
          font-size: 0.8rem;
          color: var(--tg-theme-hint-color, #666);
        }

        .original-price {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          text-decoration: line-through;
          color: var(--tg-theme-hint-color, #999);
          font-size: 0.9rem;
        }

        .savings {
          color: var(--color-success);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
        }

        .applied-discounts {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: var(--tg-theme-secondary-bg-color, #f8f9fa);
          border-radius: 6px;
        }

        .applied-discounts h4 {
          margin: 0 0 0.25rem 0;
          font-size: 0.9rem;
        }

        .discount-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
        }

        .discount-name {
          color: var(--tg-theme-text-color, #000);
        }

        .discount-amount {
          color: #22c55e;
          font-weight: 500;
        }

        .cart-item-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .quantity-controls label {
          display: block;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .quantity-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .quantity-btn {
          width: var(--touch-target-min);
          height: var(--touch-target-min);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-card-background);
          color: var(--color-text-primary);
          font-weight: var(--font-weight-semibold);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .quantity-btn:hover:not(:disabled) {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .quantity-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quantity-display {
          min-width: 2rem;
          text-align: center;
          font-weight: 600;
        }

        .item-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .remove-btn {
          color: #ef4444;
        }

        .updating-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        .empty-cart {
          text-align: center;
          padding: 3rem 1rem;
        }

        .empty-cart-content h2 {
          margin: 0 0 1rem 0;
          color: var(--tg-theme-hint-color, #666);
        }

        .empty-cart-content p {
          margin: 0 0 2rem 0;
          color: var(--tg-theme-hint-color, #666);
        }

        .saved-items-section {
          margin-top: 2rem;
        }

        .saved-items-section h3 {
          margin: 0 0 1rem 0;
        }

        .saved-items-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .saved-item-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .saved-item-info h4 {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
        }

        .saved-item-info p {
          margin: 0;
          color: var(--tg-theme-hint-color, #666);
        }

        .saved-item-actions {
          display: flex;
          gap: 0.5rem;
        }

        .cart-summary-section {
          position: sticky;
          top: var(--space-4);
          width: 320px;
        }

        .cart-summary {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          box-shadow: var(--shadow-md);
          position: sticky;
          top: var(--space-4);
        }
        
        .cart-summary h3 {
          margin: 0 0 var(--space-4) 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .summary-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-3) 0;
          border-bottom: 1px solid var(--color-border);
          font-size: var(--text-sm);
        }

        .summary-line.total {
          font-weight: var(--font-weight-bold);
          font-size: var(--text-lg);
          border-bottom: none;
          border-top: 2px solid var(--color-border);
          margin-top: var(--space-2);
          padding-top: var(--space-4);
          color: var(--color-text-primary);
        }

        .summary-line.discount {
          color: var(--color-success);
        }

        .summary-line .savings {
          color: var(--color-success);
          font-weight: var(--font-weight-semibold);
        }

        .discounts-section {
          margin: 0.5rem 0;
        }

        .discounts-section h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
        }

        .checkout-actions {
          margin-top: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .checkout-btn {
          width: 100%;
          padding: var(--space-4);
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          min-height: var(--touch-target-min);
        }

        .continue-shopping-btn {
          width: 100%;
          min-height: var(--touch-target-min);
        }

        @media (max-width: 768px) {
          .cart-page-enhanced {
            padding: var(--space-3);
          }

          .cart-header {
            flex-direction: column;
            gap: var(--space-4);
            align-items: stretch;
          }

          .cart-actions {
            justify-content: center;
          }

          .cart-content {
            grid-template-columns: 1fr;
            gap: var(--space-4);
          }

          .cart-summary-section {
            position: static;
            width: auto;
            order: -1;
          }

          .cart-summary {
            position: static;
          }

          .cart-item-content {
            grid-template-columns: 1fr;
            gap: var(--space-3);
          }

          .cart-item-image {
            width: 100%;
            height: 160px;
            max-width: 200px;
            margin: 0 auto;
          }

          .cart-item-actions {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }

          .item-actions {
            flex-direction: row;
            gap: var(--space-2);
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .smart-discounts,
          .cart-analytics {
            margin-left: calc(-1 * var(--space-3));
            margin-right: calc(-1 * var(--space-3));
            border-radius: 0;
          }
        }

        @media (max-width: 480px) {
          .cart-page-enhanced {
            padding: var(--space-2);
          }

          .cart-header h1 {
            font-size: var(--text-xl);
          }

          .cart-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .cart-item {
            padding: var(--space-3);
          }

          .cart-summary {
            padding: var(--space-4);
          }
        }
      `}</style>
    </div>
  );
};
