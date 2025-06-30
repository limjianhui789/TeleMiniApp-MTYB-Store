-- ============================================================================
-- Seed Data: Demo Users, Plugins, and Sample Data
-- Description: Populate database with realistic demo data for development
-- Created: 2024-06-30
-- ============================================================================

-- Clear existing data (for development only)
-- TRUNCATE TABLE analytics_events, plugin_usage_stats, developer_earnings, 
-- plugin_reviews, plugin_installations, plugins, users RESTART IDENTITY CASCADE;

-- ============================================================================
-- Demo Users
-- ============================================================================

INSERT INTO users (id, telegram_id, username, first_name, last_name, email, role, status) VALUES 
-- Regular users
(uuid_generate_v4(), 123456789, 'john_doe', 'John', 'Doe', 'john@example.com', 'user', 'active'),
(uuid_generate_v4(), 234567890, 'jane_smith', 'Jane', 'Smith', 'jane@example.com', 'user', 'active'),
(uuid_generate_v4(), 345678901, 'tech_enthusiast', 'Tech', 'Enthusiast', 'tech@example.com', 'user', 'active'),

-- Developers
(uuid_generate_v4(), 456789012, 'dev_alice', 'Alice', 'Developer', 'alice@techcorp.com', 'developer', 'active'),
(uuid_generate_v4(), 567890123, 'dev_bob', 'Bob', 'Builder', 'bob@streamdev.com', 'developer', 'active'),
(uuid_generate_v4(), 678901234, 'security_sam', 'Sam', 'Security', 'sam@securecorp.com', 'developer', 'active'),

-- Admin and moderators
(uuid_generate_v4(), 789012345, 'admin_user', 'Admin', 'User', 'admin@mtyb.shop', 'admin', 'active'),
(uuid_generate_v4(), 890123456, 'moderator_1', 'Mod', 'Erator', 'mod@mtyb.shop', 'moderator', 'active');

-- ============================================================================
-- Demo Plugins
-- ============================================================================

-- Get user IDs for reference
DO $$
DECLARE
    alice_id UUID;
    bob_id UUID;
    sam_id UUID;
    vpn_plugin_id UUID;
    streaming_plugin_id UUID;
    security_plugin_id UUID;
    gaming_plugin_id UUID;
