# JTS Spec Dashboard Implementation Plan

## Project Overview

Transform the static markdown-based JTS (Joohan Trading System) specification tracking system into a dynamic web dashboard with real-time updates, interactive visualizations, and comprehensive project management capabilities.

## Current State Analysis

### Existing Infrastructure

#### Spec File Structure
- **Location**: `/home/joohan/dev/project-jts/jts/specs/`
- **Format**: Markdown files with YAML frontmatter metadata
- **Hierarchy**: Epic (1000s) → Feature (100s) → Task (10s)
- **File Types**:
  - `.spec.md` - Specification documents
  - `.context.md` - Implementation context and progress
  - `.md` - Task-level specifications

#### Spec Metadata Structure
```yaml
id: 'XXXX'
title: 'Spec Title'
type: 'epic|feature|task'
parent: 'parent_id'
children: []
epic: 'epic_id'
domain: 'infrastructure|broker|data|strategy|etc'
status: 'draft|planning|in_progress|completed|blocked'
priority: 'low|medium|high|critical'
created: 'YYYY-MM-DD'
updated: 'YYYY-MM-DD'
estimated_hours: X
actual_hours: X
dependencies: []
blocks: []
tags: []
```

#### Backend Implementation (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: SQLite (implied from migrations)
- **Endpoints**:
  - `POST /specs/upsert` - Create/update spec
  - `GET /specs/:id` - Get single spec
  - `GET /specs` - List specs with filters

#### Frontend Implementation (Next.js)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Current Pages**:
  - `/` - Default Next.js template
  - `/specs` - Basic spec list
  - `/specs/[id]` - Spec detail view

## Dashboard Requirements

### Core Features

#### 1. Main Dashboard
- **Quick Stats Panel**
  - Total counts: Epics (12), Features (21), Tasks (24)
  - Status distribution: Draft, Planning, In Progress, Completed, Blocked
  - Overall progress percentage
  - Active implementations count
  - This week's activity summary

- **Progress Visualization**
  - Interactive progress bars per Epic
  - Hierarchical tree view of Epic → Feature → Task
  - Visual status indicators with colors
  - Completion percentages

- **Activity Timeline**
  - Recent spec updates
  - Commit and PR tracking
  - Time investment metrics
  - Deliverables counter

#### 2. Markdown Document Viewer
- **Folder Tree Navigation**
  - Mirror the actual `/specs` directory structure
  - Expandable/collapsible folders
  - File type icons (.spec.md, .context.md, .md)
  - Quick search within tree

- **Markdown Rendering**
  - Full markdown support with syntax highlighting
  - YAML frontmatter parsing and display
  - Internal link navigation (jump to linked specs)
  - External link handling
  - Code block rendering with language support

- **Document Features**
  - Breadcrumb navigation
  - Table of contents generation
  - Copy link to section
  - Print-friendly view
  - Export as PDF

#### 3. System Architecture Visualization
- **Module Mapping**
  - Visual representation of system modules
  - Spec-to-module association
  - Dependency graph visualization
  - Module completion status

- **Architecture Views**
  - High-level system overview
  - Module interconnections
  - Data flow diagrams
  - Service boundaries

#### 4. Interactive Features
- **Kanban Board View**
  - Drag-and-drop status management
  - Swimlanes by epic/feature
  - WIP limits
  - Quick actions menu

- **Search & Filtering**
  - Full-text search across all specs
  - Advanced filters (status, type, epic, domain, tags)
  - Saved filter presets
  - Quick filters toolbar

- **Bulk Operations**
  - Multi-select specs
  - Batch status updates
  - Bulk tagging
  - Export selected specs

## Technical Implementation

### Backend Enhancements

#### New API Endpoints
```typescript
// Dashboard Statistics
GET /api/dashboard/stats
Response: {
  totals: { epics: 12, features: 21, tasks: 24 },
  statusCounts: { draft: X, planning: Y, ... },
  progress: { overall: 18.8, byEpic: {...} },
  recentActivity: [...],
  weeklyMetrics: {...}
}

// Hierarchical Data
GET /api/specs/hierarchy
Response: {
  tree: [
    {
      id: "1000",
      title: "Foundation",
      type: "epic",
      children: [...]
    }
  ]
}

// File System Integration
GET /api/specs/files
GET /api/specs/files/:path
Response: {
  type: "file|directory",
  content: "markdown content",
  metadata: {...},
  children: [...]
}

// Architecture Mapping
GET /api/architecture/modules
GET /api/architecture/dependencies
Response: {
  modules: [...],
  connections: [...],
  specAssociations: {...}
}

// Real-time Updates
WS /api/specs/subscribe
Events: spec-updated, spec-created, status-changed
```

