// ============================================================================
// MTYB Virtual Goods Platform - Enhanced Product Detail Page
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product } from '../../types';
import {
  productService,
  categoryService,
  cartService,
  tagService,
  priceService,
  inventoryService,
  type CategoryInfo,
  type ProductTag,
  type PriceCalculationResult,
  type StockAlert,
} from '../../services/product';
import { pluginManager } from '../../core/plugin/PluginManager';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

// ============================================================================
// Enhanced Interface Definitions
// ============================================================================

interface ProductDetailPageEnhancedProps {
  productId: string;
  onBack?: () => void;
  onAddToCart?: (productId: string) => void;
  onEditProduct?: (productId: string) => void;
}

interface ProductEnhancedData {
  product: Product;
  categoryInfo: CategoryInfo;
  tags: ProductTag[];
  priceCalculation: PriceCalculationResult;
  stockAlerts: StockAlert[];
  pluginInfo?: {
    name: string;
    version: string;
    description: string;
    features: string[];
    isActive: boolean;
  };
  availability: {
    available: boolean;
    reason?: string;
  };
}

// ============================================================================
// Enhanced Product Detail Page Component
// ============================================================================

export const ProductDetailPageEnhanced: React.FC<ProductDetailPageEnhancedProps> = ({
  productId,
  onBack,
  onAddToCart,
  onEditProduct,
}) => {
  // ============================================================================
  // State Management
  // ============================================================================

  const [productData, setProductData] = useState<ProductEnhancedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInCart, setIsInCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    description: true,
    features: false,
    delivery: false,
    plugin: false,
    pricing: false,
    inventory: false,
  });

  // ============================================================================
  // Data Loading
  // ============================================================================

  const loadProductData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load product data
      const product = await productService.getProductById(productId);
      if (!product) {
        setError('Product not found');
        return;
      }

      // Load enhanced data in parallel
      const [categoryInfo, productTags, priceCalcResult, stockAlertsResult, availabilityResult] =
        await Promise.all([
          categoryService.getCategoryBadgeProps(product.category),
          tagService.getTagsByIds(product.tags),
          priceService.calculatePrice({ product, quantity: 1 }),
          inventoryService.checkStockLevels([product]),
          inventoryService.checkPluginProductAvailability(product),
        ]);

      // Get plugin information if available
      let pluginInfo: ProductEnhancedData['pluginInfo'];
      if (product.pluginId) {
        try {
          const plugin = pluginManager.getPlugin(product.pluginId);
          if (plugin) {
            pluginInfo = {
              name: plugin.name,
              version: plugin.version,
              description: plugin.description || 'No description available',
              features: plugin.features || [],
              isActive: plugin.isActive,
            };
          }
        } catch (pluginError) {
          console.warn('Failed to get plugin info:', pluginError);
        }
      }

      const enhancedData: ProductEnhancedData = {
        product,
        categoryInfo,
        tags: productTags,
        priceCalculation: priceCalcResult.success
          ? priceCalcResult.data!
          : {
              basePrice: product.price,
              finalPrice: product.price,
              appliedRules: [],
              discounts: [],
              totalDiscount: 0,
            },
        stockAlerts: stockAlertsResult.filter(alert => alert.productId === productId),
        pluginInfo,
        availability: availabilityResult,
      };

      setProductData(enhancedData);
      setIsInCart(cartService.isInCart(productId));
    } catch (err) {
      setError('Failed to load product data');
      console.error('Error loading enhanced product data:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProductData();

    const unsubscribe = cartService.onCartChange(cart => {
      setIsInCart(cart.items.some(item => item.productId === productId));
    });

    return unsubscribe;
  }, [loadProductData, productId]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleAddToCart = async () => {
    if (!productData) return;

    try {
      const result = await cartService.addToCart(productId, quantity);
      if (result.success) {
        cartService.saveToStorage();
        if (onAddToCart) {
          onAddToCart(productId);
        }
      } else {
        setError(result.error?.message || 'Failed to add to cart');
      }
    } catch (err) {
      setError('Error adding to cart');
      console.error('Error adding to cart:', err);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const refreshProductData = () => {
    loadProductData();
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  const computedValues = useMemo(() => {
    if (!productData) return null;

    const { product, priceCalculation } = productData;
    const hasDiscount = priceCalculation.totalDiscount > 0;
    const discountPercentage = hasDiscount
      ? Math.round((priceCalculation.totalDiscount / priceCalculation.basePrice) * 100)
      : 0;

    const isOutOfStock =
      !productData.availability.available || (product.stock && product.stock.available <= 0);
    const maxQuantity = Math.min(product.stock?.available || 1, 10);

    const hasStockIssues = productData.stockAlerts.length > 0;

    return {
      hasDiscount,
      discountPercentage,
      isOutOfStock,
      maxQuantity,
      hasStockIssues,
    };
  }, [productData]);

  // ============================================================================
  // Render Helper Functions
  // ============================================================================

  const renderPriceSection = () => {
    if (!productData || !computedValues) return null;

    const { priceCalculation } = productData;
    const { hasDiscount, discountPercentage } = computedValues;

    return (
      <div className="price-section">
        <div className="price-display">
          <span className="currency">{productData.product.currency}</span>
          <span className="amount">{priceCalculation.finalPrice.toFixed(2)}</span>
          {hasDiscount && <span className="discount-badge">-{discountPercentage}% OFF</span>}
        </div>

        {hasDiscount && (
          <div className="original-price">
            <span className="currency">{productData.product.currency}</span>
            <span className="amount">{priceCalculation.basePrice.toFixed(2)}</span>
          </div>
        )}

        {priceCalculation.discounts.length > 0 && expandedSections.pricing && (
          <div className="price-breakdown">
            <h4>Price Breakdown</h4>
            <div className="price-item">
              <span>Base Price:</span>
              <span>
                {productData.product.currency} {priceCalculation.basePrice.toFixed(2)}
              </span>
            </div>
            {priceCalculation.discounts.map((discount, index) => (
              <div key={index} className="price-item discount">
                <span>{discount.ruleName}:</span>
                <span>
                  -{productData.product.currency} {discount.amount.toFixed(2)}
                </span>
              </div>
            ))}
            <div className="price-item final">
              <span>Final Price:</span>
              <span>
                {productData.product.currency} {priceCalculation.finalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {priceCalculation.discounts.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection('pricing')}
            className="toggle-pricing"
          >
            {expandedSections.pricing ? 'Hide' : 'Show'} Price Details
          </Button>
        )}
      </div>
    );
  };

  const renderTagsSection = () => {
    if (!productData || productData.tags.length === 0) return null;

    return (
      <div className="tags-section">
        <h3>Tags</h3>
        <div className="tags-container">
          {productData.tags.map(tag => (
            <span key={tag.id} className="tag-badge" style={{ backgroundColor: tag.color }}>
              {tag.name}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderPluginSection = () => {
    if (!productData?.pluginInfo) return null;

    const { pluginInfo } = productData;

    return (
      <Card className="plugin-section">
        <div className="section-header" onClick={() => toggleSection('plugin')}>
          <h3>Plugin Information</h3>
          <Button variant="ghost" size="sm">
            {expandedSections.plugin ? '▼' : '▶'}
          </Button>
        </div>

        {expandedSections.plugin && (
          <div className="plugin-content">
            <div className="plugin-basic-info">
              <div className="plugin-name-version">
                <span className="plugin-name">{pluginInfo.name}</span>
                <span className="plugin-version">v{pluginInfo.version}</span>
                <span className={`plugin-status ${pluginInfo.isActive ? 'active' : 'inactive'}`}>
                  {pluginInfo.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="plugin-description">{pluginInfo.description}</p>
            </div>

            {pluginInfo.features.length > 0 && (
              <div className="plugin-features">
                <h4>Features</h4>
                <ul>
                  {pluginInfo.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  const renderInventorySection = () => {
    if (!productData || !productData.product.stock) return null;

    const { product, stockAlerts } = productData;
    const { hasStockIssues } = computedValues!;

    return (
      <Card className="inventory-section">
        <div className="section-header" onClick={() => toggleSection('inventory')}>
          <h3>Inventory Status</h3>
          <Button variant="ghost" size="sm">
            {expandedSections.inventory ? '▼' : '▶'}
          </Button>
        </div>

        <div className="inventory-summary">
          <div className="stock-info">
            {product.stock.available > 0 ? (
              <span className="stock-available">✅ {product.stock.available} in stock</span>
            ) : (
              <span className="stock-out">❌ Out of stock</span>
            )}

            {hasStockIssues && (
              <span className="stock-warning">
                ⚠️ {stockAlerts.length} alert{stockAlerts.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="availability-status">
            <span
              className={`availability ${productData.availability.available ? 'available' : 'unavailable'}`}
            >
              {productData.availability.available ? 'Available' : 'Unavailable'}
            </span>
            {productData.availability.reason && (
              <span className="availability-reason">({productData.availability.reason})</span>
            )}
          </div>
        </div>

        {expandedSections.inventory && (
          <div className="inventory-details">
            {product.stock.total && (
              <div className="inventory-item">
                <span>Total Stock:</span>
                <span>{product.stock.total}</span>
              </div>
            )}

            <div className="inventory-item">
              <span>Low Stock Threshold:</span>
              <span>{product.stock.lowStockThreshold}</span>
            </div>

            {stockAlerts.length > 0 && (
              <div className="stock-alerts">
                <h4>Stock Alerts</h4>
                {stockAlerts.map(alert => (
                  <div key={alert.id} className={`alert ${alert.severity}`}>
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-action">{alert.recommendedAction}</div>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={refreshProductData}
              className="refresh-button"
            >
              Refresh Stock Data
            </Button>
          </div>
        )}
      </Card>
    );
  };

  const renderImageGallery = () => {
    if (!productData) return null;

    const { product, categoryInfo } = productData;

    return (
      <div className="image-gallery">
        <div className="main-image-container">
          {product.images.length > 0 ? (
            <img
              src={
                product.images[selectedImageIndex]?.url ||
                product.images[0]?.url ||
                '/images/placeholder-product.png'
              }
              alt={product.images[selectedImageIndex]?.alt || product.name}
              className="main-image"
              onError={e => {
                (e.target as HTMLImageElement).src = '/images/placeholder-product.png';
              }}
            />
          ) : (
            <div className="image-placeholder">{categoryInfo.icon}</div>
          )}

          {/* Badges */}
          {product.isFeatured && <div className="featured-badge">⭐ Featured</div>}

          {computedValues?.hasDiscount && (
            <div className="discount-badge">-{computedValues.discountPercentage}% OFF</div>
          )}

          {computedValues?.isOutOfStock && <div className="out-of-stock-overlay">Out of Stock</div>}
        </div>

        {/* Image Thumbnails */}
        {product.images.length > 1 && (
          <div className="thumbnails-container">
            {product.images.map((image, index) => (
              <button
                key={image.id}
                className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                onClick={() => setSelectedImageIndex(index)}
              >
                <img src={image.url} alt={image.alt} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  if (loading) {
    return (
      <div className="product-detail-loading">
        <LoadingSpinner />
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="product-detail-error">
        <h2>Product Not Found</h2>
        <p>{error || 'The requested product could not be found.'}</p>
        {onBack && <Button onClick={onBack}>Back to Products</Button>}
      </div>
    );
  }

  const { product, categoryInfo } = productData;

  return (
    <div className="product-detail-enhanced">
      {/* Header */}
      <div className="product-header">
        {onBack && (
          <Button variant="secondary" size="sm" onClick={onBack} className="back-button">
            ← Back
          </Button>
        )}

        {onEditProduct && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEditProduct(productId)}
            className="edit-button"
          >
            Edit Product
          </Button>
        )}
      </div>

      <div className="product-content">
        {/* Product Images */}
        <div className="product-images">{renderImageGallery()}</div>

        {/* Product Information */}
        <div className="product-info">
          {/* Category */}
          <div className="product-category" style={{ backgroundColor: categoryInfo.color }}>
            {categoryInfo.icon} {categoryInfo.text}
          </div>

          {/* Title */}
          <h1 className="product-title">{product.name}</h1>

          {/* Price */}
          {renderPriceSection()}

          {/* Description */}
          <Card className="description-section">
            <div className="section-header" onClick={() => toggleSection('description')}>
              <h3>Description</h3>
              <Button variant="ghost" size="sm">
                {expandedSections.description ? '▼' : '▶'}
              </Button>
            </div>
            {expandedSections.description && (
              <p className="product-description">{product.description}</p>
            )}
          </Card>

          {/* Features/Metadata */}
          {Object.keys(product.metadata).length > 0 && (
            <Card className="features-section">
              <div className="section-header" onClick={() => toggleSection('features')}>
                <h3>Features</h3>
                <Button variant="ghost" size="sm">
                  {expandedSections.features ? '▼' : '▶'}
                </Button>
              </div>
              {expandedSections.features && (
                <div className="features-content">
                  {Object.entries(product.metadata).map(([key, value]) => (
                    <div key={key} className="feature-item">
                      <span className="feature-label">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                      </span>
                      <span className="feature-value">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Tags */}
          {renderTagsSection()}

          {/* Plugin Information */}
          {renderPluginSection()}

          {/* Inventory Status */}
          {renderInventorySection()}

          {/* Delivery Info */}
          <Card className="delivery-section">
            <div className="section-header" onClick={() => toggleSection('delivery')}>
              <h3>Delivery Information</h3>
              <Button variant="ghost" size="sm">
                {expandedSections.delivery ? '▼' : '▶'}
              </Button>
            </div>
            {expandedSections.delivery && (
              <div className="delivery-content">
                <div className="delivery-type">
                  <span className="delivery-icon">
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
                <div className="delivery-time">
                  <strong>Estimated Time:</strong> {product.deliveryInfo.estimatedTime}
                </div>
                {product.deliveryInfo.instructions && (
                  <div className="delivery-instructions">
                    <strong>Instructions:</strong> {product.deliveryInfo.instructions}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Quantity and Add to Cart */}
          {!computedValues?.isOutOfStock && (
            <div className="purchase-actions">
              <div className="quantity-selector">
                <label htmlFor="quantity">Quantity:</label>
                <select
                  id="quantity"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="quantity-select"
                >
                  {Array.from({ length: computedValues?.maxQuantity || 1 }, (_, i) => i + 1).map(
                    num => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    )
                  )}
                </select>
              </div>

              <Button
                variant={isInCart ? 'secondary' : 'primary'}
                onClick={handleAddToCart}
                disabled={computedValues?.isOutOfStock}
                className="add-to-cart-button"
              >
                {isInCart ? 'Add More to Cart' : 'Add to Cart'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Styles */}
      <style>{`
        .product-detail-enhanced {
          padding: 1rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .product-detail-loading,
        .product-detail-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .product-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .product-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
        }

        .product-images {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .main-image-container {
          position: relative;
          width: 100%;
          height: 400px;
          border-radius: 12px;
          overflow: hidden;
          background: var(--tg-theme-secondary-bg-color, #f5f5f5);
        }

        .main-image {
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
          font-size: 5rem;
          color: var(--tg-theme-hint-color, #999);
        }

        .featured-badge {
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

        .discount-badge {
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

        .out-of-stock-overlay {
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

        .thumbnails-container {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 0.25rem 0;
        }

        .thumbnail {
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

        .thumbnail.active {
          border-color: var(--tg-theme-button-color, #007AFF);
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-info {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .product-category {
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

        .product-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0;
          color: var(--tg-theme-text-color, #000);
          line-height: 1.2;
        }

        .price-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .price-display {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .price-display .currency {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--tg-theme-button-color, #007AFF);
        }

        .price-display .amount {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--tg-theme-button-color, #007AFF);
        }

        .price-display .discount-badge {
          background: #e53e3e;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .original-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          text-decoration: line-through;
          color: var(--tg-theme-hint-color, #999);
          font-size: 1.2rem;
        }

        .price-breakdown {
          padding: 1rem;
          background: var(--tg-theme-secondary-bg-color, #f8f9fa);
          border-radius: 8px;
          margin-top: 0.5rem;
        }

        .price-breakdown h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .price-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.25rem 0;
        }

        .price-item.discount {
          color: #e53e3e;
        }

        .price-item.final {
          font-weight: 600;
          border-top: 1px solid var(--tg-theme-section-separator-color, #e5e5e5);
          margin-top: 0.5rem;
          padding-top: 0.5rem;
        }

        .toggle-pricing {
          align-self: flex-start;
          margin-top: 0.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          padding: 0.5rem 0;
        }

        .section-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--tg-theme-text-color, #000);
        }

        .product-description {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--tg-theme-text-color, #000);
          margin: 0.5rem 0 0 0;
        }

        .features-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .feature-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--tg-theme-section-separator-color, #eee);
        }

        .feature-item:last-child {
          border-bottom: none;
        }

        .feature-label {
          font-weight: 500;
          color: var(--tg-theme-text-color, #000);
        }

        .feature-value {
          color: var(--tg-theme-hint-color, #666);
        }

        .tags-section h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--tg-theme-text-color, #000);
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          color: white;
          font-weight: 500;
        }

        .plugin-section {
          margin: 1rem 0;
        }

        .plugin-content {
          margin-top: 0.5rem;
        }

        .plugin-basic-info {
          margin-bottom: 1rem;
        }

        .plugin-name-version {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .plugin-name {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .plugin-version {
          background: var(--tg-theme-secondary-bg-color, #f0f0f0);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.8rem;
          color: var(--tg-theme-hint-color, #666);
        }

        .plugin-status {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .plugin-status.active {
          background: #22c55e;
          color: white;
        }

        .plugin-status.inactive {
          background: #ef4444;
          color: white;
        }

        .plugin-description {
          font-size: 0.9rem;
          color: var(--tg-theme-hint-color, #666);
          margin: 0;
        }

        .plugin-features h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .plugin-features ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .plugin-features li {
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
        }

        .inventory-section {
          margin: 1rem 0;
        }

        .inventory-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0.5rem 0;
        }

        .stock-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stock-available {
          color: #22c55e;
          font-weight: 500;
        }

        .stock-out {
          color: #ef4444;
          font-weight: 500;
        }

        .stock-warning {
          color: #f59e0b;
          font-weight: 500;
        }

        .availability {
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .availability.available {
          background: #dcfce7;
          color: #166534;
        }

        .availability.unavailable {
          background: #fecaca;
          color: #991b1b;
        }

        .availability-reason {
          font-size: 0.8rem;
          color: var(--tg-theme-hint-color, #666);
          margin-left: 0.5rem;
        }

        .inventory-details {
          margin-top: 1rem;
        }

        .inventory-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--tg-theme-section-separator-color, #eee);
        }

        .inventory-item:last-child {
          border-bottom: none;
        }

        .stock-alerts {
          margin: 1rem 0;
        }

        .stock-alerts h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .alert {
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 0.5rem;
        }

        .alert.low {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
        }

        .alert.medium {
          background: #fed7aa;
          border-left: 4px solid #ea580c;
        }

        .alert.high {
          background: #fecaca;
          border-left: 4px solid #dc2626;
        }

        .alert.critical {
          background: #fca5a5;
          border-left: 4px solid #991b1b;
        }

        .alert-message {
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .alert-action {
          font-size: 0.9rem;
          color: var(--tg-theme-hint-color, #666);
        }

        .refresh-button {
          margin-top: 1rem;
        }

        .delivery-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .delivery-type {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .delivery-icon {
          font-size: 1.2rem;
        }

        .delivery-time,
        .delivery-instructions {
          font-size: 0.9rem;
          color: var(--tg-theme-hint-color, #666);
        }

        .purchase-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.5rem;
          background: var(--tg-theme-secondary-bg-color, #f8f9fa);
          border-radius: 12px;
        }

        .quantity-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .quantity-selector label {
          font-weight: 500;
          color: var(--tg-theme-text-color, #000);
        }

        .quantity-select {
          padding: 0.5rem;
          border: 1px solid var(--tg-theme-section-separator-color, #ddd);
          border-radius: 6px;
          background: var(--tg-theme-bg-color, #fff);
          color: var(--tg-theme-text-color, #000);
        }

        .add-to-cart-button {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .product-detail-enhanced {
            padding: 0.5rem;
          }

          .product-content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .main-image-container {
            height: 300px;
          }

          .product-title {
            font-size: 1.5rem;
          }

          .price-display .amount {
            font-size: 2rem;
          }

          .inventory-summary {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};
