# BrowseSeries Component Refactoring Plan

## Overview
Refactor the monolithic 500+ line BrowseSeries.js into clean, maintainable components following single responsibility principle.

## Current State Analysis
**BrowseSeries.js Current Issues:**
- 500+ lines doing everything
- Data fetching + filtering + UI + modals + session management
- Hard to maintain, test, and debug
- Tight coupling between concerns

## New Component Architecture

### 1. NavigationHeader Component
**File:** `frontend/src/components/series/NavigationHeader.js`
**Responsibilities:**
- Dashboard back button
- Flashcards/MCQ mode toggle
- Create button
**Props:**
```javascript
{
  currentMode: 'flashcards' | 'mcq',
  onNavigateDashboard: () => void,
  onToggleMode: () => void,
  onCreateClick: () => void
}
```

### 2. FilterSection Component
**File:** `frontend/src/components/series/FilterSection.js`
**Responsibilities:**
- 3 dropdown checklists (subjects, chapters, sections)
- Clear All button
- Series count display
**Props:**
```javascript
{
  filters: {subjects: [], chapters: [], sections: []},
  filterOptions: {subjects: [], chapters: [], sections: []},
  onFilterChange: (filterType, value) => void,
  onClearFilters: () => void,
  seriesCount: number,
  totalSeries: number
}
```

### 3. SeriesList Component
**File:** `frontend/src/components/series/SeriesList.js`
**Responsibilities:**
- Map through series array
- Handle series dividers
- Loading/empty states
**Props:**
```javascript
{
  series: Array,
  loading: boolean,
  onSessionClick: (seriesId, sessionId, status, session, series) => void,
  onNewSession: (seriesId, seriesData) => void,
  onEditSession: (seriesId, session, seriesData, event) => void
}
```

### 4. SeriesItem Component
**File:** `frontend/src/components/series/SeriesItem.js`
**Responsibilities:**
- Series header (title + progress)
- Sessions row container
- New session button logic
**Props:**
```javascript
{
  seriesData: Object,
  onSessionClick: Function,
  onNewSession: Function,
  onEditSession: Function,
  showDivider: boolean
}
```

### 5. SessionCard Component
**File:** `frontend/src/components/series/SessionCard.js`
**Responsibilities:**
- Individual session display
- Session stats calculation
- Edit button for active sessions
**Props:**
```javascript
{
  session: Object,
  seriesId: string,
  seriesData: Object,
  onClick: Function,
  onEdit: Function
}
```

### 6. Custom Hooks

#### useSeriesData Hook
**File:** `frontend/src/hooks/useSeriesData.js`
**Responsibilities:**
- Fetch series + flashcards data
- Extract filter options
- Handle loading/error states
**Returns:**
```javascript
{
  series: Array,
  allFlashcards: Array,
  filterOptions: Object,
  loading: boolean,
  error: string,
  refetch: Function
}
```

#### useClientFiltering Hook
**File:** `frontend/src/hooks/useClientFiltering.js`
**Responsibilities:**
- Filter state management
- Client-side filtering logic
- Dropdown state management
**Returns:**
```javascript
{
  filters: Object,
  dropdownOpen: Object,
  filteredSeries: Array,
  handleFilterToggle: Function,
  toggleDropdown: Function,
  clearFilters: Function,
  getDropdownText: Function
}
```

#### useSessionActions Hook
**File:** `frontend/src/hooks/useSessionActions.js`
**Responsibilities:**
- Session CRUD operations
- Modal state management
- Navigation logic
**Returns:**
```javascript
{
  modalState: Object,
  handleSessionClick: Function,
  handleNewSession: Function,
  handleEditSession: Function,
  handleCreateCustomSession: Function,
  closeModal: Function
}
```

## Implementation Strategy

### Phase 1: Create Infrastructure
1. Create `frontend/src/components/series/` directory
2. Create `frontend/src/hooks/` directory
3. Create detailed component specifications

### Phase 2: Build Components (Bottom-Up)
1. **SessionCard** (smallest, most isolated)
2. **SeriesItem** (uses SessionCard)
3. **SeriesList** (uses SeriesItem)
4. **FilterSection** (complex dropdown logic)
5. **NavigationHeader** (simple but important)

### Phase 3: Build Hooks
1. **useSeriesData** (data fetching)
2. **useClientFiltering** (filtering logic)
3. **useSessionActions** (business logic)

### Phase 4: Main Container
1. **NewBrowseSeries** (orchestrates everything)
2. Add new route for testing
3. Compare with original side-by-side

### Phase 5: Replace Original
1. Only after thorough testing
2. Update route to use new component
3. Keep original as backup

## Component Communication Flow

```
NewBrowseSeries (Main Container)
├── useSeriesData() → {series, allFlashcards, filterOptions}
├── useClientFiltering() → {filters, filteredSeries, filterActions}
├── useSessionActions() → {modalState, sessionActions}
│
├── <NavigationHeader onNavigate onToggle onCreate />
├── <FilterSection filters filterOptions onFilterChange />
├── <SeriesList series onSessionClick onNewSession onEditSession />
│   └── <SeriesItem seriesData sessionActions />
│       └── <SessionCard session onClick onEdit />
└── <Modals modalState sessionActions />
```

## Benefits of New Architecture

### Maintainability
- **Single Responsibility** - Each component has one job
- **Easy Debugging** - Issues isolated to specific components
- **Simple Testing** - Test components independently

### Performance
- **Smaller Re-renders** - Only affected components update
- **Memoization** - React.memo on SessionCard, SeriesItem
- **Hook Optimization** - Custom hooks with proper dependencies

### Developer Experience
- **50-80 line components** - Easy to understand and modify
- **Clear Props Interface** - TypeScript-ready
- **Logical File Organization** - Find code quickly

### Reusability
- **SessionCard** → Can be used in analytics dashboard
- **FilterSection** → Can be used in MCQ browse page
- **NavigationHeader** → Can be used across app

## File Structure
```
frontend/src/
├── components/
│   └── series/
│       ├── NavigationHeader.js
│       ├── FilterSection.js
│       ├── SeriesList.js
│       ├── SeriesItem.js
│       └── SessionCard.js
├── hooks/
│   ├── useSeriesData.js
│   ├── useClientFiltering.js
│   └── useSessionActions.js
├── pages/
│   ├── BrowseSeries.js (original - keep as backup)
│   └── NewBrowseSeries.js (new implementation)
└── REFACTOR.md (this file)
```

## Implementation Notes
- **Keep original intact** - No modifications to current working code
- **Use same CSS classes** - Leverage existing styles
- **Identical functionality** - Feature parity with original
- **Progressive enhancement** - Can add improvements after refactor
- **Parallel development** - Test new version alongside original