#### Database Schema Extensions
```sql
-- Module mapping table
CREATE TABLE modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT,
  specs JSON -- Array of spec IDs
);

-- Activity log table
CREATE TABLE activity_log (
  id INTEGER PRIMARY KEY,
  spec_id TEXT,
  action TEXT,
  timestamp DATETIME,
  metadata JSON
);
```

### Frontend Architecture

#### Component Structure
```
app/
├── dashboard/
│   ├── page.tsx                    // Main dashboard
│   ├── components/
│   │   ├── StatsPanel/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   └── MetricDisplay.tsx
│   │   ├── ProgressChart/
│   │   │   ├── EpicProgress.tsx
│   │   │   ├── FeatureProgress.tsx
│   │   │   └── AnimatedBar.tsx
│   │   ├── ActivityFeed/
│   │   │   ├── Timeline.tsx
│   │   │   ├── ActivityItem.tsx
│   │   │   └── FilterBar.tsx
│   │   └── TreeView/
│   │       ├── TreeNode.tsx
│   │       ├── TreeSearch.tsx
│   │       └── TreeControls.tsx
│   │
├── docs/
│   ├── page.tsx                    // Document viewer
│   ├── [...path]/page.tsx          // Dynamic path routing
│   ├── components/
│   │   ├── FileTree/
│   │   │   ├── FileExplorer.tsx
│   │   │   ├── FileNode.tsx
│   │   │   └── FileIcon.tsx
│   │   ├── MarkdownViewer/
│   │   │   ├── Renderer.tsx
│   │   │   ├── TableOfContents.tsx
│   │   │   ├── FrontmatterDisplay.tsx
│   │   │   └── LinkHandler.tsx
│   │   └── Toolbar/
│   │       ├── BreadcrumbNav.tsx
│   │       ├── ViewOptions.tsx
│   │       └── ExportMenu.tsx
│   │
├── architecture/
│   ├── page.tsx                    // System architecture
│   ├── components/
│   │   ├── ModuleMap/
│   │   │   ├── ModuleCard.tsx
│   │   │   ├── ModuleConnector.tsx
│   │   │   └── Legend.tsx
│   │   ├── DependencyGraph/
│   │   │   ├── GraphView.tsx
│   │   │   ├── NodeDetail.tsx
│   │   │   └── EdgeRenderer.tsx
│   │   └── SpecAssociation/
│   │       ├── ModuleSpecList.tsx
│   │       └── AssociationMatrix.tsx
│   │
├── specs/
│   ├── page.tsx                    // Spec list
│   ├── [id]/page.tsx               // Spec detail
│   ├── kanban/page.tsx             // Kanban board
│   └── components/
│       ├── SpecCard.tsx
│       ├── StatusBadge.tsx
│       ├── FilterPanel.tsx
│       └── KanbanColumn.tsx
│
└── components/                     // Shared components
    ├── Layout/
    │   ├── Header.tsx
    │   ├── Sidebar.tsx
    │   └── Footer.tsx
    ├── Common/
    │   ├── ProgressBar.tsx
    │   ├── StatusIndicator.tsx
    │   ├── SearchBar.tsx
    │   └── ThemeToggle.tsx
    └── Charts/
        ├── BurndownChart.tsx
        ├── VelocityChart.tsx
        └── ProgressDonut.tsx
```

#### State Management
```typescript
// Using Zustand for global state
interface DashboardStore {
  specs: Spec[];
  hierarchy: TreeNode[];
  stats: DashboardStats;
  filters: FilterState;
  selectedSpecs: string[];
  
  // Actions
  fetchSpecs: () => Promise<void>;
  updateSpec: (id: string, data: Partial<Spec>) => void;
  setFilter: (filter: FilterState) => void;
  toggleSpecSelection: (id: string) => void;
}

// Real-time updates with Socket.io
interface SocketEvents {
  'spec:updated': (spec: Spec) => void;
  'spec:created': (spec: Spec) => void;
  'status:changed': (data: StatusChange) => void;
  'activity:new': (activity: Activity) => void;
}
```

### UI/UX Design Specifications

#### Color Scheme
```css
/* Status Colors */
--status-draft: #6B7280;      /* Gray */
--status-planning: #3B82F6;   /* Blue */
--status-in-progress: #F59E0B; /* Amber */
--status-completed: #10B981;   /* Green */
--status-blocked: #EF4444;     /* Red */

/* Priority Colors */
--priority-critical: #DC2626;  /* Red */
--priority-high: #F97316;      /* Orange */
--priority-medium: #EAB308;    /* Yellow */
--priority-low: #22C55E;       /* Green */

/* Domain Colors */
--domain-infrastructure: #8B5CF6; /* Purple */
--domain-broker: #3B82F6;         /* Blue */
--domain-data: #06B6D4;           /* Cyan */
--domain-strategy: #10B981;       /* Green */
--domain-risk: #F59E0B;           /* Amber */
--domain-ui: #EC4899;             /* Pink */
```

