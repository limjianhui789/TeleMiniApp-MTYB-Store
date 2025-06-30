import React, { useState, useEffect } from 'react';
import type { Product } from '../../types';
import { productService } from '../../services/product/ProductService';
import { categoryService } from '../../services/product/CategoryService';
import { cartService } from '../../services/product/CartService';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ProductDetailProps {
  productId: string;
  onBack?: () => void;
  onAddToCart?: (productId: string, quantity: number) => void;
  className?: string;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  productId,
  onBack,
  onAddToCart,
  className = '',
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadProduct();

    // Listen to cart changes
    const unsubscribe = cartService.onCartChange(cartState => {
      const cartItem = cartState.items.find(item => item.productId === productId);
      setIsInCart(!!cartItem);
      setCartQuantity(cartItem?.quantity || 0);
    });

    return unsubscribe;
  }, [productId]);

  useEffect(() => {
    if (product) {
      loadRelatedProducts();
    }
  }, [product]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const loadedProduct = await productService.getProductById(productId);

      if (!loadedProduct) {
        setError('Product not found');
        return;
      }

      setProduct(loadedProduct);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedProducts = async () => {
    if (!product) return;

    try {
      const categoryProducts = await productService.getProductsByCategory(product.category);
      const filtered = categoryProducts.filter(p => p.id !== product.id).slice(0, 4);
      setRelatedProducts(filtered);
    } catch (err) {
      console.error('Failed to load related products:', err);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setAddingToCart(true);
      setError(null);

      const result = await cartService.addToCart(productId, quantity);

      if (result.success) {
        if (onAddToCart) {
          onAddToCart(productId, quantity);
        }
      } else {
        setError(result.error?.message || 'Failed to add to cart');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleUpdateCartQuantity = async (newQuantity: number) => {
    try {
      const result = await cartService.updateQuantity(productId, newQuantity);
      if (!result.success) {
        setError(result.error?.message || 'Failed to update quantity');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity');
    }
  };

  const handleRemoveFromCart = async () => {
    try {
      const result = await cartService.removeFromCart(productId);
      if (!result.success) {
        setError(result.error?.message || 'Failed to remove from cart');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from cart');
    }
  };

  if (loading) {
    return (
      <div className="product-detail__loading">
        <LoadingSpinner size="large" />
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail__error">
        <h2>❌ Error</h2>
        <p>{error || 'Product not found'}</p>
        <div className="product-detail__error-actions">
          {onBack && (
            <Button onClick={onBack} variant="secondary">
              Go Back
            </Button>
          )}
          <Button onClick={loadProduct} variant="primary">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const categoryInfo = categoryService.getCategoryBadgeProps(product.category);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;
  const savings = hasDiscount ? product.originalPrice! - product.price : 0;
  const isOutOfStock = product.stock && product.stock.available <= 0;
  const isLowStock = product.stock && product.stock.available <= product.stock.lowStockThreshold;

  return (
    <div className={`product-detail ${className}`}>
      {/* Header */}
      <div className="product-detail__header">
        {onBack && (
          <Button onClick={onBack} variant="ghost" size="sm" className="product-detail__back-btn">
            ← Back
          </Button>
        )}

        {product.isFeatured && (
          <div className="product-detail__featured-badge">⭐ Featured Product</div>
        )}
      </div>

      <div className="product-detail__content">
        {/* Product Images */}
        <div className="product-detail__images">
          <div className="product-detail__main-image">
            {product.images.length > 0 ? (
              <img
                src={
                  product.images[selectedImageIndex]?.url ||
                  product.images[0]?.url ||
                  '/images/placeholder-product.png'
                }
                alt={product.images[selectedImageIndex]?.alt || product.name}
                className="product-detail__image"
                onError={e => {
                  (e.target as HTMLImageElement).src = '/images/placeholder-product.png';
                }}
              />
            ) : (
              <div className="product-detail__image-placeholder">{categoryInfo.icon}</div>
            )}

            {hasDiscount && (
              <div className="product-detail__discount-badge">-{discountPercentage}%</div>
            )}

            {isOutOfStock && (
              <div className="product-detail__out-of-stock-overlay">Out of Stock</div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="product-detail__image-thumbnails">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`product-detail__thumbnail ${
                    index === selectedImageIndex ? 'active' : ''
                  }`}
                >
                  <img src={image.url} alt={image.alt} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-detail__info">
          {/* Category */}
          <div className="product-detail__category" style={{ backgroundColor: categoryInfo.color }}>
            {categoryInfo.icon} {categoryInfo.text}
          </div>

          {/* Product Name */}
          <h1 className="product-detail__title">{product.name}</h1>

          {/* Price Section */}
          <div className="product-detail__price-section">
            <div className="product-detail__price">
              <span className="product-detail__currency">{product.currency}</span>
              <span className="product-detail__amount">{product.price.toFixed(2)}</span>
            </div>

            {hasDiscount && (
              <>
                <div className="product-detail__original-price">
                  <span className="product-detail__currency">{product.currency}</span>
                  <span className="product-detail__amount">
                    {product.originalPrice!.toFixed(2)}
                  </span>
                </div>
                <div className="product-detail__savings">
                  Save {product.currency} {savings.toFixed(2)}
                </div>
              </>
            )}
          </div>

          {/* Stock Status */}
          {product.stock && (
            <div className="product-detail__stock">
              {isOutOfStock ? (
                <span className="product-detail__stock-out">❌ Out of Stock</span>
              ) : isLowStock ? (
                <span className="product-detail__stock-low">
                  ⚠️ Only {product.stock.available} left in stock
                </span>
              ) : (
                <span className="product-detail__stock-available">
                  ✅ {product.stock.available} available
                </span>
              )}
            </div>
          )}

          {/* Delivery Info */}
          <div className="product-detail__delivery">
            <div className="product-detail__delivery-icon">
              {product.deliveryInfo.type === 'instant' ? '⚡' : '📦'}
            </div>
            <div className="product-detail__delivery-text">
              <strong>Delivery:</strong> {product.deliveryInfo.estimatedTime}
              {product.deliveryInfo.instructions && (
                <div className="product-detail__delivery-instructions">
                  {product.deliveryInfo.instructions}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="product-detail__description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="product-detail__tags">
              <h4>Tags</h4>
              <div className="product-detail__tag-list">
                {product.tags.map((tag, index) => (
                  <span key={index} className="product-detail__tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {Object.keys(product.metadata).length > 0 && (
            <div className="product-detail__metadata">
              <h4>Product Details</h4>
              <div className="product-detail__metadata-list">
                {Object.entries(product.metadata).map(([key, value]) => (
                  <div key={key} className="product-detail__metadata-item">
                    <span className="product-detail__metadata-key">
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </span>
                    <span className="product-detail__metadata-value">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="product-detail__actions">
            {!isInCart ? (
              <div className="product-detail__add-to-cart">
                {!isOutOfStock && (
                  <div className="product-detail__quantity-selector">
                    <label>Quantity:</label>
                    <div className="product-detail__quantity-controls">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="product-detail__quantity-btn"
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="product-detail__quantity-display">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="product-detail__quantity-btn"
                        disabled={product.stock ? quantity >= product.stock.available : false}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || addingToCart}
                  loading={addingToCart}
                  size="lg"
                  className="product-detail__add-btn"
                >
                  {isOutOfStock
                    ? 'Out of Stock'
                    : `Add to Cart • ${product.currency} ${(product.price * quantity).toFixed(2)}`}
                </Button>
              </div>
            ) : (
              <div className="product-detail__cart-controls">
                <div className="product-detail__in-cart-notice">✅ In Cart ({cartQuantity})</div>
                <div className="product-detail__cart-buttons">
                  <div className="product-detail__quantity-controls">
                    <button
                      onClick={() => handleUpdateCartQuantity(cartQuantity - 1)}
                      className="product-detail__quantity-btn"
                      disabled={cartQuantity <= 1}
                    >
                      -
                    </button>
                    <span className="product-detail__quantity-display">{cartQuantity}</span>
                    <button
                      onClick={() => handleUpdateCartQuantity(cartQuantity + 1)}
                      className="product-detail__quantity-btn"
                      disabled={product.stock ? cartQuantity >= product.stock.available : false}
                    >
                      +
                    </button>
                  </div>
                  <Button onClick={handleRemoveFromCart} variant="destructive" size="sm">
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>

          {error && <div className="product-detail__error-message">❌ {error}</div>}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="product-detail__related">
          <h3>Related Products</h3>
          <div className="product-detail__related-grid">
            {relatedProducts.map(relatedProduct => (
              <div key={relatedProduct.id} className="product-detail__related-item">
                <div className="product-detail__related-image">
                  {relatedProduct.images[0] ? (
                    <img src={relatedProduct.images[0].url} alt={relatedProduct.name} />
                  ) : (
                    <div className="product-detail__related-placeholder">
                      {categoryService.getCategoryBadgeProps(relatedProduct.category).icon}
                    </div>
                  )}
                </div>
                <div className="product-detail__related-info">
                  <h4>{relatedProduct.name}</h4>
                  <p className="product-detail__related-price">
                    {relatedProduct.currency} {relatedProduct.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .product-detail {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
        }

        .product-detail__loading,
        .product-detail__error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
          gap: 1rem;
        }

        .product-detail__error-actions {
          display: flex;
          gap: 1rem;
        }

        .product-detail__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .product-detail__featured-badge {
          background: linear-gradient(45deg, #ffd700, #ffed4e);
          color: #333;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .product-detail__content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          margin-bottom: 3rem;
        }

        .product-detail__images {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .product-detail__main-image {
          position: relative;
          width: 100%;
          height: 400px;
          border-radius: 16px;
          overflow: hidden;
          background: var(--tg-theme-secondary-bg-color, #f5f5f5);
        }

        .product-detail__image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-detail__image-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 6rem;
          color: var(--tg-theme-hint-color, #999);
        }

        .product-detail__discount-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: #e53e3e;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 1rem;
        }

        .product-detail__out-of-stock-overlay {
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
          font-weight: 600;
          font-size: 1.5rem;
        }

        .product-detail__image-thumbnails {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
        }

        .product-detail__thumbnail {
          width: 80px;
          height: 80px;
          border: 2px solid transparent;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          background: none;
          padding: 0;
          flex-shrink: 0;
        }

        .product-detail__thumbnail.active {
          border-color: var(--tg-theme-button-color, #007AFF);
        }

        .product-detail__thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-detail__info {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .product-detail__category {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 500;
          color: white;
          width: fit-content;
        }

        .product-detail__title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0;
          color: var(--tg-theme-text-color, #000);
          line-height: 1.2;
        }

        .product-detail__price-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .product-detail__price {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          font-weight: 700;
          color: var(--tg-theme-button-color, #007AFF);
        }

        .product-detail__currency {
          font-size: 1.2rem;
        }

        .product-detail__amount {
          font-size: 2rem;
        }

        .product-detail__original-price {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          text-decoration: line-through;
          color: var(--tg-theme-hint-color, #999);
          font-size: 1.2rem;
        }

        .product-detail__savings {
          background: #38a169;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .product-detail__stock {
          font-weight: 500;
        }

        .product-detail__stock-available {
          color: #38a169;
        }

        .product-detail__stock-low {
          color: #ed8936;
        }

        .product-detail__stock-out {
          color: #e53e3e;
        }

        .product-detail__delivery {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: var(--tg-theme-secondary-bg-color, #f8f9fa);
          border-radius: 12px;
        }

        .product-detail__delivery-icon {
          font-size: 1.5rem;
        }

        .product-detail__delivery-text {
          flex: 1;
        }

        .product-detail__delivery-instructions {
          font-size: 0.9rem;
          color: var(--tg-theme-hint-color, #666);
          margin-top: 0.25rem;
        }

        .product-detail__description h3,
        .product-detail__tags h4,
        .product-detail__metadata h4 {
          margin: 0 0 0.75rem 0;
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--tg-theme-text-color, #000);
        }

        .product-detail__description p {
          margin: 0;
          line-height: 1.6;
          color: var(--tg-theme-text-color, #333);
        }

        .product-detail__tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .product-detail__tag {
          padding: 0.25rem 0.75rem;
          background: var(--tg-theme-secondary-bg-color, #f0f0f0);
          border-radius: 16px;
          font-size: 0.85rem;
          color: var(--tg-theme-text-color, #333);
        }

        .product-detail__metadata-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .product-detail__metadata-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--tg-theme-secondary-bg-color, #f0f0f0);
        }

        .product-detail__metadata-key {
          font-weight: 500;
          color: var(--tg-theme-text-color, #333);
        }

        .product-detail__metadata-value {
          color: var(--tg-theme-hint-color, #666);
        }

        .product-detail__actions {
          margin-top: auto;
        }

        .product-detail__add-to-cart {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .product-detail__quantity-selector {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .product-detail__quantity-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
          border-radius: 8px;
          padding: 0.25rem;
        }

        .product-detail__quantity-btn {
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

        .product-detail__quantity-btn:disabled {
          background: var(--tg-theme-hint-color, #ccc);
          cursor: not-allowed;
        }

        .product-detail__quantity-display {
          min-width: 2rem;
          text-align: center;
          font-weight: 600;
        }

        .product-detail__add-btn {
          width: 100%;
          font-size: 1.1rem;
          padding: 1rem;
        }

        .product-detail__cart-controls {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .product-detail__in-cart-notice {
          color: #38a169;
          font-weight: 600;
          text-align: center;
          padding: 0.75rem;
          background: rgba(56, 161, 105, 0.1);
          border-radius: 8px;
        }

        .product-detail__cart-buttons {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .product-detail__error-message {
          color: #e53e3e;
          font-weight: 500;
          padding: 0.75rem;
          background: rgba(229, 62, 62, 0.1);
          border-radius: 8px;
          text-align: center;
        }

        .product-detail__related {
          margin-top: 3rem;
        }

        .product-detail__related h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .product-detail__related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .product-detail__related-item {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          border: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .product-detail__related-item:hover {
          transform: translateY(-2px);
        }

        .product-detail__related-image {
          width: 100%;
          height: 120px;
          border-radius: 8px;
          overflow: hidden;
          background: var(--tg-theme-secondary-bg-color, #f5f5f5);
        }

        .product-detail__related-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-detail__related-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 2rem;
          color: var(--tg-theme-hint-color, #999);
        }

        .product-detail__related-info h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--tg-theme-text-color, #000);
        }

        .product-detail__related-price {
          margin: 0;
          font-weight: 600;
          color: var(--tg-theme-button-color, #007AFF);
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .product-detail__content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .product-detail__main-image {
            height: 300px;
          }

          .product-detail__title {
            font-size: 1.5rem;
          }

          .product-detail__price .product-detail__amount {
            font-size: 1.5rem;
          }

          .product-detail__delivery {
            flex-direction: column;
            gap: 0.5rem;
          }

          .product-detail__related-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .product-detail {
            padding: 0.5rem;
          }

          .product-detail__content {
            gap: 1.5rem;
          }

          .product-detail__main-image {
            height: 250px;
          }

          .product-detail__related-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
