# Decision Tree Quiz Implementation - Phase-by-Phase Todo Lists

## Pre-Implementation Assessment & Setup

### Assessment Checklist
- [ ] Review existing MCQ/Flashcard/Table implementations for patterns
- [ ] Verify MongoDB connection setup for both databases
- [ ] Check current ID generation strategy (appears manual, not auto-increment)
- [ ] Review existing caching mechanisms
- [ ] Analyze current component structure and naming conventions
- [ ] Document any dependencies that need to be installed

### Initial Setup Tasks
- [ ] Create feature branch: `feature/decision-tree-quiz`
- [ ] Install required dependencies:
  ```bash
  # Backend - none needed, using existing packages
  # Frontend - none needed initially
  ```
- [ ] Create initial folder structure in both backend and frontend

---

## Phase 1: Backend Foundation (Week 1)

### Day 1-2: Database Schema & Models

#### MongoDB Schema Setup
- [ ] Create `/backend/src/models/DecisionTreeQuiz.js`
  - [ ] Define schema matching existing pattern (numeric quizId like questionId/cardId/tableId)
  - [ ] Add structure field as Mixed type for flexibility
  - [ ] Include standard fields: subject, chapter, section, tags, source
  - [ ] Add indexes matching MCQ pattern:
    ```javascript
    index: true on quizId
    compound index on subject+chapter
    text index on title
    ```
  - [ ] Add static methods following Flashcard pattern:
    ```javascript
    static findByQuizId(quizId)
    static findByQuizIds(quizIds)
    static getAllDecisionTreeQuizzes()
    ```

- [ ] Create `/backend/src/models/DecisionTreeSeries.js`
  - [ ] Follow MCQSeriesNew.js pattern exactly
  - [ ] Include sessions array with same structure
  - [ ] Add instance methods:
    ```javascript
    getActiveSession()
    getNextSessionId()
    ```
  - [ ] Include virtual for completedCount

#### Validation Setup
- [ ] Create `/backend/src/validators/decisionTreeValidators.js`
  - [ ] Quiz structure validation
  - [ ] Node connectivity validation
  - [ ] Edge condition validation
  - [ ] Ensure no orphaned nodes
  - [ ] Verify at least one start node

### Day 3-4: Controllers

#### Main Quiz Controller
- [ ] Create `/backend/src/controllers/decisionTreeQuizController.js`
  - [ ] Implement CRUD operations matching MCQController pattern:
    ```javascript
    static async getAll(req, res)  // with pagination
    static async getById(req, res)  // by quizId
    static async getFilterOptions(req, res)  // for dropdowns
    static async getStats(req, res)  // analytics
    ```
  - [ ] Add validation middleware using express-validator
  - [ ] Include .lean() for read operations (performance)
  - [ ] Add proper error handling with logger

#### Series Controller
- [ ] Create `/backend/src/controllers/decisionTreeSeriesController.js`
  - [ ] Copy structure from MCQSeriesNewController
  - [ ] Implement methods:
    ```javascript
    static async getAll(req, res)
    static async create(req, res)
    static async startSession(req, res)
    static async recordProgress(req, res)  // replaces recordInteraction
    static async completeSession(req, res)
    static async deleteSession(req, res)
    ```
  - [ ] Add validation arrays at bottom of file

### Day 5: Routes & Integration

#### Route Setup
- [ ] Create `/backend/src/routes/decisionTreeQuizzes.js`
  ```javascript
  router.get('/', DTQuizController.getAll);
  router.get('/stats', DTQuizController.getStats);
  router.get('/filter-options', DTQuizController.getFilterOptions);
  router.post('/batch', DTQuizController.getByIds);
  router.get('/:quizId', DTQuizController.getById);
  ```

- [ ] Create `/backend/src/routes/decisionTreeSeries.js`
  ```javascript
  router.get('/', DTSeriesController.getAll);
  router.post('/', DTSeriesController.create, DTSeriesController.createValidation);
  router.post('/:seriesId/sessions', DTSeriesController.startSession);
  router.post('/:seriesId/sessions/:sessionId/progress', DTSeriesController.recordProgress);
  router.post('/:seriesId/sessions/:sessionId/complete', DTSeriesController.completeSession);
  router.delete('/:seriesId/sessions/:sessionId', DTSeriesController.deleteSession);
  ```

