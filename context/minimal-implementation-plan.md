# Minimal Dashboard Implementation Plan

## Priority: Dashboard with Essential Features Only

### Database: SQLite
- Simple file-based database
- No additional infrastructure
- Easy to backup and migrate

### Authentication: Basic Auth with .htpasswd
- No JWT complexity
- Simple Apache/Nginx integration
- Single user or small team access

## Parallel Implementation Strategy

### Backend Priority Tasks (Day 1-2)

#### 1. Switch to SQLite
```typescript
// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db/specs.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Dev only
    }),
  ],
})
```

#### 2. Essential Dashboard Endpoints

**GET /api/dashboard/stats**
```typescript
{
  summary: {
    epics: 12,        // E01-E12
    features: 45,     // Total F-level specs
    tasks: 120,       // Total T-level specs
    completed: 15,
    inProgress: 8,
    blocked: 2
  },
  progressByEpic: {
    "E01": { total: 24, completed: 12, percentage: 50 },
    "E02": { total: 18, completed: 3, percentage: 16.7 },
    // ...
  }
}
```

**GET /api/specs/tree**
```typescript
[
  {
    id: "E01",
    title: "Foundation & Infrastructure",
    type: "epic",
    status: "in_progress",
    progress: 50,
    children: [
      {
        id: "F01",
        title: "Storage Infrastructure",
        type: "feature",
        status: "in_progress",
        progress: 66,
        children: [
          { id: "T01", title: "Hot Storage", type: "task", status: "completed" },
          { id: "T02", title: "Database Mounts", type: "task", status: "completed" },
          // ...
        ]
      }
    ]
  }
]
```

**GET /api/specs/sync**
```typescript
// Scan filesystem and update database
async syncSpecs() {
  const specsDir = '/home/joohan/dev/project-jts/jts/specs';
  // 1. Scan all spec.md and context.md files
  // 2. Parse YAML frontmatter
  // 3. Update SQLite database
  // 4. Return sync status
}
```

### Frontend Priority Tasks (Day 1-2)

#### 1. Dashboard Page Structure
```tsx
// frontend/app/dashboard/page.tsx
export default function Dashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 p-6">
      {/* Stats Cards */}
      <div className="col-span-12 grid grid-cols-4 gap-4">
        <StatsCard title="Epics" value={12} color="purple" />
        <StatsCard title="Features" value={45} color="blue" />
        <StatsCard title="Tasks" value={120} color="green" />
        <StatsCard title="Progress" value="18.5%" color="amber" />
      </div>
      
      {/* Epic Progress Bars */}
      <div className="col-span-8">
        <EpicProgressList />
      </div>
      
      {/* Recent Activity */}
      <div className="col-span-4">
        <RecentActivity />
      </div>
      
      {/* Tree View */}
      <div className="col-span-12">
        <SpecTreeView />
      </div>
    </div>
  );
}
```

#### 2. Key Components

**StatsCard.tsx**
```tsx
interface StatsCardProps {
  title: string;
  value: number | string;
  color: 'purple' | 'blue' | 'green' | 'amber';
  trend?: number;
}

export function StatsCard({ title, value, color }: StatsCardProps) {
  const colorClasses = {
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${colorClasses[color]}`}>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
```

**EpicProgressBar.tsx**
```tsx
interface EpicProgressProps {
  epicId: string;
  title: string;
  progress: number;
  tasks: { completed: number; total: number };
}

