import React, { useState, useEffect } from 'react';
import type { Product } from '../../types';
import { productService, categoryService, cartService } from '../../services/product';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface ProductDetailPageProps {
  productId: string;
  onBack?: () => void;
  onAddToCart?: (productId: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onBack,
  onAddToCart,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInCart, setIsInCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();

    const unsubscribe = cartService.onCartChange(cart => {
      setIsInCart(cart.items.some(item => item.productId === productId));
    });

    return unsubscribe;
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await productService.getProductById(productId);

      if (!productData) {
        setError('Product not found');
        return;
      }

      setProduct(productData);
      setIsInCart(cartService.isInCart(productId));
    } catch (err) {
      setError('Failed to load product');
      console.error('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      const result = await cartService.addToCart(productId, quantity);
      if (result.success) {
        cartService.saveToStorage();
        if (onAddToCart) {
          onAddToCart(productId);
        }
      } else {
        console.error('Failed to add to cart:', result.error?.message);
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  if (loading) {
    return (
      <div className="product-detail__loading">
        <LoadingSpinner />
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail__error">
        <h2>Product Not Found</h2>
        <p>{error || 'The requested product could not be found.'}</p>
        {onBack && <Button onClick={onBack}>Back to Products</Button>}
      </div>
    );
  }

  const categoryInfo = categoryService.getCategoryBadgeProps(product.category);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const isOutOfStock = product.stock && product.stock.available <= 0;
  const maxQuantity = Math.min(product.stock?.available || 1, 10);

  return (
    <div className="product-detail">
      {/* Header */}
      <div className="product-detail__header">
        {onBack && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onBack}
            className="product-detail__back-button"
          >
            ← Back
          </Button>
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

            {/* Badges */}
            {product.isFeatured && (
              <div className="product-detail__featured-badge">⭐ Featured</div>
            )}

            {hasDiscount && (
              <div className="product-detail__discount-badge">-{discountPercentage}% OFF</div>
            )}

            {isOutOfStock && (
              <div className="product-detail__out-of-stock-overlay">Out of Stock</div>
            )}
          </div>

          {/* Image Thumbnails */}
          {product.images.length > 1 && (
            <div className="product-detail__thumbnails">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  className={`product-detail__thumbnail ${
                    index === selectedImageIndex ? 'active' : ''
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
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

          {/* Title */}
          <h1 className="product-detail__title">{product.name}</h1>

          {/* Price */}
          <div className="product-detail__price-section">
            <div className="product-detail__price">
              <span className="product-detail__currency">{product.currency}</span>
              <span className="product-detail__amount">{product.price.toFixed(2)}</span>
            </div>

            {hasDiscount && (
              <div className="product-detail__original-price">
                <span className="product-detail__currency">{product.currency}</span>
                <span className="product-detail__amount">{product.originalPrice!.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <Card className="product-detail__description-card">
            <h3>Description</h3>
            <p className="product-detail__description">{product.description}</p>
          </Card>

          {/* Features/Metadata */}
          {Object.keys(product.metadata).length > 0 && (
            <Card className="product-detail__features-card">
              <h3>Features</h3>
              <div className="product-detail__features">
                {Object.entries(product.metadata).map(([key, value]) => (
                  <div key={key} className="product-detail__feature">
                    <span className="product-detail__feature-label">
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                    </span>
                    <span className="product-detail__feature-value">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="product-detail__tags-section">
              <h3>Tags</h3>
              <div className="product-detail__tags">
                {product.tags.map((tag, index) => (
                  <span key={index} className="product-detail__tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Info */}
          <Card className="product-detail__delivery-card">
            <h3>Delivery Information</h3>
            <div className="product-detail__delivery">
              <div className="product-detail__delivery-type">
                <span className="product-detail__delivery-icon">
                  {product.deliveryInfo.type === 'instant'
                    ? '⚡'
                    : product.deliveryInfo.type === 'manual'
                      ? '👤'
                      : '📅'}
                </span>
                <span>
                  {product.deliveryInfo.type === 'instant'
                    ? 'Instant Delivery'
                    : product.deliveryInfo.type === 'manual'
                      ? 'Manual Delivery'
                      : 'Scheduled Delivery'}
                </span>
              </div>
              <div className="product-detail__delivery-time">
                <strong>Estimated Time:</strong> {product.deliveryInfo.estimatedTime}
              </div>
              {product.deliveryInfo.instructions && (
                <div className="product-detail__delivery-instructions">
                  <strong>Instructions:</strong> {product.deliveryInfo.instructions}
                </div>
              )}
            </div>
          </Card>

          {/* Stock Info */}
          {product.stock && (
            <div className="product-detail__stock-info">
              {product.stock.available > 0 ? (
                <span className="product-detail__stock-available">
                  ✅ {product.stock.available} in stock
                </span>
              ) : (
                <span className="product-detail__stock-out">❌ Out of stock</span>
              )}
            </div>
          )}

          {/* Quantity and Add to Cart */}
          {!isOutOfStock && (
            <div className="product-detail__actions">
              <div className="product-detail__quantity">
                <label htmlFor="quantity">Quantity:</label>
                <select
                  id="quantity"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="product-detail__quantity-select"
                >
                  {Array.from({ length: maxQuantity }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant={isInCart ? 'secondary' : 'primary'}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="product-detail__add-to-cart"
              >
                {isInCart ? 'Add More to Cart' : 'Add to Cart'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .product-detail {
          padding: 1rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .product-detail__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          gap: 1rem;
        }

        .product-detail__error {
          text-align: center;
          padding: 3rem 1rem;
        }

        .product-detail__header {
          margin-bottom: 1rem;
        }

        .product-detail__back-button {
          margin-bottom: 1rem;
        }

        .product-detail__content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
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
          border-radius: 12px;
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
          font-size: 5rem;
          color: var(--tg-theme-hint-color, #999);
        }

        .product-detail__featured-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: linear-gradient(45deg, #ffd700, #ffed4e);
          color: #333;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 0.85rem;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .product-detail__discount-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #e53e3e;
          color: white;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 0.85rem;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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
          font-size: 1.2rem;
        }

        .product-detail__thumbnails {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 0.25rem 0;
        }

        .product-detail__thumbnail {
          min-width: 60px;
          height: 60px;
          border: 2px solid transparent;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          background: none;
          padding: 0;
          transition: border-color 0.2s ease;
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
          gap: 6px;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 0.85rem;
          font-weight: 600;
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
        }

        .product-detail__price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          font-weight: 700;
          color: var(--tg-theme-button-color, #007AFF);
        }

        .product-detail__currency {
          font-size: 1.2rem;
        }

        .product-detail__amount {
          font-size: 2.5rem;
        }

        .product-detail__original-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          text-decoration: line-through;
          color: var(--tg-theme-hint-color, #999);
          font-size: 1.2rem;
        }

        .product-detail__description-card h3,
        .product-detail__features-card h3,
        .product-detail__delivery-card h3 {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--tg-theme-text-color, #000);
        }

        .product-detail__description {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--tg-theme-text-color, #000);
          margin: 0;
        }

        .product-detail__features {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .product-detail__feature {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--tg-theme-hint-color, #eee);
        }

        .product-detail__feature:last-child {
          border-bottom: none;
        }

        .product-detail__feature-label {
          font-weight: 500;
          color: var(--tg-theme-text-color, #000);
        }

        .product-detail__feature-value {
          color: var(--tg-theme-hint-color, #666);
        }

        .product-detail__tags-section h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--tg-theme-text-color, #000);
        }

        .product-detail__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .product-detail__tag {
          padding: 4px 8px;
          background: var(--tg-theme-secondary-bg-color, #f0f0f0);
          border-radius: 12px;
          font-size: 0.8rem;
          color: var(--tg-theme-text-color, #333);
        }

        .product-detail__delivery {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .product-detail__delivery-type {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .product-detail__delivery-icon {
          font-size: 1.2rem;
        }

        .product-detail__delivery-time,
        .product-detail__delivery-instructions {
          font-size: 0.9rem;
          color: var(--tg-theme-hint-color, #666);
        }

        .product-detail__stock-info {
          font-weight: 500;
        }

        .product-detail__stock-available {
          color: #38a169;
        }

        .product-detail__stock-out {
          color: #e53e3e;
        }

        .product-detail__actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.5rem;
          background: var(--tg-theme-secondary-bg-color, #f8f9fa);
          border-radius: 12px;
        }

        .product-detail__quantity {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .product-detail__quantity label {
          font-weight: 500;
          color: var(--tg-theme-text-color, #000);
        }

        .product-detail__quantity-select {
          padding: 0.5rem;
          border: 1px solid var(--tg-theme-hint-color, #ddd);
          border-radius: 6px;
          background: var(--tg-theme-bg-color, #fff);
          color: var(--tg-theme-text-color, #000);
        }

        .product-detail__add-to-cart {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .product-detail {
            padding: 0.5rem;
          }

          .product-detail__content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .product-detail__main-image {
            height: 300px;
          }

          .product-detail__title {
            font-size: 1.5rem;
          }

          .product-detail__amount {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};
