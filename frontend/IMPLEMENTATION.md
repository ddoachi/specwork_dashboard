# Frontend Implementation Guide

## Architecture Overview

This frontend implements a comprehensive dashboard for the Specwork project using Next.js 15 App Router with the following key technologies:

- **Next.js 15**: App Router with React Server Components
- **React 19**: Latest React features and hooks
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality UI components built on Radix UI
- **React Query**: Powerful data fetching and state management
- **Axios**: HTTP client for API communication
- **Lucide React**: Beautiful, customizable SVG icons

## Component Architecture

### 1. Component Hierarchy

```
app/
├── components/
│   ├── ui/                     # shadcn/ui base components
│   │   ├── card.tsx
│   │   ├── button.tsx
│   │   ├── progress.tsx
│   │   └── collapsible.tsx
│   └── dashboard/              # Dashboard-specific components
│       ├── stats-card.tsx      # Metric display cards
│       ├── epic-progress-bar.tsx # Epic progress visualization
│       ├── recent-activity.tsx # Activity feed
│       └── spec-tree-view.tsx  # Hierarchical spec tree
├── dashboard/
│   └── page.tsx               # Main dashboard page
├── lib/
│   ├── api.ts                 # API client functions
│   ├── types.ts               # TypeScript definitions
│   ├── utils.ts               # Utility functions
│   ├── providers.tsx          # React Query provider
│   ├── hooks.ts               # Custom React hooks
│   └── mock-data.ts           # Development mock data
├── layout.tsx                 # Root layout with providers
└── page.tsx                   # Root redirect to dashboard
```

### 2. Data Flow Architecture

```
API Client (axios) → React Query → Custom Hooks → Components
                       ↑
                   Cache Layer
                   (5min cache)
```

## Key Features Implemented

### 1. Dashboard Layout

**Responsive Grid Layout**: 
- Stats cards (4-column grid on desktop, stacked on mobile)
- Epic progress section (8-column span)
- Recent activity sidebar (4-column span)
- Full-width spec tree view

**File**: `/app/dashboard/page.tsx`

### 2. Stats Cards Component

**Features**:
- Color-coded metrics (purple, blue, green, amber, red)
- Icon integration
- Trend indicators (optional)
- Responsive design

**File**: `/app/components/dashboard/stats-card.tsx`

```tsx
<StatsCard
  title="Epics"
  value={12}
  color="purple"
  icon={<BarChart3 className="h-4 w-4" />}
/>
```

### 3. Epic Progress Bars

**Features**:
- Visual progress indicators
- Task completion counters
- Status badges
- Expandable progress list

**File**: `/app/components/dashboard/epic-progress-bar.tsx`

### 4. Hierarchical Spec Tree

**Features**:
- Collapsible/expandable tree structure
- Type-specific icons (Epic, Feature, Task)
- Status indicators with colors
- Progress percentages
- Expand/collapse all functionality

**File**: `/app/components/dashboard/spec-tree-view.tsx`

### 5. Recent Activity Feed

**Features**:
- Action-specific icons and colors
- Time-ago formatting
- Spec title and ID display
- Loading and empty states

**File**: `/app/components/dashboard/recent-activity.tsx`

## API Integration

### 1. Endpoint Configuration

Base URL: `http://localhost:3001` (configurable via `NEXT_PUBLIC_API_URL`)

**Dashboard Endpoints**:
- `GET /dashboard/stats` - Dashboard statistics
- `GET /dashboard/epic-progress` - Epic progress data
- `GET /dashboard/recent-activity` - Recent activities
- `GET /specs/tree` - Hierarchical spec tree
- `POST /specs/sync` - Trigger filesystem sync

### 2. React Query Setup

**Configuration**:
- 5-minute stale time
- 10-minute garbage collection time
- Auto-refresh every 5 minutes for dashboard data
- Auto-refresh every 2 minutes for activity feed
- Retry logic with 404 handling

**File**: `/app/lib/providers.tsx`

### 3. Custom Hooks

```tsx
// Easy-to-use hooks for components
const { data: stats, isLoading, error } = useDashboardStats();
const { data: epics = [] } = useEpicProgress();
const { data: activities = [] } = useRecentActivity();
const { data: specTree = [] } = useSpecTree();
```

**File**: `/app/lib/hooks.ts`

## Type Definitions

### 1. Core Types

```typescript
type SpecType = 'epic' | 'feature' | 'task';
type SpecStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'on_hold';

interface BaseSpec {
  id: string;
  title: string;
  type: SpecType;
  status: SpecStatus;
  progress?: number;
}
```

### 2. Dashboard Types

```typescript
interface DashboardStats {
  summary: {
    epics: number;
    features: number;
    tasks: number;
    completed: number;
    inProgress: number;
    blocked: number;
  };
  progressByEpic: Record<string, EpicProgressInfo>;
}
```

**File**: `/app/lib/types.ts`

## Styling Architecture

### 1. Tailwind Configuration

**Key Features**:
- Custom color palette for status indicators
- Responsive design utilities
- Animation classes
- Dark mode support (ready)

### 2. Component Styling Patterns

**Status Colors**:
```typescript
const statusColors = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  blocked: 'bg-red-100 text-red-800 border-red-200',
  // ...
};
```

**Utility Function**:
```typescript
cn(...inputs: ClassValue[]) // Combines clsx and tailwind-merge
```

## Development Features

### 1. Mock Data Support

For development without backend:
```bash
NEXT_PUBLIC_USE_MOCK_DATA=true yarn dev
```

**File**: `/app/lib/mock-data.ts`

### 2. Error Handling

- Comprehensive error boundaries
- Retry mechanisms
- Fallback UI states
- Loading skeletons

### 3. Performance Optimizations

- React Query caching
- Lazy loading for tree nodes
- Memoized components where needed
- Optimized bundle size

## Getting Started

### 1. Installation

```bash
cd frontend
yarn install
```

### 2. Development

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start
```

### 3. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_USE_MOCK_DATA=false
```

## Component Usage Examples

### Stats Cards Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatsCard title="Epics" value={12} color="purple" />
  <StatsCard title="Features" value={45} color="blue" />
  <StatsCard title="Tasks" value={120} color="green" />
  <StatsCard title="Progress" value="75%" color="amber" />
</div>
```

### Epic Progress List

```tsx
<EpicProgressList 
  epics={[
    {
      epicId: 'E01',
      title: 'Foundation & Infrastructure',
      progress: 50,
      tasks: { completed: 12, total: 24 },
      status: 'in_progress'
    }
  ]} 
  loading={false} 
/>
```

### Spec Tree View

```tsx
<SpecTreeView 
  specs={hierarchicalData} 
  loading={isLoading} 
/>
```

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live updates
2. **Advanced Filtering**: Filter specs by status, type, date
3. **Bulk Operations**: Multi-select and batch operations
4. **Export Functionality**: PDF/CSV export of progress reports
5. **User Preferences**: Customizable dashboard layout
6. **Notifications**: Toast notifications for important updates
7. **Advanced Search**: Full-text search across specs
8. **Drag & Drop**: Reorder specs and change priorities

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Metrics

- First Load JS: ~130kB (optimized)
- Dashboard Page: ~163kB total
- Time to Interactive: <2s (target)
- Lighthouse Score: 90+ (target)

This implementation provides a solid foundation for the Specwork dashboard with modern React patterns, excellent TypeScript support, and a scalable architecture that can grow with the project needs.