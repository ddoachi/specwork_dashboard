# Unified Spec Automation Implementation Plan

## Overview

A single GitHub Actions workflow that automatically:

1. Parses all spec metadata from spec files
2. Updates the database with current spec states
3. Regenerates index.md with accurate statistics
4. Commits the updated index.md back to the repository

**Claude's only job**: Update spec files and merge to main. Everything else is automated.

## Architecture

```mermaid
graph TB
    A[Claude Updates Spec] --> B[Merge to Main]
    B --> C[GitHub Actions Triggered]
    C --> D[Parse All Specs]
    D --> E[Update Database]
    D --> F[Generate index.md]
    F --> G[Commit index.md]
    G --> H[Dashboard Auto-Updates]
```

## Implementation Components

### 1. GitHub Actions Workflow

`.github/workflows/sync-specs.yml`

```yaml
name: Sync Specs and Update Index

on:
  push:
    branches: [main]
    paths:
      - "specs/**/*.md"
  workflow_dispatch: # Manual trigger option

jobs:
  sync-specs:
    runs-on: ubuntu-latest
    permissions:
      contents: write # Need to push index.md updates

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Parse all spec files
        id: parse
        run: |
          npm run parse:specs
          echo "specs_data=$(cat specs-data.json)" >> $GITHUB_OUTPUT

      - name: Update database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          npm run sync:database

      - name: Generate index.md
        run: |
          npm run generate:index

      - name: Commit index.md if changed
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"

          if git diff --quiet specs/index.md; then
            echo "No changes to index.md"
          else
            git add specs/index.md
            git commit -m "Auto-update index.md with latest spec statistics [skip ci]"
            git push
          fi
```

### 2. Spec Parser Service

`scripts/parse-specs.ts`

```typescript
import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import matter from "gray-matter";

interface SpecMetadata {
  id: string;
  title: string;
  type: "epic" | "feature" | "task";
  parent?: string;
  status: string;
  priority: string;
  created: string;
  updated: string;
  children?: string[];
  estimated_hours?: number;
  actual_hours?: number;
  pull_requests?: string[];
  commits?: string[];
}

interface SpecData {
  specs: Record<string, SpecMetadata>;
  stats: {
    total_epics: number;
    total_features: number;
    total_tasks: number;
    completed: string[];
    in_progress: string[];
    draft: string[];
    blocked: string[];
  };
  hierarchy: Record<string, any>;
}

async function parseAllSpecs(): Promise<SpecData> {
  const specFiles = await glob("specs/**/spec.md");
  const specs: Record<string, SpecMetadata> = {};
  const hierarchy: Record<string, any> = {};

  // Parse each spec file
  for (const file of specFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const { data } = matter(content);

    // Extract directory structure for type-prefixed naming
    const dir = path.dirname(file);
    const parts = dir.split("/");
    const specId = parts[parts.length - 1]; // E01, F01, T01, etc.

    specs[specId] = {
      id: specId,
      title: data.title,
      type: data.type,
      parent: data.parent,
      status: data.status,
      priority: data.priority,
      created: data.created,
      updated: data.updated,
      children: data.children,
      estimated_hours: data.estimated_hours,
      actual_hours: data.actual_hours,
      pull_requests: data.pull_requests,
      commits: data.commits,
    };

    // Build hierarchy
    if (data.type === "epic") {
      hierarchy[specId] = {
        ...specs[specId],
        features: {},
      };
    } else if (data.type === "feature" && data.parent) {
      if (!hierarchy[data.parent]) hierarchy[data.parent] = { features: {} };
      hierarchy[data.parent].features[specId] = {
        ...specs[specId],
        tasks: {},
      };
    } else if (data.type === "task" && data.parent) {
      // Find parent feature
      const parentFeature = Object.values(hierarchy).find((epic: any) =>
        Object.keys(epic.features || {}).includes(data.parent)
      );
      if (parentFeature) {
        parentFeature.features[data.parent].tasks[specId] = specs[specId];
      }
    }
  }

  // Calculate statistics
  const stats = {
    total_epics: Object.values(specs).filter((s) => s.type === "epic").length,
    total_features: Object.values(specs).filter((s) => s.type === "feature")
      .length,
    total_tasks: Object.values(specs).filter((s) => s.type === "task").length,
    completed: Object.keys(specs).filter(
      (id) => specs[id].status === "completed"
    ),
    in_progress: Object.keys(specs).filter(
      (id) => specs[id].status === "in_progress"
    ),
    draft: Object.keys(specs).filter((id) => specs[id].status === "draft"),
    blocked: Object.keys(specs).filter((id) => specs[id].status === "blocked"),
  };

  const specData: SpecData = { specs, stats, hierarchy };

  // Save to JSON file
  fs.writeFileSync("specs-data.json", JSON.stringify(specData, null, 2));

  return specData;
}

// Run if called directly
if (require.main === module) {
  parseAllSpecs()
    .then(() => console.log("✅ Specs parsed successfully"))
    .catch(console.error);
}

export { parseAllSpecs, SpecMetadata, SpecData };
```

