import React, { useState, useEffect } from 'react';
import type { Product, ProductCategory, ProductFilters } from '../../types';
import { productService, categoryService } from '../../services/product';
import { cartService } from '../../services/product';
import { ProductCard } from '../../components/product/ProductCard';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface ProductsPageProps {
  onProductSelect?: (productId: string) => void;
  initialCategory?: ProductCategory;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ onProductSelect, initialCategory }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<string[]>([]);

  const [filters, setFilters] = useState<ProductFilters>(() => {
    const initialFilters: ProductFilters = {
      sortBy: 'name',
      sortOrder: 'asc',
    };
    if (initialCategory) {
      initialFilters.category = initialCategory;
    }
    return initialFilters;
  });

  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    loadData();

    const unsubscribe = cartService.onCartChange(cart => {
      setCartItems(cart.items.map(item => item.productId));
    });

    cartService.loadFromStorage();

    return unsubscribe;
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData] = await Promise.all([categoryService.getAllCategories()]);

      setCategories(categoriesData);
      await loadProducts();
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const productsData = await productService.getAllProducts(filters);
      setProducts(productsData);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error loading products:', err);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      const result = await cartService.addToCart(productId);
      if (result.success) {
        cartService.saveToStorage();
      } else {
        console.error('Failed to add to cart:', result.error?.message);
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const handleCategoryFilter = (category: ProductCategory | undefined) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (category) {
        newFilters.category = category;
      } else {
        delete newFilters.category;
      }
      return newFilters;
    });
  };

  const handleSearch = () => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (searchInput.trim()) {
        newFilters.searchQuery = searchInput.trim();
      } else {
        delete newFilters.searchQuery;
      }
      return newFilters;
    });
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: sortBy as any,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const clearFilters = () => {
    setFilters({
      sortBy: 'name',
      sortOrder: 'asc',
    });
    setSearchInput('');
  };

  if (loading) {
    return (
      <div className="products-page__loading">
        <LoadingSpinner />
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-page__error">
        <p>Error: {error}</p>
        <Button onClick={loadData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="products-page">
      {/* Header */}
      <div className="products-page__header">
        <h1 className="products-page__title">Products</h1>
        <p className="products-page__subtitle">Discover our digital goods and services</p>
      </div>

      {/* Search and Filters */}
      <div className="products-page__filters">
        {/* Search Bar */}
        <div className="products-page__search">
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            className="products-page__search-input"
          />
          <Button onClick={handleSearch} size="sm" className="products-page__search-button">
            🔍
          </Button>
        </div>

        {/* Category Filters */}
        <div className="products-page__category-filters">
          <Button
            variant={!filters.category ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handleCategoryFilter(undefined)}
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category.id}
              variant={filters.category === category.id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleCategoryFilter(category.id)}
            >
              {category.icon} {category.name}
            </Button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="products-page__sort">
          <span className="products-page__sort-label">Sort by:</span>
          <Button
            variant={filters.sortBy === 'name' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handleSortChange('name')}
          >
            Name {filters.sortBy === 'name' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
          <Button
            variant={filters.sortBy === 'price' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handleSortChange('price')}
          >
            Price {filters.sortBy === 'price' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
          <Button
            variant={filters.sortBy === 'created' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handleSortChange('created')}
          >
            Newest {filters.sortBy === 'created' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
        </div>

        {/* Clear Filters */}
        {(filters.searchQuery || filters.category) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={clearFilters}
            className="products-page__clear-filters"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Results Info */}
      <div className="products-page__results-info">
        <span className="products-page__results-count">
          {products.length} product{products.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="products-page__grid">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onViewDetails={onProductSelect}
              isInCart={cartItems.includes(product.id)}
            />
          ))}
        </div>
      ) : (
        <div className="products-page__empty">
          <div className="products-page__empty-icon">📦</div>
          <h3 className="products-page__empty-title">No products found</h3>
          <p className="products-page__empty-description">
            Try adjusting your search or filter criteria
          </p>
          <Button onClick={clearFilters}>Show All Products</Button>
        </div>
      )}

      <style>{`
        .products-page {
          padding: 1rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .products-page__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          gap: 1rem;
        }

        .products-page__error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2rem;
          text-align: center;
        }

        .products-page__header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .products-page__title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: var(--tg-theme-text-color, #000);
        }

        .products-page__subtitle {
          font-size: 1rem;
          color: var(--tg-theme-hint-color, #666);
          margin: 0;
        }

        .products-page__filters {
          background: var(--tg-theme-secondary-bg-color, #f8f9fa);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .products-page__search {
          display: flex;
          gap: 0.5rem;
        }

        .products-page__search-input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid var(--tg-theme-hint-color, #ddd);
          border-radius: 8px;
          background: var(--tg-theme-bg-color, #fff);
          color: var(--tg-theme-text-color, #000);
          font-size: 1rem;
        }

        .products-page__search-input:focus {
          outline: none;
          border-color: var(--tg-theme-button-color, #007AFF);
        }

        .products-page__search-button {
          min-width: 50px;
        }

        .products-page__category-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .products-page__sort {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .products-page__sort-label {
          font-weight: 500;
          color: var(--tg-theme-text-color, #000);
        }

        .products-page__clear-filters {
          align-self: flex-start;
        }

        .products-page__results-info {
          margin-bottom: 1rem;
          padding: 0 0.25rem;
        }

        .products-page__results-count {
          font-size: 0.9rem;
          color: var(--tg-theme-hint-color, #666);
        }

        .products-page__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          padding-bottom: 2rem;
        }

        .products-page__empty {
          text-align: center;
          padding: 3rem 1rem;
        }

        .products-page__empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .products-page__empty-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: var(--tg-theme-text-color, #000);
        }

        .products-page__empty-description {
          font-size: 1rem;
          color: var(--tg-theme-hint-color, #666);
          margin: 0 0 1.5rem 0;
        }

        @media (max-width: 768px) {
          .products-page {
            padding: 0.5rem;
          }

          .products-page__grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1rem;
          }

          .products-page__title {
            font-size: 1.5rem;
          }

          .products-page__filters {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};
