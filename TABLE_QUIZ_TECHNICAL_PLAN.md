# Table Quiz System - Comprehensive Technical Plan

## 🎯 **System Overview**

Building a **drag-and-drop table reconstruction quiz system** that integrates seamlessly with the existing Flashcard and MCQ architecture, following the proven enterprise-grade patterns established throughout the application.

## 🔗 **Perfect Codebase Integration Strategy**

### **Integration Requirements Analysis**
Based on deep codebase analysis, the table quiz system must follow **exact existing patterns** for seamless integration.

---

## 📊 **Data Structure & Processing**

### **Table Quiz Data Model**
```javascript
{
  tableId: Number,
  name: String,              // "Psychology Defense Mechanisms"
  rows: Number,              // 4
  columns: Number,           // 3
  subject: String,           // "Psychology"
  chapter: String,           // "Defense Mechanisms"
  section: String,           // "Types and Examples"
  tags: [String],           // ["psychology", "defense", "mechanisms", "quiz"]
  cells: [{
    row: Number,             // 0, 1, 2, 3
    column: Number,          // 0, 1, 2
    text: String,            // "Denial" or "" for empty
    isHeader: Boolean,       // true for headers, false for content
    notionBlockIds: [String] // External references
  }]
}
```

### **Cell Processing Logic**
```javascript
const processTableForQuiz = (tableData) => {
  // 1. Separate headers from content cells
  const headerCells = tableData.cells.filter(cell => cell.isHeader);
  const contentCells = tableData.cells.filter(cell => !cell.isHeader);

  // 2. Content cells include EMPTY cells (text: "")
  // Empty cells must be placed as empty by user

  // 3. Create grid structure
  const gridWithHeaders = createEmptyGrid(tableData.rows, tableData.columns);

  // 4. Place headers in fixed positions
  headerCells.forEach(header => {
    gridWithHeaders[header.row][header.column] = {
      ...header,
      isFixed: true, // Cannot be moved
      cellType: 'header'
    };
  });

  // 5. Randomize content cells for sidebar
  const shuffledContentCells = shuffle(contentCells);

  return {
    tableStructure: gridWithHeaders,
    draggableCells: shuffledContentCells,
    correctAnswers: contentCells // For validation
  };
};
```

---

## 🏗️ **Component Architecture (8 Focused Components)**

### **Following Proven Enterprise Patterns from MCQ/Flashcard Systems**

#### **1. TableQuizDisplay** (Main Interface)
**File**: `frontend/src/components/tableQuiz/TableQuizDisplay.js`
**Responsibilities**: Grid rendering, drop zone management, visual feedback
**Size**: ~80 lines
**Props**:
```javascript
{
  tableStructure: Array,     // Grid with headers fixed
  onCellDrop: Function,      // Handle cell placement
  onCellRemove: Function,    // Handle cell removal
  draggedCell: Object,       // Currently dragged cell
  showResults: Boolean,      // Post-submission state
  results: Object           // Validation results
}
```

#### **2. CellPalette** (Sidebar with Draggable Cells)
**File**: `frontend/src/components/tableQuiz/CellPalette.js`
**Responsibilities**: Sidebar display, drag initiation, cell management
**Size**: ~60 lines
**Props**:
```javascript
{
  availableCells: Array,     // Cells in sidebar
  onDragStart: Function,     // Drag initiation
  onDragEnd: Function,       // Drag completion
  cellsPlaced: Number,       // Progress tracking
  totalCells: Number         // Total content cells
}
```

#### **3. DraggableContentCell** (Individual Draggable Cell)
**File**: `frontend/src/components/tableQuiz/DraggableContentCell.js`
**Responsibilities**: Drag behavior, visual states, touch handling
**Size**: ~50 lines
**Props**:
```javascript
{
  cell: Object,              // Cell data
  onDragStart: Function,     // Drag start handler
  onDragEnd: Function,       // Drag end handler
  isBeingDragged: Boolean,   // Visual state
  isPlaced: Boolean         // Whether cell is in table
}
```

