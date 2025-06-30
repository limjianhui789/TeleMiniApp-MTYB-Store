-- ============================================================================
-- MTYB Platform Production Database Schema
-- Version: 1.0.0
-- Created: 2024-06-30
-- ============================================================================

-- Create database and set encoding
-- CREATE DATABASE mtyb_platform WITH ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- Enums and Custom Types
-- ============================================================================

CREATE TYPE user_role AS ENUM ('user', 'developer', 'moderator', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned', 'pending_verification');

CREATE TYPE plugin_status AS ENUM ('draft', 'pending_review', 'under_review', 'approved', 'published', 'rejected', 'suspended', 'deprecated');
CREATE TYPE plugin_category AS ENUM ('vpn', 'streaming', 'gaming', 'software', 'productivity', 'security', 'entertainment', 'utilities');
CREATE TYPE plugin_pricing_type AS ENUM ('free', 'freemium', 'paid', 'subscription');

CREATE TYPE installation_status AS ENUM ('installing', 'installed', 'updating', 'failed', 'uninstalling', 'disabled');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'failed', 'cancelled', 'refunded');

CREATE TYPE review_status AS ENUM ('published', 'pending', 'hidden', 'flagged');
CREATE TYPE analytics_event_type AS ENUM ('plugin_view', 'plugin_install', 'plugin_uninstall', 'plugin_execute', 'plugin_error', 'payment_success', 'user_action');

-- ============================================================================
-- Core User Management
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    status user_status DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    language_code VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    last_active_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    website_url TEXT,
    github_url TEXT,
    twitter_handle VARCHAR(100),
    company VARCHAR(255),
    location VARCHAR(255),
    notification_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    developer_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Plugin Management
-- ============================================================================

CREATE TABLE plugins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL, -- Unique plugin identifier
    display_name VARCHAR(255) NOT NULL,
    short_description VARCHAR(500),
    description TEXT,
    author_id UUID NOT NULL REFERENCES users(id),
    category plugin_category NOT NULL,
    tags TEXT[] DEFAULT '{}',
    version VARCHAR(50) NOT NULL,
    latest_version VARCHAR(50),
    status plugin_status DEFAULT 'draft',
    pricing_type plugin_pricing_type DEFAULT 'free',
    price DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    icon_url TEXT,
    banner_url TEXT,
    screenshots TEXT[] DEFAULT '{}',
    homepage_url TEXT,
    repository_url TEXT,
    documentation_url TEXT,
    support_email VARCHAR(255),
    license VARCHAR(100) DEFAULT 'MIT',
    min_platform_version VARCHAR(50),
    supported_devices TEXT[] DEFAULT '{}',
    required_permissions TEXT[] DEFAULT '{}',
    manifest_json JSONB,
    package_url TEXT,
    package_size INTEGER, -- in bytes
    checksum_sha256 VARCHAR(64),
    download_count INTEGER DEFAULT 0,
    active_install_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    last_update_check TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE plugin_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    changelog TEXT,
    release_notes TEXT,
    package_url TEXT,
    package_size INTEGER,
    checksum_sha256 VARCHAR(64),
    is_stable BOOLEAN DEFAULT TRUE,
    is_latest BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plugin_id, version)
);

CREATE TABLE plugin_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    dependency_plugin_id UUID NOT NULL REFERENCES plugins(id),
    min_version VARCHAR(50),
    max_version VARCHAR(50),
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plugin_id, dependency_plugin_id)
);

CREATE TABLE plugin_categories_meta (
    id plugin_category PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Plugin Store and Installation
-- ============================================================================

CREATE TABLE plugin_installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    status installation_status DEFAULT 'installing',
    config_data JSONB DEFAULT '{}',
    enabled BOOLEAN DEFAULT TRUE,
    auto_update BOOLEAN DEFAULT TRUE,
    license_key VARCHAR(255),
    subscription_id UUID,
    installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, plugin_id)
);

CREATE TABLE plugin_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    installation_id UUID REFERENCES plugin_installations(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    pros TEXT[] DEFAULT '{}',
    cons TEXT[] DEFAULT '{}',
    version_reviewed VARCHAR(50),
    status review_status DEFAULT 'published',
    helpful_count INTEGER DEFAULT 0,
    unhelpful_count INTEGER DEFAULT 0,
    verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plugin_id, user_id) -- One review per user per plugin
);

