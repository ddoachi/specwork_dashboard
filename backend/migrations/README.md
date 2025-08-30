# Migrations Quick Reference

## Run Migrations
```bash
yarn migrate                    # Run all pending migrations
yarn migrate:ts                 # Run using TypeScript directly
```

## Check Status
```bash
sqlite3 db/specs.sqlite "SELECT * FROM migrations;"
sqlite3 db/specs.sqlite ".tables"
```

## Current Migration Files
- `001_initial_schema.sql` - Base database structure
- `002_migrate_legacy_tables.sql` - Legacy data migration (placeholder)
- `003_add_subtask_support.sql` - Subtask support and optimizations

## Migration Tools
- `migrate.ts` - TypeScript runner with transaction safety
- `migrate.sh` - Shell wrapper with backups and colored output

## Safety Features
- ✅ Automatic database backups before each run
- ✅ Transaction rollback on failure  
- ✅ Idempotent - safe to run multiple times
- ✅ Migration tracking to prevent duplicates

## For Complete Documentation
See [`MIGRATION_GUIDE.md`](../MIGRATION_GUIDE.md) for full usage instructions, troubleshooting, and best practices.