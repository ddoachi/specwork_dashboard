# Frontend Specifications for JTS Spec Dashboard

## Overview

Detailed frontend specifications for the JTS Spec Dashboard, focusing on the markdown document viewer, folder tree navigation, and system architecture visualization features.

## Core Requirements

### 1. Markdown Document Viewer

#### Features
- **Full Markdown Rendering**
  - GitHub Flavored Markdown support
  - Syntax highlighting for code blocks
  - Tables, lists, blockquotes, and all standard markdown elements
  - Mermaid diagram support for architecture visualization
  - LaTeX math rendering (if needed)

- **YAML Frontmatter Display**
  - Parse and display metadata in a structured format
  - Collapsible metadata panel
  - Edit metadata directly (with proper permissions)
  - Highlight important fields (status, priority, dependencies)

- **Internal Document Navigation**
  - Click on spec IDs to navigate (e.g., clicking "1002" jumps to that spec)
  - Support relative links within the specs folder
  - Maintain navigation history (back/forward buttons)
  - Open links in new tab with Ctrl/Cmd+Click

- **Document Features**
  - Auto-generated table of contents for long documents
  - Anchor links for headings
  - Copy button for code blocks
  - Search within document (Ctrl+F enhancement)
  - Print-friendly CSS
  - Export to PDF functionality

### 2. Folder Tree Structure View

#### Visual Design
```
📁 specs/
├── 📁 1000 - Foundation & Infrastructure
│   ├── 📄 1000.spec.md
│   ├── 📝 1000.context.md
│   ├── 📁 1001 - Storage Infrastructure
│   │   ├── 📄 1001.spec.md
│   │   ├── 📝 1001.context.md
│   │   └── 📁 Tasks
│   │       ├── 📄 1011.md ✅
│   │       ├── 📄 1012.md ✅
│   │       └── 📄 1013.md 🚧
│   └── 📁 1002 - Development Environment
└── 📁 2000 - Multi-Broker Integration
```

#### Functionality
- **Interactive Navigation**
  - Expand/collapse folders
  - Single-click to select
  - Double-click to open document
  - Right-click context menu (Open, Copy Path, View in GitHub)

- **Visual Indicators**
  - Different icons for spec types (📄 .spec.md, 📝 .context.md, 📋 .md)
  - Status badges on files (✅ completed, 🚧 in-progress, ⏸️ blocked)
  - Progress indicators on folders (show completion %)
  - Highlight currently viewed document

- **Search & Filter**
  - Quick search box at top of tree
  - Filter by file type
  - Filter by status
  - Highlight search matches in tree

- **Performance**
  - Lazy load deep folders
  - Virtual scrolling for large trees
  - Cache folder states in localStorage

### 3. System Architecture Visualization

#### Module Mapping View

```typescript
interface SystemModule {
  id: string;
  name: string;
  description: string;
  domain: 'infrastructure' | 'broker' | 'data' | 'strategy' | 'risk' | 'ui' | 'monitoring';
  specs: string[]; // Array of spec IDs
  dependencies: string[]; // Other module IDs
  status: 'planned' | 'in-development' | 'completed';
  completionPercentage: number;
}
```

#### Visual Representations

##### A. Module Grid View
```
┌─────────────────────────────────────────────────┐
│              JTS System Architecture             │
├─────────────┬─────────────┬────────────────────┤
│ Foundation  │   Broker    │   Market Data      │
│    (25%)    │    (0%)     │      (0%)          │
│ [1000-1010] │ [2000-2110] │   [3000-3XXX]      │
├─────────────┼─────────────┼────────────────────┤
│  Strategy   │    Risk     │   Execution        │
│    (0%)     │    (0%)     │      (0%)          │
│ [4000-4XXX] │ [5000-5XXX] │   [6000-6XXX]      │
├─────────────┼─────────────┼────────────────────┤
│     UI      │ Monitoring  │   Backtesting      │
│    (0%)     │    (0%)     │      (0%)          │
│ [7000-7XXX] │ [8000-8XXX] │   [9000-9XXX]      │
└─────────────┴─────────────┴────────────────────┘
```

##### B. Dependency Graph View
- Interactive node-link diagram
- Nodes represent modules
- Edges show dependencies
- Node size based on number of specs
- Color coding by domain
- Click node to see spec list
- Hover for details

##### C. Spec-to-Module Association Matrix
```
         | Infra | Broker | Data | Strategy | Risk | UI |
---------|-------|--------|------|----------|------|----|
1000     |   ✓   |        |      |          |      |    |
1001     |   ✓   |        |      |          |      |    |
2000     |       |   ✓    |      |          |      |    |
2100     |       |   ✓    |      |          |      |    |
3000     |       |        |  ✓   |          |      |    |
```

#### Interactive Features
- **Module Cards**
  - Click to expand and show spec list
  - Progress bar showing completion
  - Quick stats (specs count, completion %)
  - Domain color coding

- **Spec Assignment**
  - Drag specs to modules
  - Bulk assign specs to modules
  - Auto-suggest module based on spec metadata

- **Filtering**
  - Show only specific domains
  - Show only active modules
  - Show specs without module assignment

### 4. Dashboard Layout

#### Header Section
```
┌──────────────────────────────────────────────────────┐
│ 🚀 JTS Spec Dashboard  | 🔍 Search | 👤 User | ⚙️    │
├──────────────────────────────────────────────────────┤
│ Home | Specs | Documents | Architecture | Analytics  │
└──────────────────────────────────────────────────────┘
```