CREATE TABLE plugin_review_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES plugin_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- ============================================================================
-- Order and Payment Management
-- ============================================================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status order_status DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50),
    billing_address JSONB,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    platform_fee DECIMAL(10,2) DEFAULT 0.00,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    plugin_id UUID NOT NULL REFERENCES plugins(id),
    plugin_name VARCHAR(255) NOT NULL,
    plugin_version VARCHAR(50) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    license_type VARCHAR(50),
    license_duration_months INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    payment_intent_id VARCHAR(255) UNIQUE, -- Stripe payment intent ID
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    gateway VARCHAR(50) NOT NULL, -- stripe, paypal, etc.
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    authorized_at TIMESTAMP WITH TIME ZONE,
    captured_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id),
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    gateway_refund_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Developer Earnings and Payouts
-- ============================================================================

CREATE TABLE developer_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES users(id),
    plugin_id UUID NOT NULL REFERENCES plugins(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    gross_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    earning_date DATE NOT NULL,
    payout_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE developer_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    payment_method VARCHAR(50),
    payment_details JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE developer_payout_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payout_id UUID NOT NULL REFERENCES developer_payouts(id) ON DELETE CASCADE,
    earning_id UUID NOT NULL REFERENCES developer_earnings(id),
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Analytics and Monitoring
-- ============================================================================

CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id UUID,
    event_type analytics_event_type NOT NULL,
    plugin_id UUID REFERENCES plugins(id),
    event_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE plugin_usage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_executions INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    avg_execution_time_ms INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0.00,
    new_installations INTEGER DEFAULT 0,
    uninstallations INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plugin_id, date)
);

CREATE TABLE platform_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    total_plugins INTEGER DEFAULT 0,
    active_plugins INTEGER DEFAULT 0,
    new_plugins INTEGER DEFAULT 0,
    total_downloads INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- System Configuration and Audit
-- ============================================================================

