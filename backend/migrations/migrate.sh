#!/bin/bash
# Migration runner script for the specwork dashboard

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="$BACKEND_DIR/migrations"
DB_PATH="$BACKEND_DIR/db/specs.sqlite"

echo -e "${YELLOW}Specwork Database Migration Runner${NC}"
echo "Backend directory: $BACKEND_DIR"
echo "Migrations directory: $MIGRATIONS_DIR"
echo "Database path: $DB_PATH"
echo ""

# Check if database directory exists
if [ ! -d "$(dirname "$DB_PATH")" ]; then
    echo -e "${YELLOW}Creating database directory...${NC}"
    mkdir -p "$(dirname "$DB_PATH")"
fi

# Check if TypeScript/Node.js is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Please install Node.js and npm.${NC}"
    exit 1
fi

# Check if sqlite3 is available for backup
if command -v sqlite3 &> /dev/null; then
    # Create backup before migration
    BACKUP_PATH="${DB_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}Creating database backup: $BACKUP_PATH${NC}"
    if [ -f "$DB_PATH" ]; then
        cp "$DB_PATH" "$BACKUP_PATH"
        echo -e "${GREEN}Backup created successfully${NC}"
    else
        echo -e "${YELLOW}No existing database to backup${NC}"
    fi
fi

# Change to backend directory
cd "$BACKEND_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
fi

# Run migrations
echo -e "${YELLOW}Running migrations...${NC}"
export DB_PATH="$DB_PATH"

if npx ts-node "$MIGRATIONS_DIR/migrate.ts" "$MIGRATIONS_DIR"; then
    echo -e "${GREEN}Migrations completed successfully!${NC}"
    
    # Show current schema
    if command -v sqlite3 &> /dev/null && [ -f "$DB_PATH" ]; then
        echo ""
        echo -e "${YELLOW}Current database schema:${NC}"
        sqlite3 "$DB_PATH" ".tables"
    fi
else
    echo -e "${RED}Migration failed!${NC}"
    if [ -f "$BACKUP_PATH" ]; then
        echo -e "${YELLOW}You can restore from backup: $BACKUP_PATH${NC}"
    fi
    exit 1
fi