import React from 'react';
import type { Product } from '../../types';
import { categoryService } from '../../services/product';
import { Button } from '../ui/Button';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  showAddToCart?: boolean;
  isInCart?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  showAddToCart = true,
  isInCart = false,
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();
  const categoryInfo = categoryService.getCategoryBadgeProps(product.category);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const isOutOfStock = product.stock && product.stock.available <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart && !isOutOfStock) {
      onAddToCart(product.id);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(product.id);
    }
  };

  return (
    <div
      className={`product-card ${className} ${isOutOfStock ? 'out-of-stock' : ''}`}
      onClick={handleViewDetails}
    >
      <div className="product-card__content">
        {/* Product Image */}
        <div className="product-card__image-container">
          {product.images[0] ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].alt}
              className="product-card__image"
              onError={e => {
                (e.target as HTMLImageElement).src = '/images/placeholder-product.png';
              }}
            />
          ) : (
            <div className="product-card__placeholder">{categoryInfo.icon}</div>
          )}

          {/* Featured Badge */}
          {product.isFeatured && <div className="product-card__featured-badge">⭐ Featured</div>}

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="product-card__discount-badge">-{discountPercentage}%</div>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && <div className="product-card__out-of-stock-overlay">Out of Stock</div>}
        </div>

        {/* Product Info */}
        <div className="product-card__info">
          {/* Category Badge */}
          <div className="product-card__category" style={{ backgroundColor: categoryInfo.color }}>
            {categoryInfo.icon} {categoryInfo.text}
          </div>

          {/* Product Name */}
          <h3 className="product-card__title">{product.name}</h3>

          {/* Product Description */}
          <p className="product-card__description">
            {product.shortDescription || product.description}
          </p>

          {/* Product Tags */}
          {product.tags.length > 0 && (
            <div className="product-card__tags">
              {product.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="product-card__tag">
                  {tag}
                </span>
              ))}
              {product.tags.length > 3 && (
                <span className="product-card__tag-more">+{product.tags.length - 3} more</span>
              )}
            </div>
          )}

          {/* Delivery Info */}
          <div className="product-card__delivery">
            <span className="product-card__delivery-icon">
              {product.deliveryInfo.type === 'instant' ? '⚡' : '📦'}
            </span>
            <span className="product-card__delivery-text">
              {product.deliveryInfo.estimatedTime}
            </span>
          </div>

          {/* Price Section */}
          <div className="product-card__price-section">
            <div className="product-card__price">
              <span className="product-card__currency">{product.currency}</span>
              <span className="product-card__amount">{product.price.toFixed(2)}</span>
            </div>

            {hasDiscount && (
              <div className="product-card__original-price">
                <span className="product-card__currency">{product.currency}</span>
                <span className="product-card__amount">{product.originalPrice!.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Stock Info */}
          {product.stock && (
            <div className="product-card__stock">
              {product.stock.available > 0 ? (
                <span className="product-card__stock-available">
                  {product.stock.available} available
                </span>
              ) : (
                <span className="product-card__stock-out">Out of stock</span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {showAddToCart && (
            <div className="product-card__actions">
              <Button
                variant={isInCart ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="product-card__add-to-cart"
              >
                {isOutOfStock ? 'Out of Stock' : isInCart ? 'In Cart' : 'Add to Cart'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .product-card {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          transition: all 0.2s ease;
          height: 100%;
          box-shadow: var(--shadow-sm);
          cursor: pointer;
          font-family: var(--font-family-base);
        }

        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
          border-color: var(--color-primary-light);
        }

        .product-card.out-of-stock {
          opacity: 0.7;
        }

        .product-card__content {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .product-card__image-container {
          position: relative;
          width: 100%;
          height: 200px;
          margin-bottom: var(--space-4);
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--color-muted);
        }

        .product-card__image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-card__placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 3rem;
          color: var(--color-text-tertiary);
        }

        .product-card__featured-badge {
          position: absolute;
          top: var(--space-2);
          left: var(--space-2);
          background: linear-gradient(45deg, var(--color-warning), var(--color-warning-light));
          color: var(--color-text-primary);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: var(--font-weight-semibold);
          box-shadow: var(--shadow-sm);
        }

        .product-card__discount-badge {
          position: absolute;
          top: var(--space-2);
          right: var(--space-2);
          background: var(--color-error);
          color: white;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: var(--font-weight-semibold);
          box-shadow: var(--shadow-sm);
        }

        .product-card__out-of-stock-overlay {
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
          font-size: 1.1rem;
        }

        .product-card__info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .product-card__category {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: var(--font-weight-medium);
          color: white;
          width: fit-content;
        }

        .product-card__title {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          margin: 0;
          color: var(--color-text-primary);
          line-height: var(--leading-tight);
        }

        .product-card__description {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          margin: 0;
          line-height: var(--leading-normal);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-card__tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-1);
        }

        .product-card__tag {
          padding: var(--space-1) var(--space-2);
          background: var(--color-muted);
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
        }

        .product-card__tag-more {
          padding: var(--space-1) var(--space-2);
          background: var(--color-text-tertiary);
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          color: white;
        }

        .product-card__delivery {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .product-card__delivery-icon {
          font-size: 1rem;
        }

        .product-card__price-section {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-top: auto;
        }

        .product-card__price {
          display: flex;
          align-items: baseline;
          gap: var(--space-1);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
        }

        .product-card__currency {
          font-size: var(--text-sm);
        }

        .product-card__amount {
          font-size: var(--text-xl);
        }

        .product-card__original-price {
          display: flex;
          align-items: baseline;
          gap: var(--space-1);
          text-decoration: line-through;
          color: var(--color-text-tertiary);
          font-size: var(--text-sm);
        }

        .product-card__stock {
          font-size: var(--text-xs);
        }

        .product-card__stock-available {
          color: var(--color-success);
        }

        .product-card__stock-out {
          color: var(--color-error);
        }

        .product-card__actions {
          margin-top: var(--space-2);
        }

        .product-card__add-to-cart {
          width: 100%;
          min-height: var(--touch-target-min);
        }
        
        @media (max-width: 640px) {
          .product-card {
            padding: var(--space-3);
          }
          
          .product-card__image-container {
            height: 160px;
          }
          
          .product-card__title {
            font-size: var(--text-base);
          }
          
          .product-card__description {
            -webkit-line-clamp: 1;
          }
        }
      `}</style>
    </div>
  );
};
