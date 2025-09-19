# Complete Project Overview - Flashcard & MCQ Study System

## Project Introduction
This is a **full-stack study platform** that supports both **Flashcards** and **Multiple Choice Questions (MCQ)** with advanced analytics, filtering, and session management. The system has been extensively refactored to use enterprise-grade component architecture.

## Technology Stack

### Backend (Node.js/Express/MongoDB)
- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB with Mongoose ODM
- **Port**: 3001
- **Security**: Helmet, CORS enabled
- **Validation**: Custom middleware + express-validator

### Frontend (React.js)
- **Framework**: React 18 with functional components
- **Routing**: React Router DOM
- **State Management**: React hooks (useState, useEffect, useCallback, useMemo)
- **Styling**: CSS modules with CSS custom properties
- **Performance**: React.memo optimizations throughout
- **Port**: 3000

## System Architecture Overview

### Database Schema

#### Flashcards Collection
```javascript
{
  cardId: Number (unique),
  frontText: String,
  backText: String,
  subject: String, // e.g., "Computer Science"
  chapter: String, // e.g., "Data Structures"
  section: String, // e.g., "Arrays"
  tags: [String],
  notionBlockIds: [String]
}
```

#### MCQ Collection
```javascript
{
  questionId: Number (unique),
  question: String,
  options: {
    A: { text: String, notionBlockIds: [String] },
    B: { text: String, notionBlockIds: [String] },
    // ... C, D, E
  },
  correctAnswer: String, // 'A', 'B', 'C', 'D', 'E'
  explanation: String,
  subject: String, // e.g., "Psychiatry"
  chapter: String, // e.g., "Defense Mechanisms"
  section: String, // e.g., "Psychological Defense Mechanisms"
}
```

#### Series Collections (Both Flashcard & MCQ)
```javascript
{
  title: String,
  status: 'active' | 'completed',
  sessions: [{
    sessionId: Number,
    status: 'active' | 'completed',
    generatedFrom: Number,

    // Flashcard Series
    cards: [{
      cardId: Number,
      interaction: {
        result: 'Right' | 'Wrong',
        difficulty: 'Easy' | 'Medium' | 'Hard',
        confidenceWhileSolving: 'High' | 'Low',
        timeSpent: Number (seconds)
      }
    }],

    // MCQ Series
    questions: [{
      questionId: Number,
      interaction: {
        selectedAnswer: 'A' | 'B' | 'C' | 'D' | 'E',
        isCorrect: Boolean,
        difficulty: 'Easy' | 'Medium' | 'Hard',
        confidenceWhileSolving: 'High' | 'Low',
        timeSpent: Number (seconds)
      }
    }],

    startedAt: Date,
    completedAt: Date
  }],
  startedAt: Date,
  completedAt: Date
}
```

## Application Flow & Page Structure

### 1. Analytics Dashboard (Main Hub) - `/`
**File**: `frontend/src/pages/AnalyticsDashboard.js`
**Purpose**: Central hub with study analytics and navigation
**Key Features**:
- **Real-time analytics** from database (not mock data)
- **Subject-wise performance** (Computer Science, Psychiatry)
- **Format comparison** (Flashcards vs MCQ accuracy)
- **Active sessions table** with continue functionality
- **Navigation**: "📚 Start Studying" → Browse Series

### 2. Browse Series (Flashcard) - `/browse-series`
**File**: `frontend/src/pages/BrowseSeries.js` (RECENTLY REFACTORED)
**Purpose**: Browse and manage flashcard study series
**Architecture**: **CLEAN COMPONENT ARCHITECTURE** (8 components + 3 hooks)
**Key Features**:
- **Advanced filtering** with dropdown checklists (subjects, chapters, sections)
- **Content-based filtering** - filters by flashcard content inside sessions
- **Session management** - create, edit, continue, view stats
- **Navigation**: ← Dashboard | Flashcards/MCQ toggle | + Create

### 3. Browse MCQ Series - `/browse-mcq-series`
**File**: `frontend/src/pages/BrowseMCQSeries.js` (NEEDS REFACTORING)
**Purpose**: Browse and manage MCQ study series
**Architecture**: **MONOLITHIC** (500+ lines - same as flashcards were before refactoring)
**Key Features**: Same as flashcard page but for MCQ data