BEGIN
    -- Get developer IDs
    SELECT id INTO alice_id FROM users WHERE username = 'dev_alice';
    SELECT id INTO bob_id FROM users WHERE username = 'dev_bob';
    SELECT id INTO sam_id FROM users WHERE username = 'security_sam';

    -- Insert VPN Plugin
    INSERT INTO plugins (
        id, name, display_name, short_description, description, author_id, category, tags,
        version, latest_version, status, pricing_type, price, currency, 
        rating_average, rating_count, download_count, active_install_count,
        min_platform_version, supported_devices, required_permissions,
        published_at
    ) VALUES (
        uuid_generate_v4(), 'vpn-premium-pro', 'VPN Premium Pro',
        '企业级VPN服务，支持全球100+服务器节点',
        '企业级VPN服务，支持全球100+服务器节点，军用级加密，提供最高级别的网络安全保护。支持智能节点选择、流量加速、广告拦截等高级功能。',
        alice_id, 'vpn', ARRAY['vpn', 'security', 'premium', 'enterprise'],
        '2.1.0', '2.1.0', 'published', 'paid', 29.99, 'USD',
        4.8, 2547, 15623, 12400,
        '1.0.0', ARRAY['mobile', 'desktop'], ARRAY['network', 'storage'],
        NOW() - INTERVAL '30 days'
    ) RETURNING id INTO vpn_plugin_id;

    -- Insert Streaming Plugin
    INSERT INTO plugins (
        id, name, display_name, short_description, description, author_id, category, tags,
        version, latest_version, status, pricing_type, price, currency,
        rating_average, rating_count, download_count, active_install_count,
        min_platform_version, supported_devices, required_permissions,
        published_at
    ) VALUES (
        uuid_generate_v4(), 'streaming-plus', 'Streaming Plus',
        '解锁全球流媒体内容，支持Netflix、Disney+、HBO Max等',
        '解锁全球流媒体内容，支持Netflix、Disney+、HBO Max等主流平台，提供高清流畅的观看体验。智能地区切换，无缓冲播放。',
        bob_id, 'streaming', ARRAY['streaming', 'entertainment', 'netflix', 'disney'],
        '1.5.2', '1.5.2', 'published', 'paid', 19.99, 'USD',
        4.6, 1832, 8945, 7200,
        '1.0.0', ARRAY['mobile', 'desktop', 'tablet'], ARRAY['network'],
        NOW() - INTERVAL '25 days'
    ) RETURNING id INTO streaming_plugin_id;

    -- Insert Security Plugin
    INSERT INTO plugins (
        id, name, display_name, short_description, description, author_id, category, tags,
        version, latest_version, status, pricing_type, price, currency,
        rating_average, rating_count, download_count, active_install_count,
        min_platform_version, supported_devices, required_permissions,
        published_at
    ) VALUES (
        uuid_generate_v4(), 'security-scanner-pro', 'Security Scanner Pro',
        '专业级安全漏洞扫描器，保护您的数字资产',
        '专业级安全漏洞扫描器，实时监控网络安全威胁，提供详细的安全报告和修复建议。支持多种扫描模式和自定义规则。',
        sam_id, 'security', ARRAY['security', 'scanner', 'protection', 'monitoring'],
        '3.0.1', '3.0.1', 'published', 'freemium', 0.00, 'USD',
        4.4, 5621, 23456, 18900,
        '1.0.0', ARRAY['desktop'], ARRAY['network', 'storage'],
        NOW() - INTERVAL '20 days'
    ) RETURNING id INTO security_plugin_id;

    -- Insert Gaming Plugin
    INSERT INTO plugins (
        id, name, display_name, short_description, description, author_id, category, tags,
        version, latest_version, status, pricing_type, price, currency,
        rating_average, rating_count, download_count, active_install_count,
        min_platform_version, supported_devices, required_permissions,
        published_at
    ) VALUES (
        uuid_generate_v4(), 'game-launcher-deluxe', 'Game Launcher Deluxe',
        '一体化游戏启动器，管理Steam、Epic Games、GOG等平台',
        '一体化游戏启动器，统一管理Steam、Epic Games、GOG等平台游戏，提供游戏库同步、自动更新、性能优化等功能。',
        alice_id, 'gaming', ARRAY['gaming', 'launcher', 'steam', 'epic-games'],
        '3.0.1', '3.0.1', 'published', 'free', 0.00, 'USD',
        4.4, 3421, 18756, 15200,
        '1.0.0', ARRAY['desktop'], ARRAY['storage', 'process'],
        NOW() - INTERVAL '15 days'
    ) RETURNING id INTO gaming_plugin_id;

    -- Insert more plugins for variety
    INSERT INTO plugins (
        id, name, display_name, short_description, description, author_id, category, tags,
        version, latest_version, status, pricing_type, price, currency,
        rating_average, rating_count, download_count, active_install_count,
        published_at
    ) VALUES 
    (uuid_generate_v4(), 'productivity-suite', 'Productivity Suite',
     '提升工作效率的完整工具套件',
     '集成多种生产力工具，包括任务管理、时间跟踪、文档协作等功能，帮助个人和团队提升工作效率。',
     bob_id, 'productivity', ARRAY['productivity', 'workflow', 'collaboration'],
     '2.0.5', '2.0.5', 'published', 'paid', 15.99, 'USD',
     4.3, 1234, 9876, 7500, NOW() - INTERVAL '10 days'),
     
    (uuid_generate_v4(), 'media-organizer', 'Media Organizer',
     '智能媒体文件整理和管理工具',
     '自动整理照片、视频和音频文件，支持智能标签、重复文件检测、批量重命名等功能。',
     sam_id, 'utilities', ARRAY['media', 'organizer', 'automation'],
     '1.3.2', '1.3.2', 'published', 'freemium', 0.00, 'USD',
     4.1, 890, 5432, 4100, NOW() - INTERVAL '7 days'),
     
    (uuid_generate_v4(), 'code-assistant', 'Code Assistant',
     'AI驱动的编程助手，提升开发效率',
     'AI驱动的编程助手，提供代码自动补全、错误检测、重构建议等功能，支持多种编程语言。',
     alice_id, 'software', ARRAY['coding', 'ai', 'development', 'assistant'],
     '1.0.0', '1.0.0', 'published', 'paid', 39.99, 'USD',
     4.7, 567, 3210, 2800, NOW() - INTERVAL '5 days');

    -- ============================================================================
    -- Demo Plugin Reviews
    -- ============================================================================

    -- Get some user IDs for reviews
    DECLARE
        john_id UUID;
        jane_id UUID;
        tech_id UUID;
    BEGIN
        SELECT id INTO john_id FROM users WHERE username = 'john_doe';
        SELECT id INTO jane_id FROM users WHERE username = 'jane_smith';
        SELECT id INTO tech_id FROM users WHERE username = 'tech_enthusiast';

        -- Reviews for VPN Plugin
        INSERT INTO plugin_reviews (plugin_id, user_id, rating, title, comment, version_reviewed, status, verified_purchase) VALUES
        (vpn_plugin_id, john_id, 5, '绝佳的VPN服务', 
         '连接速度非常快，服务器覆盖全球，客服响应及时。物超所值，强烈推荐！', 
         '2.1.0', 'published', true),
        (vpn_plugin_id, jane_id, 4, '功能强大但价格略高', 
         '功能确实很全面，安全性也很好，但价格对学生来说有点贵。整体还是推荐的。', 
         '2.0.0', 'published', true),
        (vpn_plugin_id, tech_id, 5, '企业级品质', 
         '我们公司使用这个VPN服务已经半年了，稳定性很好，安全功能完善，值得信赖。', 
         '2.1.0', 'published', true);

        -- Reviews for Streaming Plugin
        INSERT INTO plugin_reviews (plugin_id, user_id, rating, title, comment, version_reviewed, status, verified_purchase) VALUES
        (streaming_plugin_id, john_id, 4, '解锁效果不错', 
         '能够成功解锁Netflix和Disney+，画质也很好。偶尔会有连接问题，但总体满意。', 
         '1.5.2', 'published', true),
        (streaming_plugin_id, tech_id, 5, '追剧神器', 
         '终于可以看到更多内容了！支持的平台很多，切换也很方便。值得购买。', 
         '1.5.1', 'published', true);

        -- Reviews for Security Plugin
        INSERT INTO plugin_reviews (plugin_id, user_id, rating, title, comment, version_reviewed, status, verified_purchase) VALUES
        (security_plugin_id, jane_id, 4, '免费版功能够用', 
         '免费版提供的基础扫描功能已经很实用了，界面也很直观。考虑升级到付费版。', 
         '3.0.1', 'published', false),
        (security_plugin_id, tech_id, 5, '专业级安全工具', 
         '作为IT从业者，这个工具帮助我发现了很多潜在的安全问题。报告详细，建议实用。', 
         '3.0.0', 'published', false);
    END;

    -- ============================================================================
    -- Demo Plugin Installations
    -- ============================================================================

    DECLARE
        john_id UUID;
        jane_id UUID;
        tech_id UUID;
    BEGIN
        SELECT id INTO john_id FROM users WHERE username = 'john_doe';
        SELECT id INTO jane_id FROM users WHERE username = 'jane_smith';
        SELECT id INTO tech_id FROM users WHERE username = 'tech_enthusiast';

        -- John's installations
        INSERT INTO plugin_installations (user_id, plugin_id, version, status, enabled, installed_at, last_used_at) VALUES
        (john_id, vpn_plugin_id, '2.1.0', 'installed', true, NOW() - INTERVAL '25 days', NOW() - INTERVAL '1 day'),
        (john_id, streaming_plugin_id, '1.5.2', 'installed', true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 days');

        -- Jane's installations
        INSERT INTO plugin_installations (user_id, plugin_id, version, status, enabled, installed_at, last_used_at) VALUES
        (jane_id, vpn_plugin_id, '2.0.0', 'installed', true, NOW() - INTERVAL '45 days', NOW() - INTERVAL '3 days'),
        (jane_id, security_plugin_id, '3.0.1', 'installed', true, NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day');

        -- Tech enthusiast's installations
        INSERT INTO plugin_installations (user_id, plugin_id, version, status, enabled, installed_at, last_used_at) VALUES
        (tech_id, vpn_plugin_id, '2.1.0', 'installed', true, NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 hour'),
        (tech_id, streaming_plugin_id, '1.5.1', 'installed', false, NOW() - INTERVAL '25 days', NOW() - INTERVAL '10 days'),
        (tech_id, security_plugin_id, '3.0.0', 'installed', true, NOW() - INTERVAL '35 days', NOW() - INTERVAL '2 hours'),
        (tech_id, gaming_plugin_id, '3.0.1', 'installed', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 hours');
    END;

    -- ============================================================================
    -- Demo Orders and Payments
    -- ============================================================================

    DECLARE
        john_id UUID;
        jane_id UUID;
        order1_id UUID;
        order2_id UUID;
        order3_id UUID;
    BEGIN
        SELECT id INTO john_id FROM users WHERE username = 'john_doe';
        SELECT id INTO jane_id FROM users WHERE username = 'jane_smith';

        -- John's VPN purchase
        INSERT INTO orders (id, user_id, order_number, status, total_amount, currency, completed_at) VALUES
        (uuid_generate_v4(), john_id, 'ORD-2024-001', 'completed', 29.99, 'USD', NOW() - INTERVAL '25 days')
        RETURNING id INTO order1_id;

        INSERT INTO order_items (order_id, plugin_id, plugin_name, plugin_version, unit_price, total_price) VALUES
        (order1_id, vpn_plugin_id, 'VPN Premium Pro', '2.1.0', 29.99, 29.99);

        INSERT INTO payments (order_id, amount, currency, status, payment_method, gateway, captured_at) VALUES
        (order1_id, 29.99, 'USD', 'captured', 'card', 'stripe', NOW() - INTERVAL '25 days');

        -- John's Streaming purchase
        INSERT INTO orders (id, user_id, order_number, status, total_amount, currency, completed_at) VALUES
        (uuid_generate_v4(), john_id, 'ORD-2024-002', 'completed', 19.99, 'USD', NOW() - INTERVAL '20 days')
        RETURNING id INTO order2_id;

        INSERT INTO order_items (order_id, plugin_id, plugin_name, plugin_version, unit_price, total_price) VALUES
        (order2_id, streaming_plugin_id, 'Streaming Plus', '1.5.2', 19.99, 19.99);

        INSERT INTO payments (order_id, amount, currency, status, payment_method, gateway, captured_at) VALUES
        (order2_id, 19.99, 'USD', 'captured', 'card', 'stripe', NOW() - INTERVAL '20 days');

        -- Jane's VPN purchase
        INSERT INTO orders (id, user_id, order_number, status, total_amount, currency, completed_at) VALUES
        (uuid_generate_v4(), jane_id, 'ORD-2024-003', 'completed', 29.99, 'USD', NOW() - INTERVAL '45 days')
        RETURNING id INTO order3_id;

        INSERT INTO order_items (order_id, plugin_id, plugin_name, plugin_version, unit_price, total_price) VALUES
        (order3_id, vpn_plugin_id, 'VPN Premium Pro', '2.0.0', 29.99, 29.99);

        INSERT INTO payments (order_id, amount, currency, status, payment_method, gateway, captured_at) VALUES
        (order3_id, 29.99, 'USD', 'captured', 'paypal', 'paypal', NOW() - INTERVAL '45 days');
    END;

    -- ============================================================================
    -- Demo Analytics Events
    -- ============================================================================

    DECLARE
        john_id UUID;
        jane_id UUID;
        tech_id UUID;
    BEGIN
        SELECT id INTO john_id FROM users WHERE username = 'john_doe';
        SELECT id INTO jane_id FROM users WHERE username = 'jane_smith';
        SELECT id INTO tech_id FROM users WHERE username = 'tech_enthusiast';

        -- Generate sample analytics events
        INSERT INTO analytics_events (user_id, event_type, plugin_id, event_data, timestamp) VALUES
        -- Plugin views
        (john_id, 'plugin_view', vpn_plugin_id, '{"source": "search"}', NOW() - INTERVAL '26 days'),
        (john_id, 'plugin_view', streaming_plugin_id, '{"source": "recommendation"}', NOW() - INTERVAL '21 days'),
        (jane_id, 'plugin_view', vpn_plugin_id, '{"source": "featured"}', NOW() - INTERVAL '46 days'),
        (tech_id, 'plugin_view', security_plugin_id, '{"source": "category"}', NOW() - INTERVAL '36 days'),
        
        -- Plugin installations
        (john_id, 'plugin_install', vpn_plugin_id, '{"version": "2.1.0"}', NOW() - INTERVAL '25 days'),
        (john_id, 'plugin_install', streaming_plugin_id, '{"version": "1.5.2"}', NOW() - INTERVAL '20 days'),
        (jane_id, 'plugin_install', vpn_plugin_id, '{"version": "2.0.0"}', NOW() - INTERVAL '45 days'),
        (tech_id, 'plugin_install', security_plugin_id, '{"version": "3.0.0"}', NOW() - INTERVAL '35 days'),
        
        -- Plugin executions
        (john_id, 'plugin_execute', vpn_plugin_id, '{"duration_ms": 1250}', NOW() - INTERVAL '1 day'),
        (john_id, 'plugin_execute', streaming_plugin_id, '{"duration_ms": 2100}', NOW() - INTERVAL '2 days'),
        (tech_id, 'plugin_execute', security_plugin_id, '{"duration_ms": 5500}', NOW() - INTERVAL '2 hours');
    END;

    -- ============================================================================
    -- Demo Usage Statistics
    -- ============================================================================

    -- Generate usage stats for the last 30 days
    INSERT INTO plugin_usage_stats (plugin_id, date, total_executions, unique_users, error_count, avg_execution_time_ms, new_installations, uninstallations)
    SELECT 
        vpn_plugin_id,
        DATE(NOW() - (INTERVAL '1 day' * generate_series(0, 29))),
        (RANDOM() * 100 + 50)::INTEGER,
        (RANDOM() * 30 + 10)::INTEGER,
        (RANDOM() * 3)::INTEGER,
        (RANDOM() * 1000 + 500)::INTEGER,
        (RANDOM() * 5 + 1)::INTEGER,
        (RANDOM() * 2)::INTEGER;

    INSERT INTO plugin_usage_stats (plugin_id, date, total_executions, unique_users, error_count, avg_execution_time_ms, new_installations, uninstallations)
    SELECT 
        streaming_plugin_id,
        DATE(NOW() - (INTERVAL '1 day' * generate_series(0, 29))),
        (RANDOM() * 80 + 30)::INTEGER,
        (RANDOM() * 25 + 8)::INTEGER,
        (RANDOM() * 2)::INTEGER,
        (RANDOM() * 1500 + 800)::INTEGER,
        (RANDOM() * 4 + 1)::INTEGER,
        (RANDOM() * 1)::INTEGER;

END $$;

-- ============================================================================
-- Update Plugin Statistics
-- ============================================================================

-- Update plugin download counts and ratings based on the demo data
UPDATE plugins SET 
    download_count = (SELECT COUNT(*) FROM plugin_installations WHERE plugin_id = plugins.id) * 100,
    active_install_count = (SELECT COUNT(*) FROM plugin_installations WHERE plugin_id = plugins.id AND status = 'installed'),
    rating_average = COALESCE((SELECT AVG(rating) FROM plugin_reviews WHERE plugin_id = plugins.id AND status = 'published'), 0),
    rating_count = (SELECT COUNT(*) FROM plugin_reviews WHERE plugin_id = plugins.id AND status = 'published');

-- ============================================================================
-- Create User Profiles for Demo Users
-- ============================================================================

INSERT INTO user_profiles (user_id, bio, notification_preferences, privacy_settings)
SELECT 
    id,
    CASE 
        WHEN role = 'developer' THEN 'Passionate developer creating innovative plugins for the MTYB platform.'
        WHEN role = 'admin' THEN 'Platform administrator ensuring the best experience for all users.'
        WHEN role = 'moderator' THEN 'Community moderator helping maintain quality and safety.'
        ELSE 'Regular user enjoying the amazing plugins available on MTYB platform.'
    END,
    '{"email_notifications": true, "push_notifications": true, "marketing_emails": false}',
    '{"profile_visibility": "public", "show_email": false, "show_real_name": true}'
FROM users;

-- ============================================================================
-- Insert Platform Metrics
-- ============================================================================

-- Generate platform metrics for the last 30 days
INSERT INTO platform_metrics (date, total_users, active_users, new_users, total_plugins, active_plugins, new_plugins, total_downloads, total_revenue)
SELECT 
    DATE(NOW() - (INTERVAL '1 day' * generate_series(0, 29))),
    (SELECT COUNT(*) FROM users) + (generate_series * 2), -- Growing user base
    (RANDOM() * 50 + 20)::INTEGER, -- Active users per day
    (RANDOM() * 5 + 1)::INTEGER, -- New users per day
    (SELECT COUNT(*) FROM plugins WHERE status = 'published'),
    (SELECT COUNT(*) FROM plugins WHERE status = 'published'),
    CASE WHEN generate_series % 7 = 0 THEN 1 ELSE 0 END, -- New plugin weekly
    (RANDOM() * 1000 + 500)::INTEGER, -- Daily downloads
    (RANDOM() * 500 + 100)::DECIMAL(10,2) -- Daily revenue
FROM generate_series(0, 29);

-- Completed
SELECT 'Demo data insertion completed successfully!' AS status;