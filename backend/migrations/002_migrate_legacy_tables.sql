-- Migration 002: Legacy Table Data Migration
-- Migrates data from separate Epic/Feature/Task tables to unified specs table
-- This migration is safe to run on databases without legacy tables

-- Note: This migration requires manual data migration for existing databases
-- with legacy tables. The migration will skip if no legacy data exists.

-- For databases with existing legacy tables (epics, features, tasks), 
-- run the following SQL manually after verifying data structure:

-- INSERT OR IGNORE INTO specs (id, hierarchical_id, title, type, status, priority, created, updated, estimated_hours, actual_hours, context_file, effort, risk)
-- SELECT id, epic_code, title, 'epic', status, priority, created, updated, estimated_hours, actual_hours, context_file, effort, risk FROM epics;

-- INSERT OR IGNORE INTO specs (id, hierarchical_id, title, type, parent, status, priority, created, updated, estimated_hours, actual_hours, context_file, effort, risk) 
-- SELECT id, feature_code, title, 'feature', epic_code, status, priority, created, updated, estimated_hours, actual_hours, context_file, effort, risk FROM features;

-- INSERT OR IGNORE INTO specs (id, hierarchical_id, title, type, parent, status, priority, created, updated, estimated_hours, actual_hours, context_file, effort, risk)
-- SELECT id, task_code, title, 'task', feature_code, status, priority, created, updated, estimated_hours, actual_hours, context_file, effort, risk FROM tasks;

-- This migration is a placeholder that can be safely run on any database
SELECT 1 as migration_placeholder;