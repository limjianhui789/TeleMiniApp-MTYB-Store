-- ============================================================================
-- Migration: 001_initial_schema
-- Description: Create initial database schema for MTYB Platform
-- Created: 2024-06-30
-- ============================================================================

-- This migration script creates the complete initial schema
-- Run this file to set up the database from scratch

\i '../schema.sql'

-- Migration completed
INSERT INTO system_config (key, value, description, is_public) VALUES 
('migration.001_initial_schema', '"completed"', 'Initial schema migration status', false),
('migration.last_applied', '"001_initial_schema"', 'Last applied migration', false),
('migration.applied_at', '"{\"001_initial_schema\": \"' || NOW() || '\"}"', 'Migration application timestamps', false)
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();