### 3. Database Sync Service

`scripts/sync-database.ts`

```typescript
import axios from "axios";
import * as fs from "fs";

async function syncDatabase() {
  const specData = JSON.parse(fs.readFileSync("specs-data.json", "utf-8"));

  // Batch update all specs
  const response = await axios.post(
    process.env.API_URL + "/api/specs/batch-sync",
    specData,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SYNC_API_KEY}`,
      },
    }
  );

  console.log(
    `✅ Synced ${Object.keys(specData.specs).length} specs to database`
  );
  return response.data;
}

// Run if called directly
if (require.main === module) {
  syncDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Database sync failed:", err);
      process.exit(1);
    });
}

export { syncDatabase };
```

### 4. Index.md Generator

`scripts/generate-index.ts`

```typescript
import * as fs from "fs";
import * as handlebars from "handlebars";

// Register Handlebars helpers
handlebars.registerHelper("percentage", (completed: number, total: number) => {
  return ((completed / total) * 100).toFixed(1);
});

handlebars.registerHelper("progressBar", (percentage: number) => {
  const filled = Math.round(percentage / 5);
  const empty = 20 - filled;
  return "█".repeat(filled) + "░".repeat(empty);
});

handlebars.registerHelper("statusIcon", (status: string) => {
  const icons: Record<string, string> = {
    completed: "✅",
    in_progress: "🚧",
    draft: "📋",
    blocked: "🚫",
  };
  return icons[status] || "";
});

function generateIndex() {
  // Load spec data
  const specData = JSON.parse(fs.readFileSync("specs-data.json", "utf-8"));

  // Calculate additional stats
  const totalSpecs =
    specData.stats.total_epics +
    specData.stats.total_features +
    specData.stats.total_tasks;

  const completedCount = specData.stats.completed.length;
  const progressPercentage = (completedCount / totalSpecs) * 100;

  // Add calculated values
  specData.calculated = {
    totalSpecs,
    completedCount,
    progressPercentage: progressPercentage.toFixed(1),
    progressBar:
      "█".repeat(Math.round(progressPercentage / 5)) +
      "░".repeat(20 - Math.round(progressPercentage / 5)),
    lastUpdated: new Date().toISOString(),
  };

  // Load template
  const templatePath = "templates/index.template.md";
  const template = fs.readFileSync(templatePath, "utf-8");

  // Compile and generate
  const compiled = handlebars.compile(template);
  const output = compiled(specData);

  // Write index.md
  fs.writeFileSync("specs/index.md", output);
  console.log("✅ index.md generated successfully");
}

// Run if called directly
if (require.main === module) {
  generateIndex();
}

export { generateIndex };
```

### 5. Index.md Template

`templates/index.template.md`

```markdown
# 📊 Spec Dashboard

> Auto-generated from spec files on {{calculated.lastUpdated}}

## 🎯 Quick Stats

- **Total Epics**: {{stats.total_epics}}
- **Total Features**: {{stats.total_features}}
- **Total Tasks**: {{stats.total_tasks}}
- **Completed**: {{stats.completed.length}} 🔥
- **In Progress**: {{stats.in_progress.length}}
- **Overall Progress**: {{calculated.progressPercentage}}%