#### **4. TableDropZone** (Drop Target Cells)
**File**: `frontend/src/components/tableQuiz/TableDropZone.js`
**Responsibilities**: Drop acceptance, validation, visual feedback
**Size**: ~40 lines
**Props**:
```javascript
{
  row: Number,               // Grid position
  column: Number,            // Grid position
  currentCell: Object,       // Currently placed cell (if any)
  onDrop: Function,          // Drop handler
  onRemove: Function,        // Cell removal
  isDropTarget: Boolean,     // Drag over state
  showResult: Boolean,       // Post-submission
  isCorrect: Boolean        // Validation result
}
```

#### **5. TableQuizControls** (Submit & Selectors)
**File**: `frontend/src/components/tableQuiz/TableQuizControls.js`
**Responsibilities**: Submit button, confidence/difficulty selection
**Size**: ~70 lines
**Props**:
```javascript
{
  onSubmit: Function,        // Submit table
  submitted: Boolean,        // Post-submission state
  confidence: String,        // User confidence
  difficulty: String,        // User difficulty
  onConfidenceChange: Function,
  onDifficultyChange: Function,
  onNext: Function          // Next table in session
}
```

#### **6. TableQuizHeader** (Timer & Progress)
**File**: `frontend/src/components/tableQuiz/TableQuizHeader.js`
**Responsibilities**: Timer, progress, table info
**Size**: ~30 lines
**Props**:
```javascript
{
  elapsedTime: Number,       // Timer
  tableName: String,         // Table name
  tableIndex: Number,        // Current table in session
  totalTables: Number,       // Total tables in session
  cellsPlaced: Number,       // Progress tracking
  totalContentCells: Number
}
```

#### **7. TableResultsDisplay** (Post-Submit Results)
**File**: `frontend/src/components/tableQuiz/TableResultsDisplay.js`
**Responsibilities**: Results overlay, correct/incorrect indicators
**Size**: ~60 lines
**Props**:
```javascript
{
  tableStructure: Array,     // Complete table
  results: Object,           // Validation results
  correctAnswers: Array,     // Correct cell positions
  wrongPlacements: Array    // Incorrect placements with corrections
}
```

#### **8. TableSessionSummary** (Session Complete)
**File**: `frontend/src/components/tableQuiz/TableSessionSummary.js`
**Responsibilities**: Session-wide results, multiple table performance
**Size**: ~90 lines
**Props**:
```javascript
{
  sessionResults: Array,     // All table results in session
  summaryStats: Object,      // Session statistics
  onNavigateToSeries: Function,
  onNavigateToDashboard: Function
}
```

---

## 🎣 **Session Management (Following MCQ Pattern)**

### **Table Session Structure**
```javascript
{
  sessionId: Number,
  status: 'active' | 'completed',
  tables: [{
    tableId: Number,
    userGrid: Array,         // Current cell placements [row][col]
    submitted: Boolean,
    results: {
      correctPlacements: Number,
      totalCells: Number,
      accuracy: Number,
      wrongPlacements: [{
        cellText: String,           // "Denial"
        placedAtRow: Number,        // Where user placed it
        placedAtColumn: Number,     // Where user placed it
        correctRow: Number,         // Where it should be
        correctColumn: Number,      // Where it should be
        correctCellText: String     // What should be in that position
      }]
    },
    confidence: String,      // 'High' | 'Low'
    difficulty: String,      // 'Easy' | 'Medium' | 'Hard'
    timeSpent: Number        // Seconds
  }],
  startedAt: Date,
  completedAt: Date
}
```

