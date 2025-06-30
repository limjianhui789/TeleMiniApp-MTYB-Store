import React, { useState, useEffect, useMemo } from 'react';
import type { Product, ProductCategory, ProductFilters } from '../../types';
import { productService } from '../../services/product/ProductService';
import { categoryService } from '../../services/product/CategoryService';
import { cartService } from '../../services/product/CartService';
import { ProductCard } from './ProductCard';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useTelegramTheme } from '../../hooks/useTelegramTheme';

interface ProductListProps {
  category?: ProductCategory;
  searchQuery?: string;
  showFilters?: boolean;
  showCategories?: boolean;
  gridColumns?: number;
  onProductSelect?: (product: Product) => void;
  className?: string;
}

interface FilterState {
  category?: ProductCategory;
  priceRange?: [number, number];
  searchQuery?: string;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'created' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export const ProductList: React.FC<ProductListProps> = ({
  category,
  searchQuery,
  showFilters = true,
  showCategories = true,
  gridColumns = 2,
  onProductSelect,
  className = '',
}) => {
  const { colorScheme } = useTelegramTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<string[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    category,
    searchQuery,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Load initial data
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadTags();

    // Listen to cart changes
    const unsubscribe = cartService.onCartChange(cartState => {
      setCartItems(cartState.items.map(item => item.productId));
    });

    return unsubscribe;
  }, []);