CREATE TABLE system_config (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE api_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    ip_address INET,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Users
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- User Sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Plugins
CREATE INDEX idx_plugins_name ON plugins(name);
CREATE INDEX idx_plugins_author_id ON plugins(author_id);
CREATE INDEX idx_plugins_category ON plugins(category);
CREATE INDEX idx_plugins_status ON plugins(status);
CREATE INDEX idx_plugins_pricing_type ON plugins(pricing_type);
CREATE INDEX idx_plugins_rating ON plugins(rating_average DESC);
CREATE INDEX idx_plugins_downloads ON plugins(download_count DESC);
CREATE INDEX idx_plugins_created_at ON plugins(created_at DESC);
CREATE INDEX idx_plugins_published_at ON plugins(published_at DESC);
CREATE INDEX idx_plugins_tags ON plugins USING GIN(tags);

-- Plugin Installations
CREATE INDEX idx_plugin_installations_user_id ON plugin_installations(user_id);
CREATE INDEX idx_plugin_installations_plugin_id ON plugin_installations(plugin_id);
CREATE INDEX idx_plugin_installations_status ON plugin_installations(status);
CREATE INDEX idx_plugin_installations_installed_at ON plugin_installations(installed_at DESC);

-- Plugin Reviews
CREATE INDEX idx_plugin_reviews_plugin_id ON plugin_reviews(plugin_id);
CREATE INDEX idx_plugin_reviews_user_id ON plugin_reviews(user_id);
CREATE INDEX idx_plugin_reviews_rating ON plugin_reviews(rating);
CREATE INDEX idx_plugin_reviews_status ON plugin_reviews(status);
CREATE INDEX idx_plugin_reviews_created_at ON plugin_reviews(created_at DESC);

-- Orders and Payments
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_gateway ON payments(gateway);

-- Developer Earnings
CREATE INDEX idx_developer_earnings_developer_id ON developer_earnings(developer_id);
CREATE INDEX idx_developer_earnings_plugin_id ON developer_earnings(plugin_id);
CREATE INDEX idx_developer_earnings_earning_date ON developer_earnings(earning_date DESC);

-- Analytics
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_plugin_id ON analytics_events(plugin_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp DESC);

CREATE INDEX idx_plugin_usage_stats_plugin_id ON plugin_usage_stats(plugin_id);
CREATE INDEX idx_plugin_usage_stats_date ON plugin_usage_stats(date DESC);

-- Full-text search indexes
CREATE INDEX idx_plugins_search ON plugins USING GIN(to_tsvector('english', display_name || ' ' || COALESCE(description, '')));

-- ============================================================================
-- Triggers for Automatic Updates
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plugins_updated_at BEFORE UPDATE ON plugins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update plugin stats when reviews are added/updated
CREATE OR REPLACE FUNCTION update_plugin_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE plugins SET
        rating_average = (
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM plugin_reviews
            WHERE plugin_id = COALESCE(NEW.plugin_id, OLD.plugin_id)
            AND status = 'published'
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM plugin_reviews
            WHERE plugin_id = COALESCE(NEW.plugin_id, OLD.plugin_id)
            AND status = 'published'
        )
    WHERE id = COALESCE(NEW.plugin_id, OLD.plugin_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_plugin_rating_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON plugin_reviews
    FOR EACH ROW EXECUTE FUNCTION update_plugin_rating_stats();

-- ============================================================================
-- Initial Data
-- ============================================================================

-- Insert default plugin categories
INSERT INTO plugin_categories_meta (id, display_name, description, sort_order, is_featured) VALUES
('vpn', 'VPN Services', 'VPN account management and automation plugins', 1, true),
('streaming', 'Streaming', 'Streaming service account and content management', 2, true),
('gaming', 'Gaming', 'Gaming accounts, keys, and digital game management', 3, true),
('software', 'Software', 'Software licenses and application management', 4, true),
('productivity', 'Productivity', 'Tools to enhance productivity and workflow', 5, false),
('security', 'Security', 'Security and privacy enhancement tools', 6, false),
('entertainment', 'Entertainment', 'Entertainment and media management tools', 7, false),
('utilities', 'Utilities', 'General utilities and helper tools', 8, false);

-- Insert system configuration defaults
INSERT INTO system_config (key, value, description, is_public) VALUES
('platform.name', '"MTYB Virtual Goods Platform"', 'Platform display name', true),
('platform.version', '"1.0.0"', 'Current platform version', true),
('platform.maintenance_mode', 'false', 'Enable maintenance mode', false),
('plugin.max_size_mb', '50', 'Maximum plugin package size in MB', true),
('plugin.review_required', 'true', 'Require manual review for new plugins', false),
('payment.currency_default', '"USD"', 'Default currency for payments', true),
('payment.platform_fee_percent', '30', 'Platform fee percentage (0-100)', false),
('rate_limit.api_requests_per_minute', '1000', 'API rate limit per minute', false),
('rate_limit.plugin_executions_per_hour', '10000', 'Plugin execution limit per hour', false);

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- Popular plugins view
CREATE VIEW popular_plugins AS
SELECT 
    p.*,
    u.username as author_username,
    u.first_name || ' ' || u.last_name as author_full_name
FROM plugins p
JOIN users u ON p.author_id = u.id
WHERE p.status = 'published'
ORDER BY p.download_count DESC, p.rating_average DESC;

-- User plugin dashboard view
CREATE VIEW user_plugin_dashboard AS
SELECT 
    pi.user_id,
    pi.plugin_id,
    p.name as plugin_name,
    p.display_name,
    p.version as installed_version,
    p.latest_version,
    pi.status as installation_status,
    pi.enabled,
    pi.installed_at,
    pi.last_used_at,
    CASE WHEN p.latest_version != pi.version THEN true ELSE false END as update_available
FROM plugin_installations pi
JOIN plugins p ON pi.plugin_id = p.id
WHERE pi.status = 'installed';

-- Developer earnings summary view
CREATE VIEW developer_earnings_summary AS
SELECT 
    de.developer_id,
    u.username,
    COUNT(DISTINCT de.plugin_id) as total_plugins,
    SUM(de.gross_amount) as total_gross_earnings,
    SUM(de.platform_fee) as total_platform_fees,
    SUM(de.net_amount) as total_net_earnings,
    de.currency,
    DATE_TRUNC('month', de.earning_date) as earning_month
FROM developer_earnings de
JOIN users u ON de.developer_id = u.id
GROUP BY de.developer_id, u.username, de.currency, DATE_TRUNC('month', de.earning_date)
ORDER BY earning_month DESC, total_net_earnings DESC;

-- ============================================================================
-- Security Policies (Row Level Security)
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_earnings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_own_data ON users
    FOR ALL USING (id = current_setting('app.current_user_id')::uuid);

CREATE POLICY user_sessions_own_data ON user_sessions
    FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY user_profiles_own_data ON user_profiles
    FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- Plugin installations - users see only their own
CREATE POLICY plugin_installations_own_data ON plugin_installations
    FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- Orders - users see only their own
CREATE POLICY orders_own_data ON orders
    FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- Payments - users see only their own
CREATE POLICY payments_own_data ON payments
    FOR ALL USING (order_id IN (SELECT id FROM orders WHERE user_id = current_setting('app.current_user_id')::uuid));

-- Developer earnings - developers see only their own
CREATE POLICY developer_earnings_own_data ON developer_earnings
    FOR ALL USING (developer_id = current_setting('app.current_user_id')::uuid);

-- ============================================================================
-- Database Functions for Business Logic
-- ============================================================================

-- Function to calculate plugin popularity score
CREATE OR REPLACE FUNCTION calculate_plugin_popularity_score(plugin_id UUID)
RETURNS INTEGER AS $$
DECLARE
    download_score INTEGER;
    rating_score INTEGER;
    recent_activity_score INTEGER;
    total_score INTEGER;
BEGIN
    -- Download score (0-40 points)
    SELECT LEAST(40, (download_count / 100)) INTO download_score
    FROM plugins WHERE id = plugin_id;
    
    -- Rating score (0-30 points)
    SELECT CASE 
        WHEN rating_count > 0 THEN ROUND((rating_average - 1) * 7.5)
        ELSE 0
    END INTO rating_score
    FROM plugins WHERE id = plugin_id;
    
    -- Recent activity score (0-30 points)
    SELECT CASE 
        WHEN updated_at > NOW() - INTERVAL '30 days' THEN 30
        WHEN updated_at > NOW() - INTERVAL '90 days' THEN 20
        WHEN updated_at > NOW() - INTERVAL '180 days' THEN 10
        ELSE 0
    END INTO recent_activity_score
    FROM plugins WHERE id = plugin_id;
    
    total_score := COALESCE(download_score, 0) + COALESCE(rating_score, 0) + COALESCE(recent_activity_score, 0);
    
    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get plugin recommendations for a user
CREATE OR REPLACE FUNCTION get_plugin_recommendations(user_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(plugin_id UUID, recommendation_score INTEGER, reason TEXT) AS $$
BEGIN
    RETURN QUERY
    WITH user_categories AS (
        -- Get user's preferred categories based on installed plugins
        SELECT p.category, COUNT(*) as install_count
        FROM plugin_installations pi
        JOIN plugins p ON pi.plugin_id = p.id
        WHERE pi.user_id = get_plugin_recommendations.user_id
        GROUP BY p.category
    ),
    recommended_plugins AS (
        SELECT 
            p.id as plugin_id,
            calculate_plugin_popularity_score(p.id) as popularity_score,
            CASE 
                WHEN uc.install_count IS NOT NULL THEN 20
                ELSE 0
            END as category_score,
            CASE 
                WHEN p.rating_average >= 4.5 THEN 15
                WHEN p.rating_average >= 4.0 THEN 10
                WHEN p.rating_average >= 3.5 THEN 5
                ELSE 0
            END as rating_bonus
        FROM plugins p
        LEFT JOIN user_categories uc ON p.category = uc.category
        WHERE p.status = 'published'
        AND p.id NOT IN (
            SELECT plugin_id FROM plugin_installations 
            WHERE user_id = get_plugin_recommendations.user_id
        )
    )
    SELECT 
        rp.plugin_id,
        (rp.popularity_score + rp.category_score + rp.rating_bonus) as recommendation_score,
        CASE 
            WHEN rp.category_score > 0 THEN 'Based on your interests'
            WHEN rp.rating_bonus >= 15 THEN 'Highly rated'
            ELSE 'Popular'
        END as reason
    FROM recommended_plugins rp
    ORDER BY recommendation_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;