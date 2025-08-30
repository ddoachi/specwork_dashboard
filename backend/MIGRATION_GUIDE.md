# Database Migration Guide

This guide explains how to use the database migration system in the Specwork Dashboard project.

## Overview

The migration system provides safe, versioned database schema changes using SQLite. It includes:
- Transaction-safe migrations with automatic rollback on failure
- Automatic database backups before migrations
- Migration tracking to prevent duplicate executions
- Both TypeScript and shell-based runners

## Quick Start

### Running Migrations

```bash
# Run all pending migrations (recommended)
yarn migrate

# Or run using TypeScript directly
yarn migrate:ts

# From the backend directory
cd backend
yarn migrate
```

### Check Migration Status

```bash
# View current database schema
sqlite3 db/specs.sqlite ".tables"

# Check applied migrations
sqlite3 db/specs.sqlite "SELECT * FROM migrations ORDER BY id;"
```

## Migration Files

Migration files are located in `backend/migrations/` and follow the naming convention:
- `001_initial_schema.sql`
- `002_migrate_legacy_tables.sql` 
- `003_add_subtask_support.sql`

### Current Migrations

1. **001_initial_schema.sql** - Creates the foundational database structure
   - Unified `specs` table with hierarchical ID support
   - Supporting tables: `spec_files`, `spec_commits`, `spec_prs`, `spec_tags`, etc.
   - Performance indexes

2. **002_migrate_legacy_tables.sql** - Legacy data migration placeholder
   - Safe for fresh installations
   - Contains manual migration instructions for existing legacy data

3. **003_add_subtask_support.sql** - Subtask support and optimizations
   - Additional indexes for performance
   - Data cleanup for consistency

## Creating New Migrations

### 1. Create Migration File

Create a new file in `backend/migrations/` with the next sequential number:

```bash
# Example: 004_add_new_feature.sql
touch backend/migrations/004_add_new_feature.sql
```

### 2. Migration File Structure

```sql
-- Migration 004: Add New Feature
-- Description of what this migration does

-- Create new table
CREATE TABLE IF NOT EXISTS "new_feature" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "name" text NOT NULL,
    "created" date NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add new column to existing table
ALTER TABLE specs ADD COLUMN new_field text;

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_new_feature_name" ON "new_feature"("name");

-- Update existing data (if needed)
UPDATE specs SET new_field = 'default_value' WHERE new_field IS NULL;
```

### 3. Test Your Migration

```bash
# Run the new migration
yarn migrate

# Verify the changes
sqlite3 db/specs.sqlite ".schema new_feature"
```

## Migration Best Practices

### 1. Use IF NOT EXISTS
Always use `IF NOT EXISTS` for CREATE statements:
```sql
CREATE TABLE IF NOT EXISTS "table_name" (...);
CREATE INDEX IF NOT EXISTS "index_name" ON "table"("column");
```

### 2. Handle Data Safely
- Use transactions for complex changes
- Provide default values for new columns
- Test with realistic data

### 3. Make Migrations Idempotent
Migrations should be safe to run multiple times:
```sql
-- Good: Safe to run multiple times
ALTER TABLE specs ADD COLUMN new_field text DEFAULT 'default';

-- Better: Check if column exists (SQLite doesn't support IF NOT EXISTS for columns)
-- Use application-level checking or conditional logic
```

### 4. Document Changes
Include clear comments explaining:
- What the migration does
- Why the change is needed
- Any manual steps required

## Troubleshooting

### Migration Fails

If a migration fails:

1. **Check the error message** - The migration runner provides detailed error information
2. **Restore from backup** - Automatic backups are created before each migration run:
   ```bash
   # Find backup files
   ls db/*.backup.*
   
   # Restore from backup
   cp db/specs.sqlite.backup.TIMESTAMP db/specs.sqlite
   ```

3. **Fix the migration file** and run again
4. **Manual cleanup** if needed:
   ```bash
   # Remove failed migration record
   sqlite3 db/specs.sqlite "DELETE FROM migrations WHERE id = 'failed_migration_id';"
   ```

### Check Database State

```bash
# View all tables
sqlite3 db/specs.sqlite ".tables"

# View table schema
sqlite3 db/specs.sqlite ".schema table_name"

# Check migration history
sqlite3 db/specs.sqlite "SELECT id, filename, applied_at FROM migrations;"

# Count records
sqlite3 db/specs.sqlite "SELECT COUNT(*) FROM specs;"
```

### Reset Database (Development Only)

```bash
# ⚠️  WARNING: This deletes all data
rm db/specs.sqlite

# Run migrations to recreate
yarn migrate
```

## Advanced Usage

### TypeScript Migration Runner

The TypeScript runner (`migrate.ts`) can be used directly:

```bash
# Run with custom database path
DB_PATH="/path/to/database.sqlite" npx ts-node backend/migrations/migrate.ts

# Run with custom migrations directory
npx ts-node backend/migrations/migrate.ts /custom/migrations/path
```

### Manual Migration Execution

For complex migrations, you can execute SQL manually:

```bash
# Execute SQL file directly
sqlite3 db/specs.sqlite < backend/migrations/004_custom.sql

# Record migration manually
sqlite3 db/specs.sqlite "INSERT INTO migrations (id, filename) VALUES ('004_custom', '004_custom.sql');"
```

### Backup Management

```bash
# Create manual backup
cp db/specs.sqlite db/specs.sqlite.backup.$(date +%Y%m%d_%H%M%S)

# Clean old backups (keep last 5)
ls -t db/*.backup.* | tail -n +6 | xargs rm -f
```

## Integration with Development Workflow

### Before Making Schema Changes

1. Create a new migration file
2. Test the migration on a copy of production data
3. Review the migration with your team
4. Run the migration in development environment

### Deployment

1. Ensure all migrations are committed
2. Run migrations as part of deployment:
   ```bash
   yarn migrate
   ```
3. Verify the deployment was successful
4. Monitor application logs for any issues

### CI/CD Integration

Add to your deployment pipeline:

```bash
# In your deployment script
echo "Running database migrations..."
cd backend && yarn migrate

if [ $? -ne 0 ]; then
    echo "Migration failed! Rolling back deployment."
    exit 1
fi
```

## File Structure

```
backend/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_migrate_legacy_tables.sql
│   ├── 003_add_subtask_support.sql
│   ├── migrate.ts              # TypeScript runner
│   └── migrate.sh              # Shell wrapper
├── package.json                # Contains migrate scripts
└── MIGRATION_GUIDE.md          # This file

db/
├── specs.sqlite                # Main database
└── specs.sqlite.backup.*       # Automatic backups
```

## Support

If you encounter issues with migrations:

1. Check this guide for common solutions
2. Review the error messages carefully
3. Examine the automatic backup files
4. Test migrations on a copy of your data first

The migration system is designed to be safe and recoverable, but always backup important data before running migrations in production.