#### Responsive Design
- **Desktop** (>1280px): Full dashboard with sidebar
- **Tablet** (768-1280px): Collapsible sidebar, stacked cards
- **Mobile** (<768px): Bottom navigation, single column

#### Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode option
- Focus indicators

## Implementation Phases

### Phase 1: Core Dashboard (Week 1)
- [ ] Set up enhanced backend endpoints
- [ ] Implement stats panel
- [ ] Create progress visualizations
- [ ] Build basic tree navigation
- [ ] Deploy initial dashboard

### Phase 2: Document Viewer (Week 2)
- [ ] Implement file system API
- [ ] Build file tree explorer
- [ ] Create markdown renderer
- [ ] Add link navigation
- [ ] Implement breadcrumb navigation

### Phase 3: Architecture Visualization (Week 3)
- [ ] Design module mapping schema
- [ ] Create architecture API endpoints
- [ ] Build module visualization components
- [ ] Implement dependency graphs
- [ ] Add spec-to-module associations

### Phase 4: Interactive Features (Week 4)
- [ ] Implement Kanban board
- [ ] Add drag-and-drop functionality
- [ ] Create advanced search
- [ ] Build filter system
- [ ] Add bulk operations

### Phase 5: Real-time & Analytics (Week 5)
- [ ] Set up WebSocket connections
- [ ] Implement real-time updates
- [ ] Create analytics charts
- [ ] Add export functionality
- [ ] Performance optimization

## Data Migration Strategy

### Initial Data Import
1. **Scan spec directory** for all markdown files
2. **Parse YAML frontmatter** from each file
3. **Extract content** and generate summaries
4. **Build hierarchy** relationships
5. **Populate database** with parsed data

### Continuous Sync
1. **File watcher** on spec directory
2. **Git hooks** for commit tracking
3. **Scheduled sync** job (every 5 minutes)
4. **Manual refresh** button in UI
5. **Conflict resolution** for concurrent edits

## Monitoring & Metrics

### Key Performance Indicators
- Dashboard load time < 2 seconds
- Real-time update latency < 100ms
- Search response time < 500ms
- 99.9% uptime target

### User Analytics
- Most viewed specs
- Common search queries
- Filter usage patterns
- Time spent per section
- User journey tracking

## Security Considerations

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (viewer, editor, admin)
- API rate limiting
- CORS configuration

### Data Protection
- Input sanitization for markdown
- XSS prevention in rendered content
- SQL injection protection
- Secure WebSocket connections

## Testing Strategy

### Unit Tests
- Component testing with Jest
- API endpoint testing
- Service layer testing
- Utility function testing

### Integration Tests
- Database operations
- File system interactions
- WebSocket communication
- End-to-end user flows

### Performance Tests
- Load testing with large datasets
- Concurrent user simulation
- Memory leak detection
- Render performance profiling

## Deployment Configuration

### Environment Setup
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    volumes:
      - ../project-jts/jts/specs:/specs:ro
    environment:
      - DATABASE_URL=sqlite:./db/specs.db
      - SPECS_PATH=/specs
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
```

### CI/CD Pipeline
1. **Build** - Compile TypeScript, bundle assets
2. **Test** - Run unit and integration tests
3. **Lint** - Code quality checks
4. **Deploy** - Docker image creation
5. **Monitor** - Health checks and alerts

## Future Enhancements

### Version 2.0 Features
- AI-powered spec generation
- Automated dependency detection
- Sprint planning integration
- Time tracking integration
- Slack/Discord notifications
- Mobile native apps
- Offline mode support
- Multi-language support

### Integration Possibilities
- GitHub Issues sync
- Jira integration
- Confluence export
- VS Code extension
- CLI tool enhancement
- API documentation generator

## Conclusion

This comprehensive dashboard will transform the static markdown-based spec tracking into a dynamic, real-time project management system. The phased implementation approach ensures quick wins while building toward a feature-rich platform that will significantly improve the JTS development workflow and project visibility.

## Next Steps

1. Review and approve this implementation plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews
5. Gather user feedback for iterations

---

*Document created: 2025-08-29*
*Last updated: 2025-08-29*
*Author: Claude Assistant*
*Project: JTS Spec Dashboard*