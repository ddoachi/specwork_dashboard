# Spec Dashboard Automation Plan

## Executive Summary

This document outlines a comprehensive automation strategy for the Spec Dashboard to achieve two key goals:
1. **Automatic spec property gathering from GitHub main branch**
2. **Automatic database synchronization after spec updates**

## Current Architecture Analysis

### Spec File Structure (Type-Prefixed Naming)
- **Epic Level**: `E01-E12` directories containing `spec.md`
- **Feature Level**: `F01-F10` subdirectories under each Epic
- **Task Level**: `T01-T06` subdirectories under each Feature
- Each spec has YAML frontmatter with metadata (id, title, type, status, etc.)

### Database Schema
- Main entity: `spec.entity.ts` with type-prefixed IDs
- Related entities: tags, commits, PRs, files, relationships
- TypeORM-based PostgreSQL database

## Solution 1: GitHub-Based Automatic Spec Property Gathering

### Architecture Overview
```
GitHub Main Branch → GitHub Actions → Parse Specs → Update Dashboard
```

### Implementation Components

#### 1.1 GitHub Actions Workflow
Create `.github/workflows/sync-specs.yml`:
```yaml
name: Sync Spec Properties
on:
  push:
    branches: [main]
    paths:
      - 'specs/**/*.md'
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  sync-specs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Parse Spec Files
        run: npm run parse:specs
      - name: Update Dashboard
        run: npm run sync:dashboard
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

#### 1.2 Spec Parser Service
Create `backend/src/specs/spec-parser.service.ts`:
```typescript
@Injectable()
export class SpecParserService {
  async parseSpecFile(path: string): Promise<SpecMetadata> {
    // Parse YAML frontmatter
    // Extract all properties
    // Return structured data
  }
  
  async scanAllSpecs(): Promise<SpecMetadata[]> {
    // Glob pattern: specs/**/spec.md
    // Parse each file
    // Return array of metadata
  }
}
```

#### 1.3 Sync Controller
Create `backend/src/specs/sync.controller.ts`:
```typescript
@Controller('api/specs/sync')
export class SpecSyncController {
  @Post('github-webhook')
  async handleGitHubWebhook(@Body() payload: GitHubWebhook) {
    // Validate webhook signature
    // Parse changed files
    // Update database
    // Trigger dashboard refresh
  }
}
```

#### 1.4 GitHub Webhook Configuration
- Set up webhook for push events to main branch
- Filter for `specs/**/*.md` changes
- Call sync endpoint automatically

### Benefits
- Zero manual intervention
- Real-time updates on push
- Scheduled sync as backup
- Single source of truth (GitHub)

## Solution 2: Token-Efficient Index.md Updates

### Problem
Claude needs to update both spec metadata and `index.md`, but rewriting the entire index.md (~200+ lines) consumes ~4000 tokens per update.

### Solution: Targeted Line Updates
Instead of rewriting the entire file, Claude only updates specific changed lines using one of these strategies:

#### 2.1 Strategy: Structured Data + Template (Recommended)
Separate data from presentation:

**specs-data.json** (What Claude updates):
```json
{
  "specs": {
    "E01_F01_T01": {
      "title": "Hot Storage",
      "status": "completed",
      "updated": "2025-08-30"
    }
  },
  "stats": {
    "completed_count": 5,
    "in_progress_count": 6
  }
}
```

**Claude's Workflow:**
```bash
# Update only the JSON (small file)
edit specs-data.json  # Change 1-2 lines only

# Regenerate index.md from template
npm run generate:index
```

**Token Savings: 97% reduction** (from ~4000 to ~130 tokens)

#### 2.2 Alternative: Update Script
Claude runs a simple command:
```bash
update-index.sh --spec E01_F01_T01 --status completed
```

The script handles the rest using sed/awk to update specific lines.

### Implementation
Create `scripts/generate-index.js`:
```javascript
const data = JSON.parse(fs.readFileSync('specs-data.json'));
const template = fs.readFileSync('index.template.md', 'utf-8');

// Calculate stats
data.stats.progress = (data.stats.completed_count / data.stats.total_tasks * 100).toFixed(1);

// Generate index.md
const output = handlebars.compile(template)(data);
fs.writeFileSync('specs/index.md', output);
```

### Benefits
- **96-99% token reduction** per update
- **Faster Claude responses**
- **Better git diffs** (only real changes)
- **No risk of formatting errors**
- **Works seamlessly with Solution 1** (GitHub Actions)

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
1. Set up GitHub Actions workflow
2. Implement spec parser service
3. Create database sync endpoints
4. Test with sample specs

### Phase 2: Automation (Week 2)
1. Configure GitHub webhooks
2. Implement git hooks
3. Create Claude integration scripts
4. Set up error handling and logging

### Phase 3: Enhancement (Week 3)
1. Add validation rules
2. Implement conflict resolution
3. Create rollback mechanism
4. Add monitoring and alerts

### Phase 4: Optimization (Week 4)
1. Cache frequently accessed data
2. Optimize database queries
3. Add batch processing
4. Performance testing

## Technical Requirements

### Dependencies
```json
{
  "dependencies": {
    "gray-matter": "^4.0.3",  // YAML frontmatter parsing
    "glob": "^10.3.0",         // File pattern matching
    "simple-git": "^3.20.0",   // Git operations
    "@octokit/webhooks": "^12.0.0"  // GitHub webhook handling
  }
}
```

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/specs
GITHUB_WEBHOOK_SECRET=your-webhook-secret
SYNC_API_KEY=your-internal-api-key
```

## Security Considerations

1. **Webhook Validation**: Verify GitHub webhook signatures
2. **API Authentication**: Use API keys for internal sync endpoints
3. **Database Transactions**: Use atomic operations for consistency
4. **Error Recovery**: Implement rollback on failure
5. **Audit Logging**: Track all sync operations

## Monitoring & Maintenance

### Key Metrics
- Sync success rate
- Processing time per spec
- Database update latency
- Index.md generation time

### Alerting Rules
- Failed sync operations
- Parsing errors
- Database connection issues
- Webhook delivery failures

## Conclusion

This automation plan provides:
1. **Zero-touch updates** from GitHub to Dashboard
2. **Single-operation updates** for Claude
3. **Real-time synchronization** across all systems
4. **Robust error handling** and recovery

The system ensures that spec properties are always current, reduces manual work, and maintains data consistency across the entire platform.