### **Validation Logic**
```javascript
const validateTablePlacement = (userGrid, correctGrid) => {
  const results = {
    correctPlacements: 0,
    totalCells: 0,
    wrongPlacements: []
  };

  // Check each position in the grid
  userGrid.forEach((row, rowIndex) => {
    row.forEach((userCell, colIndex) => {
      const correctCell = getCorrectCellAtPosition(correctGrid, rowIndex, colIndex);
      results.totalCells++;

      // Compare by TEXT content (not ID)
      if (userCell?.text === correctCell?.text) {
        results.correctPlacements++;
      } else {
        results.wrongPlacements.push({
          cellText: userCell?.text || 'EMPTY',
          placedAtRow: rowIndex,
          placedAtColumn: colIndex,
          correctRow: correctCell?.row || rowIndex,
          correctColumn: correctCell?.column || colIndex,
          correctCellText: correctCell?.text || 'EMPTY'
        });
      }
    });
  });

  results.accuracy = Math.round((results.correctPlacements / results.totalCells) * 100);
  return results;
};
```

---

## 🎮 **User Interface Flow**

### **Table Quiz Interface Layout**
```
┌─────────────────────────────────────────────────────────────────┐
│ Timer: 3:24 | Table: Psychology Defense Mechanisms | 4/6 placed │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌─────────────────────────────────────────────┐ │
│ │ CELL PALETTE │ │            TABLE GRID                       │ │
│ │              │ │ ┌──────────────┬──────────────┬────────────┐ │ │
│ │ [Denial]     │ │ │Defense Mech. │  Definition  │  Example   │ │ │ ← Headers (fixed)
│ │ [Refusing..] │ │ ├──────────────┼──────────────┼────────────┤ │ │
│ │ [I am not..] │ │ │   [Denial]   │     ???      │    ???     │ │ │ ← Drop zones
│ │ [EMPTY]      │ │ ├──────────────┼──────────────┼────────────┤ │ │
│ │ [EMPTY]      │ │ │     ???      │     ???      │    ???     │ │ │
│ │ [EMPTY]      │ │ ├──────────────┼──────────────┼────────────┤ │ │
│ │              │ │ │     ???      │     ???      │    ???     │ │ │
│ └──────────────┘ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    [Submit Table] Button                        │
└─────────────────────────────────────────────────────────────────┘
```

### **Post-Submit Results View**
```
┌─────────────────────────────────────────────────────────────────┐
│         RESULTS: 4/6 correct (67%) | Time: 4:12                 │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                TABLE RESULTS                                │ │
│ │ ┌──────────────┬──────────────┬────────────┐               │ │
│ │ │Defense Mech. │  Definition  │  Example   │ ← Headers     │ │
│ │ ├──────────────┼──────────────┼────────────┤               │ │
│ │ │ [Denial] ✓   │[Wrong Text]✗ │[Correct]✓  │ ← Results     │ │
│ │ │              │Should be:    │             │               │ │
│ │ │              │"Refusing..." │             │               │ │
│ │ └──────────────┴──────────────┴────────────┘               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ Confidence: [High/Low] | Difficulty: [Easy/Medium/Hard]         │
│                    [Next Table →]                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **Backend API Architecture**

### **Following Exact MCQ/Flashcard Pattern**

#### **Database Models**

**TableQuiz Model** (like MCQ.js):
```javascript
const tableQuizSchema = new mongoose.Schema({
  tableId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  rows: {
    type: Number,
    required: true
  },
  columns: {
    type: Number,
    required: true
  },
  subject: String,
  chapter: String,
  section: String,
  tags: [String],
  cells: [{
    row: Number,
    column: Number,
    text: String,            // Can be empty string
    isHeader: Boolean,
    notionBlockIds: [String]
  }]
});
```

**TableSeries Model** (like MCQSeries.js):
```javascript
const tableSessionSchema = new mongoose.Schema({
  sessionId: Number,
  status: { type: String, enum: ['active', 'completed'] },
  tables: [{
    tableId: Number,
    userGrid: [[String]],    // User's cell placements by text
    submitted: Boolean,
    results: {
      correctPlacements: Number,
      totalCells: Number,
      accuracy: Number,
      wrongPlacements: [{
        cellText: String,
        placedAtRow: Number,
        placedAtColumn: Number,
        correctRow: Number,
        correctColumn: Number,
        correctCellText: String
      }]
    },
    confidence: String,
    difficulty: String,
    timeSpent: Number
  }]
});
```

#### **API Endpoints** (Following MCQ Pattern):
```javascript
// Table Quiz Content
GET    /api/table-quizzes          // Get all table quizzes with filtering
GET    /api/table-quizzes/:tableId // Get single table quiz
POST   /api/table-quizzes/batch    // Get multiple table quizzes
GET    /api/table-quizzes/filter-options // Get filter options

