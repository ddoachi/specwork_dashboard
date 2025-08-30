-- Migration 003: Add Subtask Support and Hierarchical Improvements
-- Adds support for subtasks and improves hierarchical structure

-- Update the type check to include subtasks
-- SQLite doesn't have ENUM types, so we rely on application-level validation
-- This migration ensures the database can store 'subtask' type values

-- Add any missing indexes for performance
CREATE INDEX IF NOT EXISTS "idx_specs_created" ON "specs"("created");
CREATE INDEX IF NOT EXISTS "idx_specs_updated" ON "specs"("updated");
CREATE INDEX IF NOT EXISTS "idx_specs_priority" ON "specs"("priority");

-- Update any existing parent relationships that might be using old ID formats
-- This ensures all parent references use hierarchical_id format
UPDATE specs 
SET parent = (
    SELECT hierarchical_id 
    FROM specs parent_spec 
    WHERE parent_spec.id = specs.parent 
    AND parent_spec.hierarchical_id IS NOT NULL
)
WHERE parent IS NOT NULL 
AND parent NOT LIKE '%-%'  -- Only update if parent doesn't look like hierarchical_id
AND EXISTS (
    SELECT 1 
    FROM specs parent_spec 
    WHERE parent_spec.id = specs.parent 
    AND parent_spec.hierarchical_id IS NOT NULL
);

-- Ensure children arrays are properly formatted
-- This helps maintain consistency in the JSON arrays stored in the children field
UPDATE specs 
SET children = '[]' 
WHERE children IS NULL OR children = '';

UPDATE specs 
SET pull_requests = '[]' 
WHERE pull_requests IS NULL OR pull_requests = '';

UPDATE specs 
SET commits = '[]' 
WHERE commits IS NULL OR commits = '';