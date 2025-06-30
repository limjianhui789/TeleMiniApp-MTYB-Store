export { ProductService, productService } from './ProductService';
export { CategoryService, categoryService, type CategoryInfo } from './CategoryService';
export {
  CartService,
  cartService,
  type CartDiscount,
  type CartSummary,
  type CartValidationResult,
  type EnhancedCartItem,
} from './CartService';
export {
  InventoryService,
  inventoryService,
  type StockAlert,
  type InventoryRule,
  type InventoryTransaction,
  type InventoryStats,
} from './InventoryService';
export {
  TagService,
  tagService,
  type ProductTag,
  type TagCategory,
  type TagStats,
  type TagFilters,
} from './TagService';
export {
  PriceService,
  priceService,
  type PriceRule,
  type PriceCalculationResult,
  type PriceStats,
} from './PriceService';