## 🚀 Progress
```

Progress Bar: [{{calculated.progressBar}}] {{calculated.progressPercentage}}%
Completed: {{stats.completed.length}}/{{calculated.totalSpecs}}

```

## 📁 Specifications

{{#each hierarchy}}
### {{statusIcon status}} [{{@key}} - {{title}}]({{@key}}/spec.md)

> Status: `{{status}}` | Priority: `{{priority}}`

{{#if features}}
{{#each features}}
- {{statusIcon status}} [{{@key}} - {{title}}]({{../key}}/{{@key}}/spec.md) `{{status}}`
  {{#each tasks}}
  - {{statusIcon status}} [{{@key}} - {{title}}]({{../../key}}/{{../key}}/{{@key}}/spec.md)
  {{/each}}
{{/each}}
{{/if}}

{{/each}}

---
*Generated automatically by GitHub Actions*
```

### 6. Backend API Endpoint

`backend/src/specs/specs.controller.ts`

```typescript
@Controller("api/specs")
export class SpecsController {
  constructor(private specsService: SpecsService) {}

  @Post("batch-sync")
  @UseGuards(ApiKeyGuard)
  async batchSync(@Body() specData: SpecData) {
    return this.specsService.batchUpdateSpecs(specData);
  }
}
```

### 7. Package.json Scripts

```json
{
  "scripts": {
    "parse:specs": "ts-node scripts/parse-specs.ts",
    "sync:database": "ts-node scripts/sync-database.ts",
    "generate:index": "ts-node scripts/generate-index.ts",
    "sync:all": "npm run parse:specs && npm run sync:database && npm run generate:index"
  }
}
```

## Claude's Simplified Workflow

With this implementation, Claude only needs to:

```bash
# 1. Update spec file
edit specs/E01/F01/T01/spec.md

# 2. Commit and push
git add specs/E01/F01/T01/spec.md
git commit -m "Complete T01: Hot Storage implementation"
git push

# That's it! GitHub Actions handles everything else automatically
```

## Benefits

1. **Zero Token Overhead**: Claude never touches index.md
2. **Single Source of Truth**: Spec files are the only source
3. **Automatic Synchronization**: Database and index.md always in sync
4. **No Manual Steps**: Everything happens automatically on push
5. **Error Recovery**: If any step fails, the workflow can be re-run
6. **Audit Trail**: All updates tracked in git history

## Implementation Timeline

### Day 1: Core Infrastructure

- [ ] Create GitHub Actions workflow
- [ ] Implement spec parser script
- [ ] Set up GitHub secrets

### Day 2: Database Integration

- [ ] Create batch sync endpoint
- [ ] Implement database sync script
- [ ] Add authentication

### Day 3: Index Generation

- [ ] Create Handlebars template
- [ ] Implement index generator
- [ ] Test full workflow

### Day 4: Testing & Refinement

- [ ] Test with various spec updates
- [ ] Add error handling
- [ ] Optimize performance

## Environment Setup

### Required Secrets in GitHub

```
DATABASE_URL=postgresql://user:pass@host:5432/specdb
API_URL=https://api.yourapp.com
SYNC_API_KEY=your-secure-api-key
```

### Local Development

```bash
# Install dependencies
npm install gray-matter glob handlebars axios

# Test locally
npm run sync:all

# Check generated files
cat specs-data.json
cat specs/index.md
```

## Monitoring

### GitHub Actions Dashboard

- Monitor workflow runs at: `github.com/[repo]/actions`
- Set up notifications for failed workflows
- Review execution time metrics

### Database Sync Logs

- Track successful syncs
- Monitor for parsing errors
- Alert on sync failures

## Conclusion

This unified approach eliminates all manual work after spec updates. Claude focuses solely on updating spec files, while GitHub Actions automatically:

1. Parses all metadata
2. Updates the database
3. Regenerates index.md
4. Commits changes back

Total token usage for Claude: **0** (for index.md updates)
Total automation: **100%**