#### Sidebar Navigation
```
┌─────────────┐
│ Navigation  │
├─────────────┤
│ 📊 Dashboard│
│ 📁 Explorer │
│ 📋 Specs    │
│ 🏗️ Modules  │
│ 📈 Analytics│
│ ⚙️ Settings │
└─────────────┘
```

#### Main Content Area
- Responsive grid layout
- Collapsible panels
- Draggable widgets (future)
- Full-screen mode for documents

### 5. Component Specifications

#### MarkdownViewer Component
```tsx
interface MarkdownViewerProps {
  content: string;
  frontmatter?: Record<string, any>;
  specId: string;
  onLinkClick?: (href: string) => void;
  showToc?: boolean;
  showMetadata?: boolean;
  editMode?: boolean;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  frontmatter,
  specId,
  onLinkClick,
  showToc = true,
  showMetadata = true,
  editMode = false
}) => {
  // Implementation
};
```

#### FileTree Component
```tsx
interface FileTreeProps {
  rootPath: string;
  selectedFile?: string;
  onFileSelect: (path: string) => void;
  onFolderToggle?: (path: string, isOpen: boolean) => void;
  showStatusBadges?: boolean;
  searchQuery?: string;
  filterStatus?: SpecStatus[];
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
  metadata?: {
    status?: SpecStatus;
    specId?: string;
    lastModified?: Date;
  };
}
```

#### ModuleMap Component
```tsx
interface ModuleMapProps {
  modules: SystemModule[];
  specs: Spec[];
  view: 'grid' | 'graph' | 'matrix';
  onModuleClick?: (moduleId: string) => void;
  onSpecAssign?: (specId: string, moduleId: string) => void;
  highlightSpec?: string;
}
```

### 6. User Interactions

#### Keyboard Shortcuts
- `Ctrl/Cmd + K` - Quick search
- `Ctrl/Cmd + P` - Quick file navigation
- `Ctrl/Cmd + \` - Toggle sidebar
- `Ctrl/Cmd + B` - Toggle file tree
- `Alt + ←/→` - Navigate back/forward
- `Ctrl/Cmd + F` - Search in document
- `Esc` - Close modals/panels

#### Mouse Interactions
- **Hover Effects**
  - Show tooltips with spec details
  - Highlight related specs
  - Preview on hover (after delay)

- **Drag & Drop**
  - Reorder specs in lists
  - Move specs between statuses
  - Assign specs to modules

- **Context Menus**
  - Right-click on specs for actions
  - Right-click on files for operations
  - Custom menus per component

### 7. Responsive Design

#### Breakpoints
```scss
$mobile: 640px;
$tablet: 768px;
$desktop: 1024px;
$wide: 1280px;
$ultrawide: 1536px;
```

#### Mobile Adaptations
- Bottom navigation bar
- Swipe gestures for navigation
- Collapsible sections
- Simplified module view
- Touch-friendly controls

#### Tablet Adaptations
- Sliding sidebar
- Two-column layout
- Rotatable architecture view
- Popover details instead of sidebars

### 8. Performance Optimizations

#### Code Splitting
```typescript
// Lazy load heavy components
const MarkdownViewer = lazy(() => import('./components/MarkdownViewer'));
const ArchitectureView = lazy(() => import('./components/ArchitectureView'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
```

#### Caching Strategy
- Cache markdown renders
- Cache file tree structure
- Cache API responses
- Use React Query for data fetching
- Implement virtual scrolling

#### Optimization Techniques
- Debounce search inputs
- Throttle scroll events
- Memoize expensive computations
- Use React.memo for pure components
- Implement skeleton loaders

### 9. Accessibility Features

#### ARIA Support
- Proper ARIA labels
- ARIA live regions for updates
- Role attributes for custom components
- Keyboard navigation support

#### Visual Accessibility
- High contrast mode
- Focus indicators
- Color blind friendly palettes
- Adjustable font sizes
- Screen reader compatibility

### 10. Testing Requirements

#### Component Tests
```typescript
describe('MarkdownViewer', () => {
  it('renders markdown content correctly');
  it('parses frontmatter metadata');
  it('handles internal links');
  it('generates table of contents');
  it('supports syntax highlighting');
});

describe('FileTree', () => {
  it('displays folder structure');
  it('expands/collapses folders');
  it('filters by search query');
  it('shows status badges');
  it('handles file selection');
});

describe('ModuleMap', () => {
  it('displays modules in grid view');
  it('shows dependency graph');
  it('allows spec assignment');
  it('calculates completion percentages');
});
```

#### E2E Tests
- Navigation flow through specs
- Document viewer interactions
- Search and filter operations
- Module assignment workflow
- Responsive design verification

## Implementation Priority

### Phase 1 - Essential Features
1. Basic markdown viewer
2. Simple file tree
3. Document navigation
4. Basic search

### Phase 2 - Enhanced Features
1. Full file tree with status
2. YAML frontmatter display
3. Module grid view
4. Advanced search

### Phase 3 - Advanced Features
1. Dependency graph
2. Drag and drop
3. Keyboard shortcuts
4. Export functionality

### Phase 4 - Polish
1. Animations
2. Themes
3. Performance optimizations
4. Accessibility enhancements

## Conclusion

These specifications provide a comprehensive guide for implementing a feature-rich frontend for the JTS Spec Dashboard. The focus on markdown document viewing, intuitive navigation, and system architecture visualization will create a powerful tool for managing and tracking the JTS development process.