  // Update filters when props change
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category,
      searchQuery,
    }));
  }, [category, searchQuery]);

  // Filter products when filters change
  useEffect(() => {
    filterProducts();
  }, [filters, allProducts]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const productList = await productService.getAllProducts();
      setAllProducts(productList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoryList = await categoryService.getAllCategories();
      setCategories(categoryList);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await productService.getAvailableTags();
      setAvailableTags(tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const filterProducts = async () => {
    try {
      const productFilters: ProductFilters = {
        category: filters.category,
        searchQuery: filters.searchQuery,
        priceRange: filters.priceRange,
        tags: filters.tags,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      const filteredProducts = await productService.getAllProducts(productFilters);
      setProducts(filteredProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to filter products');
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      const result = await cartService.addToCart(productId, 1);
      if (!result.success) {
        setError(result.error?.message || 'Failed to add to cart');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product && onProductSelect) {
      onProductSelect(product);
    }
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      sortBy: 'name',
      sortOrder: 'asc',
    });
  };

  const priceRange = useMemo(() => {
    if (allProducts.length === 0) return { min: 0, max: 100 };
    const prices = allProducts.map(p => p.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [allProducts]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    allProducts.forEach(product => {
      stats[product.category] = (stats[product.category] || 0) + 1;
    });
    return stats;
  }, [allProducts]);

  if (loading) {
    return (
      <div className="product-list__loading">
        <LoadingSpinner size="large" />
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-list__error">
        <p>❌ {error}</p>
        <Button onClick={loadProducts} variant="secondary" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  const FilterPanel = () => (
    <div className="product-list__filters">
      <div className="product-list__filters-header">
        <h3>Filters</h3>
        <Button
          onClick={resetFilters}
          variant="ghost"
          size="sm"
          className="product-list__reset-filters"
        >
          Reset
        </Button>
      </div>

      {/* Category Filter */}
      {showCategories && (
        <div className="product-list__filter-group">
          <label className="product-list__filter-label">Category</label>
          <div className="product-list__category-buttons">
            <Button
              variant={!filters.category ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => updateFilter('category', undefined)}
              className="product-list__category-btn"
            >
              All ({allProducts.length})
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={filters.category === cat.id ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => updateFilter('category', cat.id)}
                className="product-list__category-btn"
              >
                {cat.icon} {cat.name} ({categoryStats[cat.id] || 0})
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range Filter */}
      <div className="product-list__filter-group">
        <label className="product-list__filter-label">
          Price Range: ${filters.priceRange?.[0] || priceRange.min} - $
          {filters.priceRange?.[1] || priceRange.max}
        </label>
        <div className="product-list__price-range">
          <input
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            value={filters.priceRange?.[0] || priceRange.min}
            onChange={e => {
              const newMin = Number(e.target.value);
              const currentMax = filters.priceRange?.[1] || priceRange.max;
              updateFilter('priceRange', [newMin, Math.max(newMin, currentMax)]);
            }}
            className="product-list__range-input"
          />
          <input
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            value={filters.priceRange?.[1] || priceRange.max}
            onChange={e => {
              const newMax = Number(e.target.value);
              const currentMin = filters.priceRange?.[0] || priceRange.min;
              updateFilter('priceRange', [Math.min(currentMin, newMax), newMax]);
            }}
            className="product-list__range-input"
          />
        </div>
      </div>

      {/* Tags Filter */}
      <div className="product-list__filter-group">
        <label className="product-list__filter-label">Tags</label>
        <div className="product-list__tags">
          {availableTags.slice(0, 10).map(tag => (
            <button
              key={tag}
              onClick={() => {
                const currentTags = filters.tags || [];
                const newTags = currentTags.includes(tag)
                  ? currentTags.filter(t => t !== tag)
                  : [...currentTags, tag];
                updateFilter('tags', newTags.length > 0 ? newTags : undefined);
              }}
              className={`product-list__tag ${filters.tags?.includes(tag) ? 'active' : ''}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div className="product-list__filter-group">
        <label className="product-list__filter-label">Sort By</label>
        <div className="product-list__sort-options">
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={e => {
              const [sortBy, sortOrder] = e.target.value.split('-') as [
                typeof filters.sortBy,
                typeof filters.sortOrder,
              ];
              updateFilter('sortBy', sortBy);
              updateFilter('sortOrder', sortOrder);
            }}
            className="product-list__sort-select"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
            <option value="created-desc">Newest First</option>
            <option value="created-asc">Oldest First</option>
            <option value="popularity-desc">Most Popular</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`product-list ${className}`}>
      {/* Mobile Filter Toggle */}
      {showFilters && (
        <div className="product-list__mobile-filter-toggle">
          <Button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            variant="secondary"
            size="sm"
          >
            🔍 Filters (
            {
              Object.keys(filters).filter(key => filters[key as keyof FilterState] !== undefined)
                .length
            }
            )
          </Button>
        </div>
      )}

      <div className="product-list__container">
        {/* Desktop Filters Sidebar */}
        {showFilters && (
          <div className={`product-list__sidebar ${showMobileFilters ? 'mobile-open' : ''}`}>
            <FilterPanel />
          </div>
        )}

        {/* Product Grid */}
        <div className="product-list__content">
          {/* Search Bar */}
          <div className="product-list__search">
            <input
              type="text"
              placeholder="Search products..."
              value={filters.searchQuery || ''}
              onChange={e => updateFilter('searchQuery', e.target.value || undefined)}
              className="product-list__search-input"
            />
          </div>

          {/* Results Header */}
          <div className="product-list__header">
            <h2 className="product-list__title">
              {filters.category
                ? `${categories.find(c => c.id === filters.category)?.name || 'Category'} Products`
                : 'All Products'}
            </h2>
            <span className="product-list__count">
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </span>
          </div>

          {/* Product Grid */}
          {products.length > 0 ? (
            <div
              className="product-list__grid"
              style={{
                gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
              }}
            >
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onViewDetails={handleProductSelect}
                  isInCart={cartItems.includes(product.id)}
                  className="product-list__card"
                />
              ))}
            </div>
          ) : (
            <div className="product-list__empty">
              <div className="product-list__empty-icon">📦</div>
              <h3>No products found</h3>
              <p>Try adjusting your filters or search query</p>
              <Button onClick={resetFilters} variant="primary" size="sm">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .product-list {
          width: 100%;
          max-width: var(--max-width-container);
          margin: 0 auto;
          font-family: var(--font-family-base);
          color: var(--color-text-primary);
        }

        .product-list__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-12);
          gap: var(--space-4);
          color: var(--color-text-secondary);
        }

        .product-list__error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          gap: 1rem;
          text-align: center;
        }

        .product-list__mobile-filter-toggle {
          display: none;
          margin-bottom: 1rem;
        }

        .product-list__container {
          display: flex;
          gap: var(--space-8);
        }

        .product-list__sidebar {
          width: 280px;
          flex-shrink: 0;
        }

        .product-list__filters {
          background: var(--color-card-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          position: sticky;
          top: var(--space-4);
          max-height: calc(100vh - var(--space-8));
          overflow-y: auto;
          box-shadow: var(--shadow-sm);
        }

        .product-list__filters-header {
          display: flex;
          justify-content: between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .product-list__filters-header h3 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .product-list__filter-group {
          margin-bottom: 1.5rem;
        }

        .product-list__filter-label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: var(--tg-theme-text-color, #000);
          font-size: 0.9rem;
        }

        .product-list__category-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .product-list__category-btn {
          justify-content: flex-start;
          text-align: left;
        }

        .product-list__price-range {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .product-list__range-input {
          width: 100%;
          accent-color: var(--tg-theme-button-color, #007AFF);
        }

        .product-list__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .product-list__tag {
          padding: 0.25rem 0.5rem;
          border: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
          border-radius: 16px;
          background: transparent;
          color: var(--tg-theme-text-color, #333);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .product-list__tag:hover {
          background: var(--tg-theme-secondary-bg-color, #f0f0f0);
        }

        .product-list__tag.active {
          background: var(--tg-theme-button-color, #007AFF);
          color: var(--tg-theme-button-text-color, #fff);
          border-color: var(--tg-theme-button-color, #007AFF);
        }

        .product-list__sort-select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
          border-radius: 8px;
          background: var(--tg-theme-bg-color, #fff);
          color: var(--tg-theme-text-color, #000);
          font-size: 0.9rem;
        }

        .product-list__content {
          flex: 1;
          min-width: 0;
        }

        .product-list__search {
          margin-bottom: 1.5rem;
        }

        .product-list__search-input {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-input-background);
          color: var(--color-text-primary);
          font-size: var(--text-base);
          font-family: var(--font-family-base);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .product-list__search-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }

        .product-list__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .product-list__title {
          margin: 0;
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .product-list__count {
          color: var(--color-text-secondary);
          font-size: var(--text-sm);
        }

        .product-list__grid {
          display: grid;
          gap: var(--space-6);
          margin-bottom: var(--space-8);
        }

        .product-list__empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-16) var(--space-8);
          text-align: center;
          background: var(--color-card-background);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }

        .product-list__empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .product-list__empty h3 {
          margin: 0 0 0.5rem 0;
          color: var(--tg-theme-text-color, #000);
        }

        .product-list__empty p {
          margin: 0 0 1.5rem 0;
          color: var(--tg-theme-hint-color, #666);
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .product-list__mobile-filter-toggle {
            display: block;
          }

          .product-list__container {
            flex-direction: column;
            gap: var(--space-4);
          }

          .product-list__sidebar {
            width: 100%;
            display: none;
          }

          .product-list__sidebar.mobile-open {
            display: block;
          }

          .product-list__filters {
            position: static;
            max-height: none;
          }

          .product-list__grid {
            grid-template-columns: 1fr !important;
            gap: var(--space-4);
          }

          .product-list__header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-2);
          }

          .product-list__title {
            font-size: var(--text-xl);
          }
        }

        @media (max-width: 480px) {
          .product-list {
            padding: 0 1rem;
          }

          .product-list__filters {
            padding: 1rem;
          }

          .product-list__empty {
            padding: 2rem 1rem;
          }
        }
      `}</style>
    </div>
  );
};