### 4. Study Session (Flashcard) - `/study`
**File**: `frontend/src/pages/StudySession.js`
**Purpose**: Interactive flashcard study session
**Key Features**:
- **Card-by-card progression** with flip animation
- **Performance tracking** (accuracy, time, difficulty, confidence)
- **Session persistence** for resuming
- **Dual navigation**: ← Series + 🏠 Dashboard

### 5. MCQ Study Session - `/mcq-study`
**File**: `frontend/src/pages/MCQSession.js`
**Purpose**: Interactive MCQ study session
**Key Features**: Similar to flashcard study but with multiple choice interface

### 6. Create Pages
- **Create Series**: `/create-series` - Create new flashcard series
- **Create MCQ Series**: `/create-mcq-series` - Create new MCQ series

## Current Component Architecture (Flashcards Only)

### Clean Architecture (Post-Refactoring)
```
frontend/src/components/series/
├── SessionCard.js (75 lines) - Individual session display
├── SeriesItem.js (53 lines) - Series header + sessions
├── SeriesList.js (35 lines) - Collection manager
├── FilterSection.js (105 lines) - Dropdown filtering
├── NavigationHeader.js (40 lines) - Top navigation
└── index.js - Barrel exports

frontend/src/hooks/
├── useSeriesData.js - Data fetching + filter options
├── useClientFiltering.js - Zero-latency filtering
├── useSessionActions.js - Session CRUD + modals
└── index.js - Barrel exports
```

## Key Technical Patterns

### Data Fetching Pattern
```javascript
// Both pages fetch series + individual items for filtering
const [seriesResponse, itemsResponse] = await Promise.all([
  seriesAPI.getAll({ limit: 100 }),
  flashcardAPI.getAll({ limit: 100 }) // or mcqAPI.getAll()
]);
```

### Client-Side Filtering Pattern
```javascript
// Create lookup map
const itemLookup = {};
allItems.forEach(item => itemLookup[item.id] = item);

// Extract IDs from sessions
const allItemIds = [];
series.sessions?.forEach(session => {
  session.items?.forEach(item => {
    allItemIds.push(item.id);
  });
});

// Filter by content
const seriesItems = uniqueIds.map(id => itemLookup[id]).filter(Boolean);
const matchesFilter = seriesItems.some(item =>
  filters.subjects.includes(item.subject)
);
```

### Performance Optimization Pattern
```javascript
// Stable function references
const noOp = useCallback(() => {}, []);

// Memoized expensive calculations
const processedSeries = useMemo(() =>
  series.map(s => ({
    ...s,
    completedCount: s.sessions.filter(sess => sess.status === 'completed').length
  })), [series]
);

// Memoized components
const Component = React.memo(({ props }) => { ... });
```

## API Endpoints Reference

### Flashcard APIs
- `GET /api/series` - Get all flashcard series
- `GET /api/flashcards` - Get all flashcards
- `POST /api/series/:id/sessions` - Start new session
- `POST /api/series/:id/sessions/:sessionId/interactions` - Record interaction

### MCQ APIs
- `GET /api/mcq-series` - Get all MCQ series
- `GET /api/mcqs` - Get all MCQs
- `POST /api/mcq-series/:id/sessions` - Start new MCQ session
- `POST /api/mcq-series/:id/sessions/:sessionId/interactions` - Record MCQ interaction

## Current State & What Needs Refactoring

### ✅ Successfully Refactored (Clean Architecture)
- **Analytics Dashboard** - Real data integration, subject analytics
- **Browse Series (Flashcard)** - 8 components + 3 hooks architecture
- **Navigation System** - Dual navigation, mode toggles, proper flow
- **Study Sessions** - Dual navigation buttons (Series + Dashboard)

### ❌ Still Needs Refactoring (Monolithic)
- **Browse MCQ Series** - 500+ line monolith (same issues flashcards had)

## Data Differences: Flashcard vs MCQ

### Session Structure
```javascript
// Flashcard Session
{
  cards: [{
    cardId: Number,
    interaction: {
      result: 'Right' | 'Wrong', // String values
      difficulty: 'Easy' | 'Medium' | 'Hard',
      confidenceWhileSolving: 'High' | 'Low',
      timeSpent: Number
    }
  }]
}

// MCQ Session
{
  questions: [{
    questionId: Number,
    interaction: {
      selectedAnswer: 'A' | 'B' | 'C' | 'D' | 'E',
      isCorrect: Boolean, // Boolean values (key difference)
      difficulty: 'Easy' | 'Medium' | 'Hard',
      confidenceWhileSolving: 'High' | 'Low',
      timeSpent: Number
    }
  }]
}
```

