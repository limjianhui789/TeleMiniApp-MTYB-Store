// ============================================================================
// MTYB Virtual Goods Platform - Plugin Store Types
// ============================================================================

import type { PluginConfig } from './index';
import { ProductCategory } from './index';

// ============================================================================
// Plugin Store Types
// ============================================================================

export interface PluginStoreItem {
  id: string;
  name: string;
  displayName: string;
  shortDescription: string;
  description: string;
  version: string;
  latestVersion: string;
  author: PluginAuthor;
  category: ProductCategory;
  tags: string[];
  icon?: string;
  screenshots: string[];
  pricing: PluginPricing;
  stats: PluginStats;
  compatibility: PluginCompatibility;
  metadata: PluginMetadata;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date;
  status: PluginStoreStatus;
}

export interface PluginAuthor {
  id: string;
  name: string;
  email: string;
  website?: string;
  avatar?: string;
  verified: boolean;
  publishedPlugins: number;
  totalDownloads: number;
  averageRating: number;
  joinedAt: Date;
}

export interface PluginPricing {
  type: 'free' | 'paid' | 'freemium';
  price?: number;
  currency?: string;
  subscriptionOptions?: PluginSubscription[];
  freeTierLimits?: Record<string, any>;
}

export interface PluginSubscription {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
}

export interface PluginStats {
  downloads: number;
  activeInstalls: number;
  rating: number;
  reviewCount: number;
  lastWeekDownloads: number;
  lastMonthDownloads: number;
  popularityScore: number;
}

export interface PluginCompatibility {
  minPlatformVersion: string;
  maxPlatformVersion?: string;
  supportedDevices: ('mobile' | 'desktop' | 'tablet')[];
  requiredFeatures: string[];
  dependencies: PluginDependency[];
}

export interface PluginDependency {
  pluginId: string;
  minVersion: string;
  maxVersion?: string;
  optional: boolean;
}

export interface PluginMetadata {
  size: number; // in bytes
  downloadUrl: string;
  checksumSha256: string;
  changelog: PluginChangelog[];
  license: string;
  homepage?: string;
  repository?: string;
  bugTracker?: string;
  documentation?: string;
}

export interface PluginChangelog {
  version: string;
  date: Date;
  changes: string[];
  type: 'major' | 'minor' | 'patch';
}

export enum PluginStoreStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  DEPRECATED = 'deprecated',
}

// ============================================================================
// Plugin Reviews and Ratings
// ============================================================================

export interface PluginReview {
  id: string;
  pluginId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  pros: string[];
  cons: string[];
  helpfulVotes: number;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
  verified: boolean; // verified purchase
  version: string; // plugin version reviewed
}

