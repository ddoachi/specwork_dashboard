# Token-Efficient Index.md Update Strategy

## Problem Statement
Updating `index.md` after each spec work requires Claude to read and rewrite a large file (~200+ lines), consuming significant tokens. We need a strategy that minimizes token usage while maintaining accuracy.

## Solution: Targeted Line-Based Updates

### Core Principle
Instead of rewriting the entire file, Claude only updates specific lines that changed.

## Implementation Strategies

### Strategy 1: Comment Markers with Line IDs (RECOMMENDED)
Add invisible HTML comments as update anchors:

```markdown
## 🎯 Quick Stats
<!-- STATS_START -->
- **Total Epics**: 12
- **Total Features**: 21
- **Total Tasks**: 24
- **Completed**: 4 <!-- ID:completed_count -->
- **In Progress**: 6 <!-- ID:in_progress_count -->
- **Overall Progress**: 18.8% <!-- ID:overall_progress -->
<!-- STATS_END -->

### 🏗️ [E01 - Foundation & Infrastructure Setup](E01/spec.md)
- 📦 [F01 - Storage Infrastructure](E01/F01/spec.md) <!-- ID:E01_F01_status -->`🚧 In Progress`
  - [T01 - Hot Storage](E01/F01/T01/spec.md) <!-- ID:E01_F01_T01_status -->✅ `Completed`
```

**Claude's Update Command:**
```bash
# Update only specific markers
update-index.sh --id "E01_F01_T01_status" --value "✅ \`Completed\`"
update-index.sh --id "completed_count" --value "5"
update-index.sh --id "overall_progress" --value "20.1%"
```

### Strategy 2: JSON Patch File
Claude creates a minimal JSON patch:

```json
{
  "updates": [
    {
      "section": "stats",
      "field": "completed",
      "value": "5 🔥 (1011, 1012, 1013, 1014, 1015)"
    },
    {
      "section": "specs",
      "id": "E01_F01_T01",
      "status": "completed"
    }
  ]
}
```

Then a script applies the patch:
```bash
npm run update:index --patch updates.json
```

### Strategy 3: Structured Data File + Template
Separate data from presentation:

**specs-data.json:**
```json
{
  "stats": {
    "epics": 12,
    "features": 21,
    "tasks": 24,
    "completed": ["T01", "T02", "T03", "T04", "T05"],
    "in_progress": ["T06", "T07", "T08"]
  },
  "specs": {
    "E01": {
      "title": "Foundation & Infrastructure Setup",
      "status": "in_progress",
      "features": {
        "F01": {
          "title": "Storage Infrastructure",
          "status": "in_progress",
          "tasks": {
            "T01": { "title": "Hot Storage", "status": "completed" }
          }
        }
      }
    }
  }
}
```

Claude only updates the JSON (much smaller), then:
```bash
npm run generate:index  # Regenerates index.md from template + data
```

### Strategy 4: Incremental Append Log
Claude appends changes to a log file:

**index-updates.log:**
```
2025-08-30T10:00:00Z|STATUS|E01_F01_T01|completed
2025-08-30T10:00:01Z|STAT|completed_count|5
2025-08-30T10:00:02Z|STAT|progress|20.1
```

A watcher script applies updates:
```bash
npm run watch:index-updates  # Applies log entries to index.md
```

## Token Usage Comparison

| Strategy | Tokens to Read | Tokens to Write | Total | Reduction |
|----------|---------------|-----------------|-------|-----------|
| Full Rewrite | ~2000 | ~2000 | ~4000 | 0% |
| Comment Markers | ~50 | ~100 | ~150 | 96% |
| JSON Patch | ~50 | ~80 | ~130 | 97% |
| Structured Data | ~200 | ~100 | ~300 | 93% |
| Append Log | 0 | ~50 | ~50 | 99% |

## Recommended Implementation

### Phase 1: Quick Win (Comment Markers)
1. Add HTML comment IDs to index.md
2. Create `scripts/update-index-marker.sh`
3. Claude uses simple bash commands to update

### Phase 2: Optimal Solution (Structured Data)
1. Extract current index.md data to JSON
2. Create Handlebars/EJS template
3. Claude updates only JSON
4. Auto-generate index.md

### Claude Workflow (After Implementation)

Instead of:
```bash
# Current: Read entire file, rewrite entire file
claude: Read index.md (2000 tokens)
claude: Write index.md (2000 tokens)
```

Claude will:
```bash
# New: Update only what changed
claude: Run `update-index.sh --spec E01_F01_T01 --status completed`
# Or
claude: Edit specs-data.json (change 1 line)
claude: Run `npm run generate:index`
```

## Implementation Scripts

### scripts/update-index.sh
```bash
#!/bin/bash
# Ultra-efficient index updater

SPEC_ID=$1
STATUS=$2

# Update using sed with marker IDs
sed -i "s/<!-- ID:${SPEC_ID}_status -->.*$/<!-- ID:${SPEC_ID}_status -->✅ \`${STATUS}\`/" specs/index.md

# Recalculate stats
npm run calc:stats >> specs/index.md.tmp
mv specs/index.md.tmp specs/index.md

echo "✅ Updated ${SPEC_ID} to ${STATUS}"
```

### scripts/generate-index.js
```javascript
const fs = require('fs');
const handlebars = require('handlebars');

// Load data and template
const data = JSON.parse(fs.readFileSync('specs-data.json'));
const template = fs.readFileSync('index.template.md', 'utf-8');

// Calculate stats
data.stats.progress = (data.stats.completed.length / data.stats.tasks * 100).toFixed(1);

// Generate index.md
const compiled = handlebars.compile(template);
const output = compiled(data);

fs.writeFileSync('specs/index.md', output);
console.log('✅ index.md regenerated');
```

## Benefits

1. **96-99% token reduction** per update
2. **Faster Claude responses** (less processing)
3. **Lower error rate** (smaller operations)
4. **Better git diffs** (only changed lines)
5. **Parallel updates possible** (no file locks)

## Integration with Solution 1

The GitHub Actions workflow can also use the same efficient update mechanism:

```yaml
- name: Update Index Efficiently
  run: |
    # Parse changed specs
    CHANGES=$(git diff --name-only HEAD^ HEAD | grep "specs/.*\.md$")
    
    # Update only changed entries
    for spec in $CHANGES; do
      npm run update:index --spec $spec
    done
    
    # Commit if changed
    git add specs/index.md
    git commit -m "Auto-update index.md" || true
```

## Conclusion

By implementing targeted updates instead of full rewrites, we can reduce token usage by 96-99% while maintaining the same functionality. The recommended approach is to start with comment markers for immediate improvement, then move to structured data for optimal efficiency.