#### Server Integration
- [ ] Update `/backend/src/server.js`
  - [ ] Import new route files
  - [ ] Add routes:
    ```javascript
    app.use('/api/decision-tree-quizzes', decisionTreeQuizRoutes);
    app.use('/api/dt-series', decisionTreeSeriesRoutes);
    ```

#### Testing
- [ ] Test all endpoints with Postman/curl
- [ ] Verify database connections
- [ ] Check indexes are created
- [ ] Test validation rules

---

## Phase 2: Core Services & Logic (Week 2)

### Day 1-2: Pathfinding & Condition Services

#### Pathfinding Service
- [ ] Create `/backend/src/services/pathfindingService.js`
  - [ ] Implement graph traversal algorithm
  - [ ] Get available nodes based on completed nodes
  - [ ] Calculate optimal paths
  - [ ] Detect cycles/infinite loops
  - [ ] Methods to implement:
    ```javascript
    getInitialNodes(structure)
    getAvailableNodes(completedNodes, structure)
    evaluateCondition(condition, nodeState)
    getOptimalPath(structure, startNode, endNode)
    detectCycles(structure)
    ```

#### Scoring Service
- [ ] Create `/backend/src/services/scoringService.js`
  - [ ] Implement scoring algorithms:
    - [ ] Simple scoring (correct/incorrect)
    - [ ] Weighted scoring (using option weights)
    - [ ] Path-based scoring (bonus for optimal path)
  - [ ] Methods:
    ```javascript
    calculateNodeScore(node, selections)
    calculatePathBonus(pathTaken, optimalPath)
    calculateFinalScore(session)
    ```

### Day 3-4: Progress Management

#### Progress Service
- [ ] Create `/backend/src/services/progressService.js`
  - [ ] Session state management
  - [ ] Progress calculation
  - [ ] Path tracking
  - [ ] Methods:
    ```javascript
    initializeSession(quizId)
    updateNodeProgress(sessionId, nodeId, state)
    calculateCompletion(session)
    getNextAvailableNodes(session, quiz)
    ```

### Day 5: Controller Enhancement

#### Enhance Quiz Controller
- [ ] Add validation endpoint:
  ```javascript
  static async validateNodeAnswer(req, res) {
    const { quizId, nodeId } = req.params;
    const { selections } = req.body;
    // Use scoring service
    // Use pathfinding service
    // Return next nodes
  }
  ```

- [ ] Add path analysis endpoint:
  ```javascript
  static async analyzeCommonPaths(req, res) {
    // Aggregate common paths from completed sessions
  }
  ```

---

## Phase 3: Frontend Core Components (Week 3)

### Day 1: API Service Layer

#### API Service
- [ ] Create `/frontend/src/services/decisionTreeApi.js`
  ```javascript
  class DecisionTreeAPI {
    static async getQuizzes(filters = {})
    static async getQuiz(quizId)
    static async getSeries()
    static async createSeries(title, quizIds)
    static async startSession(seriesId, quizId)
    static async saveProgress(sessionId, nodeProgress)
    static async validateAnswer(quizId, nodeId, selections)
    static async completeSession(sessionId)
  }
  ```
  - [ ] Add caching layer
  - [ ] Add error handling
  - [ ] Add retry logic

### Day 2-3: Core Hooks

#### Main Hook
- [ ] Create `/frontend/src/hooks/useDecisionTree.js`
  - [ ] State management for quiz session
  - [ ] Node interaction handling
  - [ ] Progress tracking
  - [ ] Path management

#### Connector Hook
- [ ] Create `/frontend/src/hooks/useNodeConnectors.js`
  - [ ] Port SVG calculation logic from lithium quiz
  - [ ] Use ResizeObserver for responsive updates
  - [ ] Calculate bezier curves for connections
  - [ ] Handle junction nodes specially

#### Animation Hook
- [ ] Create `/frontend/src/hooks/useDTAnimations.js`
  - [ ] Node appear animations
  - [ ] Path drawing animations
  - [ ] Success/failure animations
  - [ ] Transition effects

### Day 4-5: Core Components

#### Main Canvas
- [ ] Create `/frontend/src/components/decisionTree/DTQuizCanvas.js`
  - [ ] Port layout logic from lithium quiz
  - [ ] Implement row-based positioning
  - [ ] Add ref management for nodes
  - [ ] Integrate connector overlay
  - [ ] Handle different node sizes