### API Response Format Differences
```javascript
// Flashcard API Response (nested data)
{
  success: true,
  data: {
    data: [series...] // Double nesting
  }
}

// MCQ API Response (direct data)
{
  success: true,
  data: [series...] // Single level
}
```

## File Organization (Current State)

### Organized Files (Clean Architecture)
```
frontend/src/
├── components/
│   ├── series/ (flashcard components - CLEAN)
│   └── [other components]
├── hooks/ (flashcard hooks - CLEAN)
├── pages/
│   ├── AnalyticsDashboard.js (CLEAN)
│   ├── BrowseSeries.js (CLEAN - refactored)
│   ├── BrowseSeriesBackupDontDelete.js (backup)
│   └── BrowseMCQSeries.js (MONOLITHIC - needs refactoring)
└── services/
    ├── api.js (flashcard APIs)
    └── mcqApi.js (MCQ APIs)
```

## User Journey Flow

### Current Navigation Flow
```
Analytics Dashboard (/)
├── "📚 Start Studying" → Browse Series (/browse-series)
│   ├── "← Dashboard" → Analytics Dashboard
│   ├── "MCQ" toggle → Browse MCQ Series
│   ├── "+ Create" → Create Series
│   └── Session Cards → Study Session (/study)
│       ├── "← Series" → Browse Series
│       └── "🏠 Dashboard" → Analytics Dashboard
│
└── Browse MCQ Series (/browse-mcq-series)
    ├── "← Dashboard" → Analytics Dashboard
    ├── "Flashcards" toggle → Browse Series
    ├── "+ Create" → Create MCQ Series
    └── Session Cards → MCQ Study (/mcq-study)
        ├── "← MCQ Series" → Browse MCQ Series
        └── "🏠 Dashboard" → Analytics Dashboard
```

## Critical Understanding for MCQ Refactoring

### What Makes MCQ Different
1. **Data Structure**: `questions` array instead of `cards` array
2. **Interaction Format**: `isCorrect: Boolean` instead of `result: String`
3. **API Response**: Direct data array instead of nested structure
4. **Modal Component**: `MCQSessionRecipeModal` instead of `SessionRecipeModal`
5. **Navigation Target**: `/mcq-study` instead of `/study`

### What Stays The Same
1. **Filtering UI**: Dropdown checklists work identically
2. **Navigation Header**: Same layout, just different mode
3. **Series Management**: Same create/edit/delete operations
4. **Session Flow**: Same progression and stats tracking
5. **Performance Patterns**: Same React.memo, useCallback, useMemo needs

## Current Real Data Examples

### Subjects in System
- **Flashcards**: "Computer Science"
- **MCQ**: "Psychiatry"

### Chapters Examples
- **Flashcards**: "Data Structures", "Algorithms", "Algorithm Analysis"
- **MCQ**: "Defense Mechanisms", etc.

### Sections Examples
- **Flashcards**: "Arrays", "Trees", "Dynamic Programming", "Stacks"
- **MCQ**: "Psychological Defense Mechanisms", etc.

## Development Environment Setup

### Running the Application
```bash
# Backend (Terminal 1)
cd backend
npm start
# Runs on http://localhost:3001

# Frontend (Terminal 2)
cd frontend
npm start
# Runs on http://localhost:3000
```

### Key URLs
- **Main Hub**: http://localhost:3000/ (Analytics Dashboard)
- **Flashcards**: http://localhost:3000/browse-series (CLEAN ARCHITECTURE)
- **MCQ**: http://localhost:3000/browse-mcq-series (NEEDS REFACTORING)

## Current File Status & Safety Rules

### ✅ SAFE TO REFERENCE (Don't Modify)
- `frontend/src/components/series/` - Successfully refactored flashcard components
- `frontend/src/hooks/` - Clean custom hooks for flashcard logic
- `frontend/src/pages/BrowseSeries.js` - Clean refactored flashcard page
- `frontend/src/pages/AnalyticsDashboard.js` - Working analytics system

### ⚠️ MONOLITHIC (Needs Refactoring)
- `frontend/src/pages/BrowseMCQSeries.js` - 500+ line monolith to be refactored

