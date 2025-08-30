-- Migration 001: Initial Database Schema
-- Creates the foundational tables for the specwork dashboard

-- Main specs table with unified entity model
CREATE TABLE IF NOT EXISTS "specs" (
    "id" varchar(64) PRIMARY KEY NOT NULL,
    "hierarchical_id" varchar(64) UNIQUE,
    "title" text NOT NULL,
    "type" varchar(20) NOT NULL,
    "parent" varchar(64),
    "status" varchar(20) NOT NULL DEFAULT 'draft',
    "priority" varchar(20) NOT NULL DEFAULT 'medium',
    "created" date NOT NULL,
    "updated" date NOT NULL,
    "estimated_hours" integer NOT NULL DEFAULT 0,
    "actual_hours" integer NOT NULL DEFAULT 0,
    "children" text,
    "pull_requests" text,
    "commits" text,
    "context_file" text,
    "effort" varchar(20),
    "risk" varchar(20)
);

-- Supporting tables for file associations
CREATE TABLE IF NOT EXISTS "spec_files" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "spec_id" varchar(64) NOT NULL,
    "path" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "spec_commits" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "spec_id" varchar(64) NOT NULL,
    "sha" varchar(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS "spec_prs" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "spec_id" varchar(64) NOT NULL,
    "url" text NOT NULL
);

-- Tag system
CREATE TABLE IF NOT EXISTS "spec_tags" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "name" text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "spec_tag_map" (
    "spec_id" varchar(64) NOT NULL,
    "tag_id" integer NOT NULL,
    PRIMARY KEY ("spec_id", "tag_id")
);

-- Relationships between specs
CREATE TABLE IF NOT EXISTS "spec_relations" (
    "from_id" varchar(64) NOT NULL,
    "to_id" varchar(64) NOT NULL,
    "rel_type" varchar(20) NOT NULL,
    PRIMARY KEY ("from_id", "to_id", "rel_type")
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_specs_hierarchical_id" ON "specs"("hierarchical_id");
CREATE INDEX IF NOT EXISTS "idx_specs_type" ON "specs"("type");
CREATE INDEX IF NOT EXISTS "idx_specs_status" ON "specs"("status");
CREATE INDEX IF NOT EXISTS "idx_specs_parent" ON "specs"("parent");
CREATE INDEX IF NOT EXISTS "idx_spec_files_spec_id" ON "spec_files"("spec_id");
CREATE INDEX IF NOT EXISTS "idx_spec_commits_spec_id" ON "spec_commits"("spec_id");
CREATE INDEX IF NOT EXISTS "idx_spec_prs_spec_id" ON "spec_prs"("spec_id");
CREATE INDEX IF NOT EXISTS "idx_spec_relations_from" ON "spec_relations"("from_id");
CREATE INDEX IF NOT EXISTS "idx_spec_relations_to" ON "spec_relations"("to_id");