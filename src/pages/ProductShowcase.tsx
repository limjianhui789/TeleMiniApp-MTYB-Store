import React, { useState } from 'react';
import { ProductList, ProductDetail } from '../components/product';
import { CartPage } from '../components/cart';
import { Button } from '../components/ui/Button';
import type { Product } from '../types';

type ViewMode = 'list' | 'detail' | 'cart';

export const ProductShowcase: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const handleProductSelect = (product: Product) => {
    setSelectedProductId(product.id);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedProductId(null);
  };

  const handleViewCart = () => {
    setViewMode('cart');
  };

  const handleContinueShopping = () => {
    setViewMode('list');
  };

  const handleProductClick = (productId: string) => {
    setSelectedProductId(productId);
    setViewMode('detail');
  };

  return (
    <div className="product-showcase">
      {/* Navigation Header */}
      <div className="product-showcase__header">
        <h1 className="product-showcase__title">MTYB Shop - Product System Demo</h1>

        <div className="product-showcase__nav">
          <Button
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            size="sm"
          >
            Products
          </Button>
          <Button
            onClick={handleViewCart}
            variant={viewMode === 'cart' ? 'primary' : 'secondary'}
            size="sm"
          >
            Cart
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="product-showcase__content">
        {viewMode === 'list' && (
          <ProductList
            showFilters={true}
            showCategories={true}
            gridColumns={2}
            onProductSelect={handleProductSelect}
          />
        )}

        {viewMode === 'detail' && selectedProductId && (
          <ProductDetail productId={selectedProductId} onBack={handleBackToList} />
        )}

        {viewMode === 'cart' && (
          <CartPage
            onContinueShopping={handleContinueShopping}
            onProductClick={handleProductClick}
          />
        )}
      </div>

      <style>{`
        .product-showcase {
          min-height: 100vh;
          background: var(--tg-theme-bg-color, #ffffff);
          color: var(--tg-theme-text-color, #000000);
        }

        .product-showcase__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          border-bottom: 1px solid var(--tg-theme-secondary-bg-color, #f0f0f0);
          background: var(--tg-theme-bg-color, #fff);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .product-showcase__title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--tg-theme-text-color, #000);
        }

        .product-showcase__nav {
          display: flex;
          gap: 0.5rem;
        }

        .product-showcase__content {
          padding: 2rem;
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .product-showcase__header {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
          }

          .product-showcase__title {
            font-size: 1.3rem;
            text-align: center;
          }

          .product-showcase__content {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};