### 🚨 NEVER TOUCH (Backups)
- `frontend/src/pages/BrowseSeriesBackupDontDelete.js` - Original flashcard implementation
- `frontend/src/pages/BrowseSeries_backupDontdelete.js` - Another backup

## Key Business Logic

### Session Management Rules
1. **One Active Session per Series** - Only one session can be active at a time
2. **Session Progression** - Sessions must be completed before starting new ones
3. **Card/Question Tracking** - Each interaction is recorded with metadata
4. **Performance Analytics** - Accuracy, time, difficulty, confidence tracked

### Filtering System Logic
1. **Content-Based Filtering** - Series filtered by content inside their sessions
2. **Multi-Select Support** - Multiple subjects/chapters/sections can be selected
3. **Client-Side Performance** - Fetch once, filter instantly with useMemo
4. **Smart Labels** - "All Subjects", "Computer Science", "3 Chapters Selected"

### Navigation Philosophy
1. **Never Trap Users** - Always provide multiple exit paths
2. **Dual Navigation** - Series-specific + Dashboard buttons in study sessions
3. **Mode Toggles** - Seamless switching between Flashcard/MCQ modes
4. **Breadcrumb Flow** - Clear path back to any level

## Critical Technical Details

### API Response Handling
```javascript
// Flashcard APIs return nested data
const flashcardData = response?.data?.data || [];

// MCQ APIs return direct data
const mcqData = response?.data || [];
```

### Stats Calculation Patterns
```javascript
// Flashcard: String-based result checking
const correct = cards.filter(card => card.interaction?.result === 'Right').length;

// MCQ: Boolean-based result checking
const correct = questions.filter(q => q.interaction?.isCorrect === true).length;
```

### Performance Optimization Requirements
```javascript
// Essential for preventing unnecessary re-renders
const noOp = useCallback(() => {}, []);
const Component = React.memo(({ props }) => { ... });
const expensiveCalc = useMemo(() => { ... }, [dependencies]);
```

## Testing Requirements

### Must-Have Testing Process
1. **Side-by-side comparison** - Original vs new should be identical
2. **Network request verification** - Same API calls and responses
3. **Console log comparison** - Same data processing results
4. **User interaction testing** - All buttons and features work identically
5. **Performance testing** - No degradation in speed or responsiveness

### Test Routes Strategy
- **Original**: Keep existing routes working
- **New**: Add `/new-*` routes for testing
- **Replacement**: Only after 100% verification

## Current Project State Summary

### What's Working Perfectly
- ✅ **Analytics Dashboard** - Real data, subject analytics, active sessions
- ✅ **Flashcard Browse** - Clean 8-component architecture with advanced filtering
- ✅ **Study Sessions** - Both flashcard and MCQ study interfaces
- ✅ **Navigation System** - Complete overhaul with dual navigation
- ✅ **Backend APIs** - Content-aware filtering, real data integration

### What Needs Work
- ❌ **MCQ Browse Page** - Monolithic 500+ line component (same issue flashcards had)

### Success Metrics Achieved
- **542 lines → 8 components** for flashcard page
- **Zero-latency filtering** with multi-select dropdowns
- **Real data integration** replacing mock analytics
- **Professional navigation flow** throughout app
- **Enterprise-grade code quality** with performance optimizations

## Message for New AI

**You are inheriting a sophisticated study platform that has undergone significant architectural improvements.**

**Your task**: Apply the **same successful refactoring methodology** used for flashcards to the MCQ browse page.

**Critical Rules**:
1. **NEVER modify existing working pages** until new architecture is 100% tested
2. **Use the proven flashcard component architecture** as your template
3. **Follow the detailed safety guidelines** in `MCQ_REFACTOR_PLAN.md`
4. **Test thoroughly** using the proven 4-phase testing approach
5. **Preserve 100% functionality** - every feature must work identically

**Resources Available**:
- **Working flashcard components** - Perfect templates for adaptation
- **Detailed refactoring plan** - Step-by-step methodology
- **Real data examples** - Live database with Computer Science and Psychiatry content
- **Testing methodology** - Proven approach that worked successfully

**Success Criteria**: MCQ browse page should have the same clean 8-component architecture as the flashcard page, with identical functionality and better performance.

The project is in excellent shape with a clear path forward! 🎯