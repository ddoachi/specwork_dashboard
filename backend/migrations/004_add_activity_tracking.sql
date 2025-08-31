-- Migration 004: Add Comprehensive Activity Tracking System
-- Creates tables for tracking detailed spec lifecycle activities with rich metadata

-- Main activity tracking table
CREATE TABLE IF NOT EXISTS "spec_activities" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "spec_id" varchar(64) NOT NULL,
    "hierarchical_id" varchar(64),
    "activity_type" varchar(50) NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "content_preview" text, -- Preview of spec/context content
    "metadata" text, -- JSON string for additional data
    "spec_path" text, -- Path to spec.md file
    "context_path" text, -- Path to context.md file
    "actor" varchar(100), -- Who performed the action (for future use)
    "created_at" datetime DEFAULT CURRENT_TIMESTAMP,
    "spec_snapshot" text -- JSON snapshot of spec state at activity time
);

-- Supported activity types:
-- 'spec_created' - New spec created
-- 'spec_reviewed' - Spec has been reviewed
-- 'spec_split' - Spec split into subtasks
-- 'spec_discussion' - Discussion added or updated
-- 'spec_implementation_started' - Implementation work began
-- 'spec_implementation_progress' - Implementation progress update
-- 'spec_implemented' - Implementation completed
-- 'spec_blocked' - Spec blocked by dependencies
-- 'spec_unblocked' - Blocking issues resolved
-- 'spec_updated' - General updates to spec
-- 'spec_archived' - Spec archived
-- 'spec_reactivated' - Archived spec reactivated
-- 'dependencies_changed' - Dependencies added/removed
-- 'pr_linked' - Pull request linked
-- 'commit_linked' - Commit linked
-- 'context_added' - Context document added
-- 'context_updated' - Context document updated
-- 'deliverables_updated' - Deliverables modified
-- 'acceptance_criteria_met' - Acceptance criteria fulfilled

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_spec_activities_spec_id" ON "spec_activities"("spec_id");
CREATE INDEX IF NOT EXISTS "idx_spec_activities_hierarchical_id" ON "spec_activities"("hierarchical_id");
CREATE INDEX IF NOT EXISTS "idx_spec_activities_created_at" ON "spec_activities"("created_at");
CREATE INDEX IF NOT EXISTS "idx_spec_activities_type" ON "spec_activities"("activity_type");

-- Activity detection rules table (for automatic activity generation)
CREATE TABLE IF NOT EXISTS "activity_rules" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "rule_name" varchar(100) NOT NULL UNIQUE,
    "activity_type" varchar(50) NOT NULL,
    "detection_pattern" text NOT NULL, -- JSON pattern for detection logic
    "title_template" text NOT NULL,
    "description_template" text NOT NULL,
    "enabled" boolean DEFAULT 1,
    "priority" integer DEFAULT 100
);

-- Insert default activity detection rules
INSERT OR IGNORE INTO activity_rules (rule_name, activity_type, detection_pattern, title_template, description_template) VALUES
('new_spec', 'spec_created', '{"status": "draft", "age_hours": 24}', 'New Spec Created', 'New {type} "{title}" has been created'),
('spec_review', 'spec_reviewed', '{"keywords": ["review", "feedback", "approved"]}', 'Spec Reviewed', 'Spec "{title}" has been reviewed and feedback provided'),
('spec_split', 'spec_split', '{"children_added": true}', 'Spec Split', 'Spec "{title}" has been split into {children_count} subtasks'),
('discussion', 'spec_discussion', '{"keywords": ["discussion", "question", "clarification"]}', 'Active Discussion', 'Discussion ongoing for "{title}"'),
('impl_start', 'spec_implementation_started', '{"status_change": ["draft", "in_progress"]}', 'Implementation Started', 'Implementation of "{title}" has begun'),
('impl_progress', 'spec_implementation_progress', '{"commits_added": true, "status": "in_progress"}', 'Implementation Progress', 'Progress update on "{title}" implementation'),
('completed', 'spec_implemented', '{"status_change": ["*", "completed"]}', 'Spec Implemented', '"{title}" has been successfully implemented'),
('blocked', 'spec_blocked', '{"status_change": ["*", "blocked"]}', 'Spec Blocked', '"{title}" is blocked and needs attention'),
('pr_link', 'pr_linked', '{"pull_requests_added": true}', 'PR Linked', 'Pull request linked to "{title}"'),
('commit_link', 'commit_linked', '{"commits_added": true}', 'Commit Linked', 'New commits linked to "{title}"');

-- Activity summaries table for dashboard analytics
CREATE TABLE IF NOT EXISTS "activity_summaries" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "date" date NOT NULL,
    "activity_type" varchar(50) NOT NULL,
    "count" integer NOT NULL DEFAULT 0,
    "metadata" text, -- JSON for additional summary data
    UNIQUE("date", "activity_type")
);

CREATE INDEX IF NOT EXISTS "idx_activity_summaries_date" ON "activity_summaries"("date");