export function EpicProgressBar({ epicId, title, progress, tasks }: EpicProgressProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{epicId}: {title}</span>
        <span className="text-sm text-gray-500">{tasks.completed}/{tasks.total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
```

**SpecTreeView.tsx**
```tsx
export function SpecTreeView() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['E01']));
  
  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Specification Hierarchy</h3>
      {specs.map(epic => (
        <TreeNode 
          key={epic.id}
          node={epic}
          level={0}
          expanded={expanded}
          onToggle={toggleExpand}
        />
      ))}
    </div>
  );
}
```

## Implementation Steps

### Day 1: Morning
**Backend**
1. Switch to SQLite configuration
2. Create dashboard service with stats calculation
3. Implement `/api/dashboard/stats` endpoint

**Frontend**
1. Create dashboard page layout
2. Build StatsCard components
3. Mock data for initial display

### Day 1: Afternoon
**Backend**
1. Implement filesystem scanner for specs
2. Create `/api/specs/sync` endpoint
3. Build spec tree structure generator

**Frontend**
1. Create EpicProgressBar component
2. Implement data fetching with React Query
3. Connect to backend APIs

### Day 2: Morning
**Backend**
1. Add spec parsing with frontmatter
2. Implement `/api/specs/tree` endpoint
3. Add basic caching

**Frontend**
1. Build SpecTreeView component
2. Add expand/collapse functionality
3. Implement status indicators

### Day 2: Afternoon
**Backend**
1. Add .htpasswd authentication middleware
2. Error handling and logging
3. Performance optimization

**Frontend**
1. Add loading states and error handling
2. Implement auto-refresh (polling)
3. Polish UI and responsiveness

## Minimal Tech Stack

### Backend
```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "sqlite3": "^5.1.6",
    "typeorm": "^0.3.17",
    "gray-matter": "^4.0.3",
    "glob": "^10.3.10",
    "htpasswd-auth": "^2.0.0"
  }
}
```

### Frontend
```json
{
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "tailwindcss": "^3.3.0"
  }
}
```

## File Structure Changes

### Backend
```
backend/
├── db/
│   └── specs.sqlite          # SQLite database file
├── src/
│   ├── dashboard/
│   │   ├── dashboard.controller.ts
│   │   ├── dashboard.service.ts
│   │   └── dashboard.module.ts
│   ├── specs/
│   │   ├── spec-sync.service.ts  # New: Filesystem sync
│   │   └── spec-tree.service.ts  # New: Tree structure
│   └── auth/
│       └── htpasswd.guard.ts     # Simple auth guard
```

### Frontend
```
frontend/
├── app/
│   ├── dashboard/            # New priority page
│   │   └── page.tsx
│   ├── components/
│   │   ├── StatsCard.tsx
│   │   ├── EpicProgressBar.tsx
│   │   ├── SpecTreeView.tsx
│   │   └── TreeNode.tsx
│   └── lib/
│       └── api.ts           # API client
```

## Quick Start Commands

### Backend Setup
```bash
cd backend
yarn add sqlite3 gray-matter glob htpasswd-auth
yarn remove pg  # Remove PostgreSQL

# Create .htpasswd file
htpasswd -c .htpasswd admin

# Update database config to SQLite
# Run migrations
yarn typeorm migration:run
```

### Frontend Setup
```bash
cd frontend
yarn add @tanstack/react-query axios

# Start development
yarn dev
```

### Docker Compose (Simplified)
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    volumes:
      - ./backend/db:/app/db
      - ../project-jts/jts/specs:/specs:ro
      - ./backend/.htpasswd:/app/.htpasswd:ro
    environment:
      - SPECS_PATH=/specs
      - DATABASE_PATH=/app/db/specs.sqlite

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
```

## MVP Success Criteria

1. ✅ Dashboard shows real-time stats from actual spec files
2. ✅ Progress bars for each Epic (E01-E12)
3. ✅ Hierarchical tree view with expand/collapse
4. ✅ Auto-sync with filesystem every 5 minutes
5. ✅ Basic auth with .htpasswd
6. ✅ Mobile responsive
7. ✅ Load time < 2 seconds

## What NOT to Build (For Now)

- ❌ User management system
- ❌ Markdown editor
- ❌ Drag-and-drop Kanban
- ❌ WebSocket real-time updates
- ❌ Export functionality
- ❌ Complex filtering
- ❌ Git integration
- ❌ Activity tracking

This minimal approach gets you a working dashboard in 2 days that you can iterate on.