#### Node Card
- [ ] Create `/frontend/src/components/decisionTree/DTNodeCard.js`
  - [ ] Follow MCQSessionCard pattern for structure
  - [ ] Implement multi-select options
  - [ ] Add visual states (enabled/disabled/completed)
  - [ ] Include feedback display
  - [ ] Handle different node types (question/junction/endpoint)

#### Connector Overlay
- [ ] Create `/frontend/src/components/decisionTree/DTConnectorOverlay.js`
  - [ ] SVG path rendering
  - [ ] Arrow markers
  - [ ] Path highlighting for completed routes
  - [ ] Animated path drawing

---

## Phase 4: Frontend Integration (Week 4)

### Day 1-2: Browse Pages

#### Series Browse Page
- [ ] Create `/frontend/src/pages/BrowseDTSeries.js`
  - [ ] Copy structure from BrowseMCQSeries.js
  - [ ] Add "Decision Tree" tab to navigation
  - [ ] Implement filtering (subjects, chapters, sections)
  - [ ] Add search functionality
  - [ ] Include prefetching logic

#### Series List Component
- [ ] Create `/frontend/src/components/decisionTree/DTSeriesList.js`
  - [ ] Follow MCQSeriesList pattern
  - [ ] Implement virtualization for performance
  - [ ] Add loading states
  - [ ] Include empty states

#### Series Item Component
- [ ] Create `/frontend/src/components/decisionTree/DTSeriesItem.js`
  - [ ] Match MCQSeriesItem structure exactly
  - [ ] Show session progress
  - [ ] Include completion badges
  - [ ] Add new session button

### Day 3: Create Series Page

#### Create Page
- [ ] Create `/frontend/src/pages/CreateDTSeries.js`
  - [ ] Copy CreateMCQSeries structure
  - [ ] Grid layout for quiz selection
  - [ ] Multi-select filters
  - [ ] Series title input
  - [ ] Start button

#### Quiz Selection Grid
- [ ] Implement quiz card component
- [ ] Add selection checkboxes
- [ ] Show quiz metadata
- [ ] Include preview option

### Day 4-5: Session Page

#### Main Session Page
- [ ] Create `/frontend/src/pages/DTQuizSession.js`
  - [ ] Session initialization
  - [ ] Progress persistence
  - [ ] Auto-save functionality
  - [ ] Exit confirmation
  - [ ] Completion handling

#### Progress Bar Component
- [ ] Create `/frontend/src/components/decisionTree/DTProgressBar.js`
  - [ ] Visual progress indicator
  - [ ] Score display
  - [ ] Time tracking
  - [ ] Node completion count

#### Results Summary
- [ ] Create `/frontend/src/components/decisionTree/DTResultsSummary.js`
  - [ ] Path visualization
  - [ ] Score breakdown
  - [ ] Time analysis
  - [ ] Retry option

---

## Phase 5: Advanced Features & Polish (Week 5)

### Day 1-2: Visual Quiz Builder (Admin Feature)

#### Builder Interface
- [ ] Create `/frontend/src/pages/DTQuizBuilder.js`
  - [ ] Drag-and-drop node positioning
  - [ ] Visual edge connection tool
  - [ ] Node property editor panel
  - [ ] Auto-layout algorithm
  - [ ] Import/export JSON

#### Node Editor Component
- [ ] Create `/frontend/src/components/decisionTree/builder/DTNodeEditor.js`
  - [ ] Inline question editing
  - [ ] Option management
  - [ ] Condition configuration
  - [ ] Size/theme selection

### Day 3: Performance Optimization

#### Caching Implementation
- [ ] Update `/frontend/src/utils/cache.js`
  - [ ] Add DT quiz caching
  - [ ] Session progress caching
  - [ ] LocalStorage sync
  - [ ] Cache invalidation strategy

#### Prefetching
- [ ] Update `/frontend/src/utils/prefetch.js`
  - [ ] Prefetch next likely nodes
  - [ ] Preload quiz on series page hover
  - [ ] Image preloading for questions

### Day 4: Analytics & Monitoring

#### Analytics Dashboard
- [ ] Create analytics view component
- [ ] Path frequency visualization
- [ ] Average scores per path
- [ ] Common failure points
- [ ] Time analysis per node