// Table Series Management
GET    /api/table-series           // Get all table series
POST   /api/table-series           // Create new table series
GET    /api/table-series/:id       // Get specific table series
PUT    /api/table-series/:id/complete // Mark series as completed

// Table Session Management
POST   /api/table-series/:id/sessions                    // Start new session
POST   /api/table-series/:id/sessions/:sessionId/tables  // Submit table
PUT    /api/table-series/:id/sessions/:sessionId/complete // Complete session
DELETE /api/table-series/:id/sessions/:sessionId         // Delete session
```

---

## 🎨 **Component Implementation Details**

### **TableQuizDisplay Component**
```javascript
const TableQuizDisplay = React.memo(({
  tableStructure,
  onCellDrop,
  onCellRemove,
  draggedCell,
  showResults,
  results
}) => {
  return (
    <div className="table-grid">
      {tableStructure.map((row, rowIndex) => (
        <div key={rowIndex} className="table-row">
          {row.map((cell, colIndex) => (
            cell?.isHeader ? (
              // Fixed header cell
              <div key={`${rowIndex}-${colIndex}`} className="table-cell header-cell">
                {cell.text}
              </div>
            ) : (
              // Drop zone for content
              <TableDropZone
                key={`${rowIndex}-${colIndex}`}
                row={rowIndex}
                column={colIndex}
                currentCell={cell}
                onDrop={onCellDrop}
                onRemove={onCellRemove}
                isDropTarget={draggedCell !== null}
                showResult={showResults}
                isCorrect={results?.correctGrid?.[rowIndex]?.[colIndex]}
              />
            )
          ))}
        </div>
      ))}
    </div>
  );
});
```

### **CellPalette Component**
```javascript
const CellPalette = React.memo(({
  availableCells,
  onDragStart,
  onDragEnd,
  cellsPlaced,
  totalCells
}) => {
  return (
    <div className="cell-palette">
      <div className="palette-header">
        <h3>Available Cells</h3>
        <div className="progress-indicator">
          {totalCells - availableCells.length}/{totalCells} placed
        </div>
      </div>
      <div className="cells-container">
        {availableCells.map((cell, index) => (
          <DraggableContentCell
            key={`${cell.row}-${cell.column}-${index}`}
            cell={cell}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isInPalette={true}
          />
        ))}
      </div>
    </div>
  );
});
```

### **Drag & Drop State Management**
```javascript
const useTableQuizDragDrop = (originalTable) => {
  const [dragState, setDragState] = useState({
    draggedCell: null,
    draggedFromRow: null,
    draggedFromColumn: null,
    draggedFromPalette: false
  });

  const [tableState, setTableState] = useState({
    currentGrid: [],         // User's current placements
    availableCells: [],      // Cells in sidebar
    cellsPlaced: 0
  });

  const handleCellDrop = useCallback((targetRow, targetColumn, cell) => {
    // Move cell from palette or another position to target
    setTableState(prev => {
      const newGrid = [...prev.currentGrid];
      const newAvailable = [...prev.availableCells];

      // If dropping from palette, remove from available
      if (dragState.draggedFromPalette) {
        const cellIndex = newAvailable.findIndex(c =>
          c.text === cell.text && c.row === cell.row && c.column === cell.column
        );
        if (cellIndex !== -1) {
          newAvailable.splice(cellIndex, 1);
        }
      }

      // If dropping on occupied position, return previous cell to palette
      if (newGrid[targetRow]?.[targetColumn]) {
        newAvailable.push(newGrid[targetRow][targetColumn]);
      }

      // Place new cell
      newGrid[targetRow][targetColumn] = cell;

      return {
        ...prev,
        currentGrid: newGrid,
        availableCells: newAvailable,
        cellsPlaced: calculatePlacedCells(newGrid)
      };
    });
  }, [dragState]);

  return { dragState, tableState, handleCellDrop /* ... */ };
};
```

---

## 🔄 **Study Session Integration**

### **TableQuizSession Page** (Following MCQ Pattern)
```javascript
const TableQuizSession = () => {
  // Same state management pattern as MCQ
  const [seriesId, setSeriesId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [tables, setTables] = useState([]);
  const [currentTableIndex, setCurrentTableIndex] = useState(0);

  // Table-specific state
  const [tableQuizState, setTableQuizState] = useState({
    currentGrid: [],
    availableCells: [],
    submitted: false,
    results: null
  });

  // Same patterns as MCQ
  const [confidence, setConfidence] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Following exact MCQ session flow
  const handleTableSubmit = async () => {
    // 1. Validate table placement
    const results = validateTablePlacement(tableQuizState.currentGrid, currentTable);

    // 2. Show results and confidence/difficulty selectors
    setTableQuizState(prev => ({ ...prev, submitted: true, results }));
  };

  const handleNextTable = async () => {
    // 3. Record interaction (like MCQ)
    await tableSessionAPI.recordInteraction(seriesId, sessionId, {
      tableId: currentTable.tableId,
      userGrid: tableQuizState.currentGrid,
      confidence,
      difficulty,
      timeSpent: Math.floor((Date.now() - startTime) / 1000)
    });

    // 4. Advance to next table or complete session
    if (currentTableIndex + 1 < tables.length) {
      // Next table
      setCurrentTableIndex(prev => prev + 1);
      resetTableState();
    } else {
      // Complete session
      finishSession();
    }
  };
};
```

---

## 📊 **Browse Table Quizzes Page**

### **Following Exact Browse Pattern**
```javascript
// File: frontend/src/pages/BrowseTableSeries.js
// Architecture: Same 8-component system as MCQ/Flashcard

// Reuse existing components:
// - NavigationHeader (add 'tables' mode)
// - FilterSection (filter by subject/chapter/section)
// - SeriesList, SeriesItem, SessionCard patterns

// Table-specific components:
// - TableSessionCard (show table count, accuracy)
// - TableSeriesItem (series with table sessions)
```

### **Navigation Toggle Enhancement**
```javascript
// Update NavigationHeader component
const modes = ['flashcards', 'mcq', 'tables'];

// Update all navigation:
// Current: [Flashcards] [MCQ]
// New: [Flashcards] [MCQ] [Tables]

// Navigation paths:
// /browse-series (flashcards)
// /browse-mcq-series (mcq)
// /browse-table-series (tables) ← NEW
```

---

## 🎯 **Implementation Strategy**

### **Phase 1: Core Table Quiz System**
1. **Create table quiz components** (8 components)
2. **Implement drag & drop functionality**
3. **Build validation system**
4. **Create table quiz session page**

### **Phase 2: Session Management**
1. **Table series backend** (API endpoints)
2. **Session tracking** (MongoDB schemas)
3. **Browse table series page** (reuse component patterns)
4. **Navigation integration** (three-way toggle)

### **Phase 3: Analytics Integration**
1. **Table quiz statistics** in session stats modal
2. **Table performance tracking** in browse pages
3. **Analytics dashboard integration** (future)

---

## 🎯 **Technical Benefits**

### **Reusing Proven Architecture:**
- ✅ **Same component patterns** as MCQ/Flashcard systems
- ✅ **Same session management** as existing study modes
- ✅ **Same navigation patterns** with toggle enhancement
- ✅ **Same API structure** following established conventions

### **Educational Innovation:**
- ✅ **Spatial learning** - Table reconstruction challenges
- ✅ **Visual memory** - Layout and positioning skills
- ✅ **Comprehensive understanding** - See relationships between concepts
- ✅ **Unique study mode** - Complements MCQ and Flashcard learning

This table quiz system would provide a **powerful new learning modality** while maintaining **complete architectural consistency** with the existing enterprise-grade study platform! 🎯

Ready to implement when you give the approval!