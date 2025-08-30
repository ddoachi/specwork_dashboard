-- Migration 002: Migrate from Legacy Epic/Feature/Task Tables to Unified Specs
-- Handles data migration from separate entity tables to unified specs table

-- Check if legacy tables exist and migrate data
-- This migration is idempotent and can be run multiple times safely

-- Migrate epics to specs table
INSERT OR IGNORE INTO specs (
    id, hierarchical_id, title, type, status, priority, created, updated,
    estimated_hours, actual_hours, context_file, effort, risk, commits, pull_requests
)
SELECT 
    id,
    epic_code as hierarchical_id,
    title,
    'epic' as type,
    status,
    priority,
    created,
    updated,
    estimated_hours,
    actual_hours,
    context_file,
    effort,
    risk,
    commits,
    pull_requests
FROM epics
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='epics');

-- Migrate features to specs table
INSERT OR IGNORE INTO specs (
    id, hierarchical_id, title, type, parent, status, priority, created, updated,
    estimated_hours, actual_hours, context_file, effort, risk, commits, pull_requests
)
SELECT 
    id,
    feature_code as hierarchical_id,
    title,
    'feature' as type,
    epic_code as parent,
    status,
    priority,
    created,
    updated,
    estimated_hours,
    actual_hours,
    context_file,
    effort,
    risk,
    commits,
    pull_requests
FROM features
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='features');

-- Migrate tasks to specs table
INSERT OR IGNORE INTO specs (
    id, hierarchical_id, title, type, parent, status, priority, created, updated,
    estimated_hours, actual_hours, context_file, effort, risk, commits, pull_requests
)
SELECT 
    id,
    task_code as hierarchical_id,
    title,
    'task' as type,
    feature_code as parent,
    status,
    priority,
    created,
    updated,
    estimated_hours,
    actual_hours,
    context_file,
    effort,
    risk,
    commits,
    pull_requests
FROM tasks
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='tasks');

-- Update parent references to use hierarchical IDs instead of codes
UPDATE specs 
SET parent = (
    SELECT s2.hierarchical_id 
    FROM specs s2 
    WHERE s2.hierarchical_id = specs.parent 
    AND s2.type IN ('epic', 'feature')
)
WHERE parent IS NOT NULL;

-- Drop legacy tables if they exist (commented out for safety)
-- DROP TABLE IF EXISTS epics;
-- DROP TABLE IF EXISTS features; 
-- DROP TABLE IF EXISTS tasks;