#### Backend Analytics
- [ ] Add aggregation pipelines
- [ ] Track path patterns
- [ ] Calculate optimal paths
- [ ] Generate insights

### Day 5: Testing & Documentation

#### Unit Tests
- [ ] Backend model tests
- [ ] Controller tests
- [ ] Service tests (pathfinding, scoring)
- [ ] Frontend component tests
- [ ] Hook tests

#### Integration Tests
- [ ] Full quiz flow test
- [ ] Session management test
- [ ] Progress persistence test
- [ ] API endpoint tests

#### Documentation
- [ ] API documentation
- [ ] Component documentation
- [ ] Quiz creation guide
- [ ] Deployment notes

---

## Critical Path Items (Must Complete)

### Backend Essentials
1. [ ] DecisionTreeQuiz model with proper schema
2. [ ] Basic CRUD operations
3. [ ] Session management
4. [ ] Pathfinding logic
5. [ ] Answer validation

### Frontend Essentials
1. [ ] DTQuizCanvas component
2. [ ] Node interaction handling
3. [ ] SVG connector rendering
4. [ ] Session page
5. [ ] Browse page integration

### Integration Essentials
1. [ ] Navigation tab addition
2. [ ] API connections
3. [ ] Progress persistence
4. [ ] Basic styling matching existing app

---

## Risk Mitigation

### Technical Risks
- **SVG Performance**: Monitor with large graphs (>50 nodes)
  - Mitigation: Virtual scrolling, viewport culling

- **Complex State Management**: Multiple interconnected nodes
  - Mitigation: Use Zustand or Redux if needed

- **Mobile Responsiveness**: Complex layouts on small screens
  - Mitigation: Pan/zoom controls, simplified mobile view

### Schedule Risks
- **Scope Creep**: Builder interface could expand
  - Mitigation: MVP first, builder as enhancement

- **Testing Time**: Complex interactions need thorough testing
  - Mitigation: Start testing early, automate where possible

---

## Success Metrics

### Technical Metrics
- [ ] Page load time < 2 seconds
- [ ] Node transition < 100ms
- [ ] 100% test coverage for critical paths
- [ ] Zero console errors in production

### User Experience Metrics
- [ ] Intuitive navigation (no user manual needed)
- [ ] Clear visual feedback for all interactions
- [ ] Progress never lost (auto-save working)
- [ ] Mobile-friendly interface

### Integration Metrics
- [ ] Seamless addition to existing navigation
- [ ] Consistent styling with rest of app
- [ ] Unified filtering system
- [ ] Shared component patterns

---

## Post-Launch Todos

### Week 6+ Enhancements
- [ ] Collaborative quiz creation
- [ ] Quiz versioning system
- [ ] A/B testing for paths
- [ ] AI-suggested improvements
- [ ] Export to PDF/print view
- [ ] Offline mode support
- [ ] Quiz sharing features
- [ ] Leaderboards for paths
- [ ] Achievement system
- [ ] Mobile app integration

---

## Notes & Dependencies

### Dependencies to Install
```json
// No new dependencies needed initially
// All required packages already in project:
// - React 18
// - MongoDB/Mongoose
// - Express
// - Axios
// All SVG/animation will use native browser APIs
```

### Configuration Updates
```javascript
// Add to .env
DT_FEATURE_ENABLED=true
DT_MAX_NODES_PER_QUIZ=100
DT_SESSION_TIMEOUT_MINUTES=60
DT_CACHE_TTL_HOURS=24
```

### Database Indexes to Create
```javascript
// Run in MongoDB after model creation
db.decisionTreeQuizzes.createIndex({ quizId: 1 });
db.decisionTreeQuizzes.createIndex({ subject: 1, chapter: 1 });
db.decisionTreeQuizzes.createIndex({ title: "text" });
db.decisionTreeSeries.createIndex({ status: 1 });
db.decisionTreeSeries.createIndex({ "sessions.sessionId": 1 });
```

---

## Daily Standup Questions

For each day of implementation, answer:
1. What was completed yesterday?
2. What will be worked on today?
3. Are there any blockers?
4. Is the timeline still accurate?

---

## Definition of Done

A feature is considered complete when:
- [ ] Code is written and working
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Code reviewed (if team environment)
- [ ] Documentation updated
- [ ] No console errors/warnings
- [ ] Performance metrics met
- [ ] Responsive design verified
- [ ] Cross-browser testing complete