export interface PluginRatingBreakdown {
  total: number;
  average: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// ============================================================================
// Plugin Collections and Categories
// ============================================================================

export interface PluginCollection {
  id: string;
  name: string;
  description: string;
  icon?: string;
  coverImage?: string;
  plugins: string[]; // plugin IDs
  curatedBy: string; // staff user ID
  featured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PluginCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  parentId?: string;
  children?: PluginCategory[];
  pluginCount: number;
  featured: boolean;
  order: number;
}

// ============================================================================
// Plugin Search and Filtering
// ============================================================================

export interface PluginSearchQuery {
  query?: string;
  category?: string;
  tags?: string[];
  author?: string;
  pricing?: 'free' | 'paid' | 'freemium';
  rating?: number; // minimum rating
  sortBy?: PluginSortBy;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export enum PluginSortBy {
  RELEVANCE = 'relevance',
  POPULARITY = 'popularity',
  RATING = 'rating',
  DOWNLOADS = 'downloads',
  NEWEST = 'newest',
  UPDATED = 'updated',
  NAME = 'name',
  PRICE = 'price',
}

export interface PluginSearchResult {
  plugins: PluginStoreItem[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
  facets: PluginSearchFacets;
}

export interface PluginSearchFacets {
  categories: { id: string; name: string; count: number }[];
  tags: { name: string; count: number }[];
  authors: { id: string; name: string; count: number }[];
  pricing: { type: string; count: number }[];
  ratings: { rating: number; count: number }[];
}

// ============================================================================
// Plugin Installation and Management
// ============================================================================

export interface PluginInstallation {
  id: string;
  pluginId: string;
  userId: string;
  version: string;
  installedAt: Date;
  lastUsed?: Date;
  status: PluginInstallationStatus;
  settings: Record<string, any>;
  licenseKey?: string;
  subscriptionId?: string;
}

export enum PluginInstallationStatus {
  INSTALLING = 'installing',
  INSTALLED = 'installed',
  UPDATING = 'updating',
  FAILED = 'failed',
  UNINSTALLING = 'uninstalling',
  DISABLED = 'disabled',
}

export interface PluginUpdate {
  pluginId: string;
  currentVersion: string;
  availableVersion: string;
  updateType: 'major' | 'minor' | 'patch' | 'security';
  releaseNotes: string;
  breaking: boolean;
  downloadUrl: string;
  checksumSha256: string;
}

// ============================================================================
// Plugin Developer Dashboard
// ============================================================================

export interface PluginDeveloperStats {
  totalPlugins: number;
  publishedPlugins: number;
  totalDownloads: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  monthlyStats: {
    month: string;
    downloads: number;
    revenue: number;
    newReviews: number;
  }[];
}

export interface PluginSubmission {
  id: string;
  pluginId?: string; // null for new submissions
  authorId: string;
  name: string;
  version: string;
  description: string;
  category: ProductCategory;
  tags: string[];
  pricing: PluginPricing;
  packageFile: File | string;
  icon?: File | string;
  screenshots: (File | string)[];
  changelog: string;
  submittedAt: Date;
  status: PluginStoreStatus;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

// ============================================================================
// Plugin Store API Types
// ============================================================================

export interface PluginStoreAPI {
  // Plugin browsing
  searchPlugins(query: PluginSearchQuery): Promise<PluginSearchResult>;
  getPlugin(id: string): Promise<PluginStoreItem>;
  getFeaturedPlugins(): Promise<PluginStoreItem[]>;
  getPluginsByCategory(categoryId: string): Promise<PluginStoreItem[]>;
  getPluginsByAuthor(authorId: string): Promise<PluginStoreItem[]>;

  // Plugin reviews
  getPluginReviews(pluginId: string, page?: number): Promise<PluginReview[]>;
  getPluginRating(pluginId: string): Promise<PluginRatingBreakdown>;
  submitReview(review: Omit<PluginReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<PluginReview>;
  voteReview(reviewId: string, helpful: boolean): Promise<void>;

  // Plugin installation
  installPlugin(pluginId: string, version?: string): Promise<PluginInstallation>;
  updatePlugin(pluginId: string): Promise<PluginInstallation>;
  uninstallPlugin(pluginId: string): Promise<void>;
  getInstalledPlugins(): Promise<PluginInstallation[]>;
  checkUpdates(): Promise<PluginUpdate[]>;

  // Developer features
  submitPlugin(submission: PluginSubmission): Promise<PluginSubmission>;
  updatePluginSubmission(
    id: string,
    submission: Partial<PluginSubmission>
  ): Promise<PluginSubmission>;
  getDeveloperStats(authorId: string): Promise<PluginDeveloperStats>;
  getMyPlugins(): Promise<PluginStoreItem[]>;

  // Categories and collections
  getCategories(): Promise<PluginCategory[]>;
  getCollections(): Promise<PluginCollection[]>;
  getCollection(id: string): Promise<PluginCollection>;
}

// ============================================================================
// Plugin Store Events
// ============================================================================

export interface PluginStoreEvent {
  type: PluginStoreEventType;
  pluginId: string;
  userId?: string;
  timestamp: Date;
  data?: Record<string, any>;
}

export enum PluginStoreEventType {
  PLUGIN_VIEWED = 'plugin_viewed',
  PLUGIN_DOWNLOADED = 'plugin_downloaded',
  PLUGIN_INSTALLED = 'plugin_installed',
  PLUGIN_UNINSTALLED = 'plugin_uninstalled',
  PLUGIN_UPDATED = 'plugin_updated',
  PLUGIN_REVIEWED = 'plugin_reviewed',
  PLUGIN_PURCHASED = 'plugin_purchased',
  PLUGIN_REFUNDED = 'plugin_refunded',
}

// ============================================================================
// Plugin Store Configuration
// ============================================================================

export interface PluginStoreConfig {
  apiBaseUrl: string;
  featuredPluginsLimit: number;
  searchResultsLimit: number;
  maxReviewLength: number;
  allowedFileTypes: string[];
  maxPluginSize: number; // in bytes
  reviewModerationEnabled: boolean;
  autoApprovalEnabled: boolean;
  subscriptionPlansEnabled: boolean;
}
