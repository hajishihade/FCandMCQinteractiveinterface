# Decision Tree Quiz Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Data Architecture](#data-architecture)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Architecture](#frontend-architecture)
5. [Visual Components](#visual-components)
6. [Implementation Phases](#implementation-phases)
7. [Technical Specifications](#technical-specifications)
8. [Performance Optimization](#performance-optimization)
9. [Testing Strategy](#testing-strategy)

## Overview

### Purpose
Integrate a flow-based decision tree quiz system that allows learners to navigate through interconnected questions based on their responses, creating personalized learning paths.

### Key Features
- **Visual Flow Navigation**: Questions connected by paths showing relationships
- **Conditional Branching**: Different paths based on answer correctness
- **Multi-Select Support**: Questions can require multiple correct answers
- **Progress Tracking**: Visual indication of completed and available nodes
- **Path Analytics**: Track and analyze common learning paths

## Data Architecture

### Content Database Schema

```javascript
// Collection: decisionTreeQuizzes
{
  _id: ObjectId,
  quizId: Number,  // Auto-incremented ID matching your existing pattern
  title: String,
  subject: String,
  chapter: String,
  section: String,
  tags: [String],
  source: String,
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
  },
  meta: {
    description: String,
    author: String,
    estimatedMinutes: Number,
    prerequisites: [String],
    learningObjectives: [String]
  },

  // Core Decision Tree Structure
  structure: {
    // Visual layout definition
    rows: [
      ["start"],                              // Row 0
      ["assessment_1", "assessment_2"],       // Row 1
      ["concept_a", "concept_b", "concept_c"], // Row 2
      ["junction_1"],                         // Row 3 (junction node)
      ["advanced_1", "advanced_2"],           // Row 4
      ["conclusion"]                          // Row 5
    ],

    // Node definitions
    nodes: {
      "start": {
        type: "question",
        question: "What is your primary learning goal?",
        helpText: "Select all that apply to customize your path",
        required: 1,  // Minimum correct answers needed
        options: [
          {
            id: "opt_1",
            text: "Understanding basic concepts",
            correct: true,
            weight: 1  // For scoring
          },
          {
            id: "opt_2",
            text: "Clinical applications",
            correct: true,
            weight: 1
          },
          {
            id: "opt_3",
            text: "Advanced mechanisms",
            correct: false,
            weight: 0
          }
        ],
        display: {
          size: "normal",  // normal | wide | compact
          theme: "primary"  // primary | success | warning | danger
        }
      },

      "junction_1": {
        type: "junction",  // Special node type for branching logic
        display: {
          size: "dot"  // Shows as a connection point
        }
      },

      "conclusion": {
        type: "endpoint",
        content: "Congratulations! You've completed the pathway.",
        summary: true  // Shows results summary
      }
    },

    // Edge definitions with conditions
    edges: [
      {
        from: "start",
        to: "assessment_1",
        condition: {
          type: "any",  // any | all | custom
          value: null   // For custom conditions
        }
      },
      {
        from: "start",
        to: "assessment_2",
        condition: {
          type: "correct_includes",
          value: ["opt_2"]  // Specific option must be selected
        }
      },
      {
        from: "junction_1",
        to: "advanced_1",
        condition: {
          type: "score_threshold",
          value: 0.8  // 80% correct to unlock
        }
      }
    ]
  },

  // Scoring configuration
  scoring: {
    passingScore: 0.7,
    scoringMethod: "weighted",  // simple | weighted | pathway
    bonusForOptimalPath: 10,
    penaltyForBacktrack: -5
  },

  // Metadata
  createdAt: Date,
  updatedAt: Date,
  version: Number,
  isActive: Boolean,
  analytics: {
    timesCompleted: Number,
    averageScore: Number,
    averageTime: Number,
    commonPaths: [
      {
        path: ["start", "assessment_1", "concept_a", "conclusion"],
        count: Number,
        avgScore: Number
      }
    ]
  }
}
```

### Series Database Schema

```javascript
// Collection: decisionTreeSeries
{
  _id: ObjectId,
  title: String,
  status: {
    type: String,
    enum: ['active', 'completed', 'archived']
  },

  sessions: [{
    sessionId: Number,
    quizId: Number,  // References decision tree quiz
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned']
    },

    // Progress tracking
    progress: {
      currentNodeId: String,
      completedNodes: [String],
      availableNodes: [String],
      pathTaken: [String],  // Ordered list of visited nodes

      // Node-specific progress
      nodeStates: {
        "start": {
          visited: Boolean,
          completed: Boolean,
          selections: ["opt_1", "opt_2"],  // Selected option IDs
          correct: Boolean,
          score: Number,
          timeSpent: Number,
          attempts: Number
        }
        // ... more nodes
      }
    },

    // Session metrics
    metrics: {
      totalQuestions: Number,
      questionsAnswered: Number,
      correctAnswers: Number,
      score: Number,
      optimalPathFollowed: Boolean,
      backtrackCount: Number
    },

    // Timing
    startedAt: Date,
    completedAt: Date,
    lastActivityAt: Date,
    totalTimeSpent: Number  // In seconds
  }],

  // Series metadata
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date
}
```

## Backend Implementation

### File Structure
```
backend/src/
├── models/
│   ├── DecisionTreeQuiz.js
│   └── DecisionTreeSeries.js
├── controllers/
│   ├── decisionTreeQuizController.js
│   └── decisionTreeSeriesController.js
├── routes/
│   ├── decisionTreeQuizzes.js
│   └── decisionTreeSeries.js
├── services/
│   ├── pathfindingService.js       // Calculate available paths
│   ├── scoringService.js           // Score calculations
│   └── progressService.js          // Progress tracking
└── validators/
    └── decisionTreeValidators.js

```

### Model Implementation

```javascript
// models/DecisionTreeQuiz.js
import mongoose from 'mongoose';
import Counter from './Counter.js';

const optionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  correct: { type: Boolean, default: false },
  weight: { type: Number, default: 1 }
});

const nodeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['question', 'junction', 'endpoint'],
    required: true
  },
  question: String,
  content: String,
  helpText: String,
  required: { type: Number, default: 1 },
  options: [optionSchema],
  display: {
    size: {
      type: String,
      enum: ['normal', 'wide', 'compact', 'dot'],
      default: 'normal'
    },
    theme: {
      type: String,
      enum: ['primary', 'success', 'warning', 'danger', 'info'],
      default: 'primary'
    }
  }
});

const edgeSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  condition: {
    type: {
      type: String,
      enum: ['any', 'all', 'correct_includes', 'score_threshold', 'custom'],
      default: 'any'
    },
    value: mongoose.Schema.Types.Mixed
  }
});

const decisionTreeQuizSchema = new mongoose.Schema({
  quizId: { type: Number, unique: true },
  title: { type: String, required: true },
  subject: { type: String, required: true },
  chapter: { type: String, required: true },
  section: String,
  tags: [String],
  source: String,
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
  },

  meta: {
    description: String,
    author: String,
    estimatedMinutes: Number,
    prerequisites: [String],
    learningObjectives: [String]
  },

  structure: {
    rows: [[String]],
    nodes: {
      type: Map,
      of: nodeSchema
    },
    edges: [edgeSchema]
  },

  scoring: {
    passingScore: { type: Number, default: 0.7 },
    scoringMethod: {
      type: String,
      enum: ['simple', 'weighted', 'pathway'],
      default: 'weighted'
    },
    bonusForOptimalPath: { type: Number, default: 10 },
    penaltyForBacktrack: { type: Number, default: -5 }
  },

  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 },

  analytics: {
    timesCompleted: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 },
    commonPaths: [{
      path: [String],
      count: Number,
      avgScore: Number
    }]
  }
}, {
  timestamps: true
});

// Auto-increment quizId
decisionTreeQuizSchema.pre('save', async function(next) {
  if (this.isNew && !this.quizId) {
    this.quizId = await Counter.getNextSequence('decisionTreeQuizId');
  }
  next();
});

// Instance methods
decisionTreeQuizSchema.methods.getStartNode = function() {
  const startId = this.structure.rows[0]?.[0];
  return startId ? this.structure.nodes.get(startId) : null;
};

decisionTreeQuizSchema.methods.getNextNodes = function(currentNodeId, nodeState) {
  const edges = this.structure.edges.filter(e => e.from === currentNodeId);
  return edges.filter(edge => {
    return this.evaluateCondition(edge.condition, nodeState);
  }).map(e => e.to);
};

export default mongoose.model('DecisionTreeQuiz', decisionTreeQuizSchema);
```

### Controller Implementation

```javascript
// controllers/decisionTreeQuizController.js
import DecisionTreeQuiz from '../models/DecisionTreeQuiz.js';
import { PathfindingService } from '../services/pathfindingService.js';

class DecisionTreeQuizController {

  /**
   * Get quiz with calculated initial state
   */
  static async getQuiz(req, res) {
    try {
      const { quizId } = req.params;
      const quiz = await DecisionTreeQuiz.findOne({ quizId }).lean();

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      // Calculate initial available nodes
      const pathfinding = new PathfindingService(quiz.structure);
      const initialNodes = pathfinding.getAvailableNodes([]);

      res.json({
        success: true,
        data: {
          ...quiz,
          computed: {
            totalNodes: Object.keys(quiz.structure.nodes).length,
            questionNodes: Object.values(quiz.structure.nodes)
              .filter(n => n.type === 'question').length,
            initialNodes
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quiz',
        error: error.message
      });
    }
  }

  /**
   * Validate node answer and calculate next available nodes
   */
  static async validateAnswer(req, res) {
    try {
      const { quizId, nodeId } = req.params;
      const { selections, sessionId } = req.body;

      const quiz = await DecisionTreeQuiz.findOne({ quizId });
      const node = quiz.structure.nodes.get(nodeId);

      if (!node) {
        return res.status(404).json({
          success: false,
          message: 'Node not found'
        });
      }

      // Calculate correctness
      const correctOptions = node.options
        .filter(o => o.correct)
        .map(o => o.id);

      const isCorrect = selections.length >= node.required &&
        selections.filter(s => correctOptions.includes(s)).length >= node.required;

      // Calculate score for this node
      const score = this.calculateNodeScore(node, selections);

      // Get next available nodes based on answer
      const pathfinding = new PathfindingService(quiz.structure);
      const nextNodes = pathfinding.getNextNodes(nodeId, {
        selections,
        correct: isCorrect,
        score
      });

      res.json({
        success: true,
        data: {
          correct: isCorrect,
          score,
          correctOptions,
          nextNodes,
          feedback: this.generateFeedback(node, selections, isCorrect)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to validate answer',
        error: error.message
      });
    }
  }

  /**
   * Create new decision tree quiz
   */
  static async create(req, res) {
    try {
      const quizData = req.body;

      // Validate structure
      const validation = this.validateQuizStructure(quizData.structure);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid quiz structure',
          errors: validation.errors
        });
      }

      const quiz = new DecisionTreeQuiz(quizData);
      await quiz.save();

      res.status(201).json({
        success: true,
        message: 'Quiz created successfully',
        data: {
          quizId: quiz.quizId,
          title: quiz.title
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create quiz',
        error: error.message
      });
    }
  }

  /**
   * Helper: Validate quiz structure integrity
   */
  static validateQuizStructure(structure) {
    const errors = [];
    const nodeIds = new Set(Object.keys(structure.nodes));

    // Check all row references exist
    structure.rows.flat().forEach(id => {
      if (!nodeIds.has(id)) {
        errors.push(`Row references non-existent node: ${id}`);
      }
    });

    // Check all edges reference valid nodes
    structure.edges.forEach(edge => {
      if (!nodeIds.has(edge.from) && edge.from !== 'junction_*') {
        errors.push(`Edge.from references non-existent node: ${edge.from}`);
      }
      if (!nodeIds.has(edge.to) && edge.to !== 'junction_*') {
        errors.push(`Edge.to references non-existent node: ${edge.to}`);
      }
    });

    // Ensure at least one start node
    if (structure.rows[0]?.length === 0) {
      errors.push('No start node defined');
    }

    // Check for orphaned nodes
    const connectedNodes = new Set();
    structure.edges.forEach(edge => {
      connectedNodes.add(edge.from);
      connectedNodes.add(edge.to);
    });

    nodeIds.forEach(id => {
      if (!connectedNodes.has(id) && id !== structure.rows[0][0]) {
        errors.push(`Orphaned node with no connections: ${id}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default DecisionTreeQuizController;
```

## Frontend Architecture

### Component Structure
```
frontend/src/
├── components/decisionTree/
│   ├── DTQuizCanvas.js           // Main canvas with node layout
│   ├── DTNodeCard.js             // Individual question node
│   ├── DTConnectorOverlay.js     // SVG path renderer
│   ├── DTProgressBar.js          // Visual progress indicator
│   ├── DTResultsSummary.js       // End-of-quiz summary
│   ├── DTSeriesItem.js           // Browse page series item
│   └── DTSeriesList.js           // Browse page series list
│
├── pages/
│   ├── BrowseDTSeries.js         // Browse decision tree quizzes
│   ├── CreateDTSeries.js         // Create new series
│   ├── DTQuizSession.js          // Active quiz session
│   └── DTQuizBuilder.js          // Visual quiz builder (admin)
│
├── hooks/
│   ├── useDecisionTree.js        // Core quiz logic hook
│   ├── useNodeConnectors.js      // SVG positioning calculations
│   ├── useDTProgress.js          // Progress state management
│   └── useDTAnimations.js        // Animation orchestration
│
├── services/
│   └── decisionTreeApi.js        // API service layer
│
└── styles/
    └── decisionTree.css           // Decision tree specific styles
```

### Core React Implementation

```javascript
// components/decisionTree/DTQuizCanvas.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNodeConnectors } from '../../hooks/useNodeConnectors';
import { useDecisionTree } from '../../hooks/useDecisionTree';
import DTNodeCard from './DTNodeCard';
import DTConnectorOverlay from './DTConnectorOverlay';
import DTProgressBar from './DTProgressBar';

const DTQuizCanvas = ({ quiz, sessionId, onComplete }) => {
  const {
    currentNode,
    availableNodes,
    completedNodes,
    pathTaken,
    selections,
    score,
    handleNodeAnswer,
    handleNodeSelect,
    isNodeEnabled,
    getNodeState
  } = useDecisionTree(quiz, sessionId);

  const {
    containerRef,
    nodeRefs,
    connectorPaths,
    recalculatePaths
  } = useNodeConnectors(quiz.structure.edges);

  // Layout nodes in rows
  const nodeLayout = useMemo(() => {
    return quiz.structure.rows.map(row =>
      row.map(nodeId => ({
        id: nodeId,
        data: quiz.structure.nodes[nodeId]
      }))
    );
  }, [quiz]);

  // Handle node completion
  const onNodeComplete = useCallback(async (nodeId, selections, isCorrect) => {
    const result = await handleNodeAnswer(nodeId, selections);

    if (result.nextNodes.length === 0) {
      // Quiz completed
      onComplete({
        pathTaken,
        score: result.finalScore,
        timeSpent: result.timeSpent
      });
    }

    // Recalculate connector paths after state change
    setTimeout(recalculatePaths, 100);
  }, [handleNodeAnswer, pathTaken, onComplete, recalculatePaths]);

  return (
    <div className="dt-quiz-container">
      <DTProgressBar
        completed={completedNodes.length}
        total={Object.keys(quiz.structure.nodes).length}
        score={score}
      />

      <div className="dt-canvas" ref={containerRef}>
        <DTConnectorOverlay
          paths={connectorPaths}
          completedPaths={pathTaken}
        />

        {nodeLayout.map((row, rowIdx) => (
          <div key={rowIdx} className="dt-row">
            {row.map(({ id, data }) => {
              const nodeState = getNodeState(id);
              const enabled = isNodeEnabled(id);

              return (
                <DTNodeCard
                  key={id}
                  ref={el => nodeRefs.current[id] = el}
                  nodeId={id}
                  node={data}
                  state={nodeState}
                  enabled={enabled}
                  selections={selections[id]}
                  onSelect={(sel) => handleNodeSelect(id, sel)}
                  onSubmit={(sel) => onNodeComplete(id, sel, nodeState.correct)}
                  className={`dt-node-${data.display?.size || 'normal'}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DTQuizCanvas;
```

```javascript
// hooks/useDecisionTree.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { decisionTreeApi } from '../services/decisionTreeApi';

export const useDecisionTree = (quiz, sessionId) => {
  const [nodeStates, setNodeStates] = useState({});
  const [pathTaken, setPathTaken] = useState([]);
  const [selections, setSelections] = useState({});
  const [availableNodes, setAvailableNodes] = useState([]);
  const [currentScore, setCurrentScore] = useState(0);

  // Initialize with start nodes
  useEffect(() => {
    if (quiz) {
      const startNodes = quiz.structure.rows[0] || [];
      setAvailableNodes(startNodes);
    }
  }, [quiz]);

  // Check if node is enabled based on prerequisites
  const isNodeEnabled = useCallback((nodeId) => {
    if (availableNodes.includes(nodeId)) return true;
    if (nodeStates[nodeId]?.completed) return true;
    return false;
  }, [availableNodes, nodeStates]);

  // Handle answer submission for a node
  const handleNodeAnswer = useCallback(async (nodeId, nodeSelections) => {
    try {
      // Validate answer with backend
      const result = await decisionTreeApi.validateAnswer(
        quiz.quizId,
        nodeId,
        nodeSelections,
        sessionId
      );

      // Update node state
      setNodeStates(prev => ({
        ...prev,
        [nodeId]: {
          completed: true,
          correct: result.correct,
          selections: nodeSelections,
          score: result.score,
          feedback: result.feedback
        }
      }));

      // Update path taken
      setPathTaken(prev => [...prev, nodeId]);

      // Update available nodes
      setAvailableNodes(result.nextNodes);

      // Update score
      setCurrentScore(prev => prev + result.score);

      // Save progress to backend
      await decisionTreeApi.saveProgress(sessionId, {
        nodeId,
        selections: nodeSelections,
        correct: result.correct,
        score: result.score
      });

      return result;
    } catch (error) {
      console.error('Failed to submit answer:', error);
      throw error;
    }
  }, [quiz, sessionId]);

  // Handle selection changes (before submission)
  const handleNodeSelect = useCallback((nodeId, selection) => {
    setSelections(prev => ({
      ...prev,
      [nodeId]: selection
    }));
  }, []);

  // Get completed nodes
  const completedNodes = useMemo(() => {
    return Object.keys(nodeStates).filter(id => nodeStates[id]?.completed);
  }, [nodeStates]);

  // Calculate progress percentage
  const progress = useMemo(() => {
    const total = Object.keys(quiz?.structure?.nodes || {}).length;
    return total > 0 ? (completedNodes.length / total) * 100 : 0;
  }, [quiz, completedNodes]);

  return {
    nodeStates,
    pathTaken,
    selections,
    availableNodes,
    completedNodes,
    currentScore,
    progress,
    isNodeEnabled,
    handleNodeAnswer,
    handleNodeSelect,
    getNodeState: (id) => nodeStates[id] || {}
  };
};
```

## Visual Components

### Node Card Component

```javascript
// components/decisionTree/DTNodeCard.js
import React, { useState, forwardRef } from 'react';
import classNames from 'classnames';

const DTNodeCard = forwardRef(({
  nodeId,
  node,
  state,
  enabled,
  selections = [],
  onSelect,
  onSubmit,
  className
}, ref) => {
  const [localSelections, setLocalSelections] = useState(new Set(selections));
  const [showFeedback, setShowFeedback] = useState(false);

  // Handle junction nodes differently
  if (node.type === 'junction') {
    return (
      <div ref={ref} className="dt-junction-node" />
    );
  }

  // Handle endpoint nodes
  if (node.type === 'endpoint') {
    return (
      <div ref={ref} className={classNames('dt-endpoint-node', className)}>
        <div className="dt-endpoint-content">
          {node.content}
        </div>
      </div>
    );
  }

  // Handle option selection
  const toggleOption = (optionId) => {
    if (!enabled || state.completed) return;

    const newSelections = new Set(localSelections);
    if (newSelections.has(optionId)) {
      newSelections.delete(optionId);
    } else {
      newSelections.add(optionId);
    }

    setLocalSelections(newSelections);
    onSelect(Array.from(newSelections));
  };

  // Handle check answer
  const handleCheck = () => {
    if (localSelections.size < node.required) {
      alert(`Please select at least ${node.required} option(s)`);
      return;
    }

    onSubmit(Array.from(localSelections));
    setShowFeedback(true);
  };

  // Handle clear selections
  const handleClear = () => {
    setLocalSelections(new Set());
    onSelect([]);
  };

  const cardClasses = classNames(
    'dt-node-card',
    className,
    {
      'dt-node-enabled': enabled,
      'dt-node-disabled': !enabled,
      'dt-node-completed': state.completed,
      'dt-node-correct': state.completed && state.correct,
      'dt-node-incorrect': state.completed && !state.correct,
      [`dt-theme-${node.display?.theme}`]: node.display?.theme
    }
  );

  return (
    <div ref={ref} className={cardClasses}>
      <div className="dt-node-header">
        <span className="dt-node-label">Question {nodeId}</span>
        {state.completed && (
          <span className={classNames('dt-node-status', {
            'dt-status-correct': state.correct,
            'dt-status-incorrect': !state.correct
          })}>
            {state.correct ? '✓' : '✗'}
          </span>
        )}
      </div>

      <div className="dt-node-question">
        {node.question}
        {node.helpText && (
          <div className="dt-node-help">{node.helpText}</div>
        )}
      </div>

      <div className="dt-node-options">
        {node.options.map((option, idx) => {
          const isSelected = localSelections.has(option.id);
          const showResult = state.completed || showFeedback;

          return (
            <div
              key={option.id}
              className={classNames('dt-option', {
                'dt-option-selected': isSelected,
                'dt-option-correct': showResult && option.correct,
                'dt-option-incorrect': showResult && isSelected && !option.correct,
                'dt-option-missed': showResult && !isSelected && option.correct
              })}
              onClick={() => toggleOption(option.id)}
            >
              <span className="dt-option-letter">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="dt-option-text">{option.text}</span>
              {showResult && (
                <span className="dt-option-indicator">
                  {option.correct ? '✓' : isSelected ? '✗' : ''}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {enabled && !state.completed && (
        <div className="dt-node-actions">
          <button
            className="dt-btn dt-btn-check"
            onClick={handleCheck}
            disabled={localSelections.size === 0}
          >
            Check Answer
          </button>
          <button
            className="dt-btn dt-btn-clear"
            onClick={handleClear}
          >
            Clear
          </button>
        </div>
      )}

      {state.feedback && showFeedback && (
        <div className="dt-node-feedback">
          {state.feedback}
        </div>
      )}
    </div>
  );
});

DTNodeCard.displayName = 'DTNodeCard';

export default DTNodeCard;
```

### SVG Connector Component

```javascript
// components/decisionTree/DTConnectorOverlay.js
import React from 'react';
import classNames from 'classnames';

const DTConnectorOverlay = ({ paths, completedPaths = [] }) => {
  return (
    <svg className="dt-connector-svg" aria-hidden="true">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3, 0 6"
            fill="currentColor"
          />
        </marker>
      </defs>

      {paths.map((path, index) => {
        const isCompleted = completedPaths.some(
          p => path.from === p.from && path.to === p.to
        );

        return (
          <path
            key={`${path.from}-${path.to}-${index}`}
            d={path.d}
            className={classNames('dt-connector-path', {
              'dt-path-completed': isCompleted,
              'dt-path-pending': !isCompleted
            })}
            markerEnd="url(#arrowhead)"
          />
        );
      })}
    </svg>
  );
};

export default DTConnectorOverlay;
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up MongoDB schemas
- [ ] Create base models with validation
- [ ] Implement Counter for auto-increment IDs
- [ ] Set up basic CRUD endpoints
- [ ] Create initial test data

### Phase 2: Backend Logic (Week 2)
- [ ] Implement PathfindingService
- [ ] Build condition evaluation system
- [ ] Create scoring algorithms
- [ ] Add progress tracking
- [ ] Implement session management

### Phase 3: Frontend Core (Week 3)
- [ ] Port SVG connector logic from lithium quiz
- [ ] Build DTQuizCanvas component
- [ ] Implement useDecisionTree hook
- [ ] Create DTNodeCard component
- [ ] Add animations and transitions

### Phase 4: Integration (Week 4)
- [ ] Add to navigation system
- [ ] Create browse pages
- [ ] Implement series creation flow
- [ ] Add to existing filter system
- [ ] Integrate with caching layer

### Phase 5: Advanced Features (Week 5)
- [ ] Visual quiz builder interface
- [ ] Path analytics dashboard
- [ ] Import/export functionality
- [ ] Performance optimization
- [ ] Mobile responsiveness

## Technical Specifications

### Performance Requirements
- Initial load: < 2 seconds
- Node transition: < 100ms
- SVG recalculation: < 50ms
- Maximum nodes: 100 per quiz
- Concurrent sessions: Unlimited

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

### Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus indicators

## Performance Optimization

### Caching Strategy

```javascript
// utils/dtCacheManager.js
class DTCacheManager {
  constructor() {
    this.quizCache = new Map();
    this.progressCache = new Map();
  }

  // Cache quiz structure (immutable)
  cacheQuiz(quizId, quizData) {
    this.quizCache.set(quizId, {
      data: quizData,
      timestamp: Date.now()
    });

    // Store in localStorage for offline support
    localStorage.setItem(
      `dt_quiz_${quizId}`,
      JSON.stringify(quizData)
    );
  }

  // Cache progress (mutable)
  cacheProgress(sessionId, progress) {
    this.progressCache.set(sessionId, progress);

    // Debounced localStorage sync
    this.syncProgressToStorage(sessionId, progress);
  }

  syncProgressToStorage = debounce((sessionId, progress) => {
    localStorage.setItem(
      `dt_progress_${sessionId}`,
      JSON.stringify(progress)
    );
  }, 1000);
}
```

### Virtualization for Large Quizzes

```javascript
// hooks/useVirtualizedNodes.js
import { useVirtualizer } from '@tanstack/react-virtual';

export const useVirtualizedNodes = (rows, containerRef) => {
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 250, // Estimated row height
    overscan: 2 // Render 2 rows outside viewport
  });

  const virtualRows = virtualizer.getVirtualItems();

  return {
    virtualRows,
    totalHeight: virtualizer.getTotalSize(),
    translateY: (index) => virtualRows[index]?.start || 0
  };
};
```

### Prefetching Strategy

```javascript
// services/dtPrefetcher.js
class DTPrefetcher {
  static async prefetchNextNodes(quiz, currentNodeId) {
    const edges = quiz.structure.edges.filter(e => e.from === currentNodeId);
    const nextNodeIds = edges.map(e => e.to);

    // Prefetch next node questions
    nextNodeIds.forEach(nodeId => {
      const node = quiz.structure.nodes[nodeId];
      if (node && node.type === 'question') {
        // Preload any media
        this.preloadNodeMedia(node);
      }
    });
  }

  static preloadNodeMedia(node) {
    // Preload images in question text
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;

    while ((match = imgRegex.exec(node.question)) !== null) {
      const img = new Image();
      img.src = match[1];
    }
  }
}
```

## Testing Strategy

### Unit Tests

```javascript
// __tests__/decisionTree/pathfinding.test.js
describe('PathfindingService', () => {
  it('should find initial nodes', () => {
    const structure = {
      rows: [['start'], ['a', 'b'], ['end']],
      edges: [
        { from: 'start', to: 'a' },
        { from: 'start', to: 'b' },
        { from: 'a', to: 'end' },
        { from: 'b', to: 'end' }
      ]
    };

    const service = new PathfindingService(structure);
    const initial = service.getAvailableNodes([]);

    expect(initial).toEqual(['start']);
  });

  it('should calculate next nodes based on conditions', () => {
    // Test conditional branching
  });

  it('should detect cycles and prevent infinite loops', () => {
    // Test cycle detection
  });
});
```

### Integration Tests

```javascript
// __tests__/integration/dtQuizFlow.test.js
describe('Decision Tree Quiz Flow', () => {
  it('should complete a full quiz path', async () => {
    // Create quiz
    const quiz = await createTestQuiz();

    // Start session
    const session = await startSession(quiz.quizId);

    // Answer questions
    const path = ['start', 'assessment_1', 'concept_a', 'conclusion'];

    for (const nodeId of path) {
      const result = await answerNode(session.id, nodeId, ['opt_1']);
      expect(result.success).toBe(true);
    }

    // Verify completion
    const finalSession = await getSession(session.id);
    expect(finalSession.status).toBe('completed');
    expect(finalSession.pathTaken).toEqual(path);
  });
});
```

### E2E Tests

```javascript
// cypress/integration/decision-tree.spec.js
describe('Decision Tree Quiz', () => {
  it('should navigate through quiz with visual feedback', () => {
    cy.visit('/browse-dt-series');
    cy.contains('Start Quiz').click();

    // Answer first question
    cy.get('.dt-node-card').first().within(() => {
      cy.contains('Option A').click();
      cy.contains('Check Answer').click();
    });

    // Verify path updates
    cy.get('.dt-connector-path.dt-path-completed').should('exist');

    // Verify next node is enabled
    cy.get('.dt-node-enabled').should('have.length.greaterThan', 1);
  });
});
```

## Deployment Considerations

### Environment Variables
```bash
# .env additions
DT_MAX_NODES=100
DT_SESSION_TIMEOUT=3600000  # 1 hour in ms
DT_CACHE_TTL=86400000       # 24 hours in ms
DT_ENABLE_ANALYTICS=true
DT_BUILDER_ENABLED=false    # Enable visual builder in production
```

### Database Indexes
```javascript
// Optimize queries with indexes
db.decisionTreeQuizzes.createIndex({ quizId: 1 });
db.decisionTreeQuizzes.createIndex({ subject: 1, chapter: 1 });
db.decisionTreeQuizzes.createIndex({ tags: 1 });
db.decisionTreeQuizzes.createIndex({ "meta.difficulty": 1 });

db.decisionTreeSeries.createIndex({ status: 1 });
db.decisionTreeSeries.createIndex({ "sessions.sessionId": 1 });
db.decisionTreeSeries.createIndex({ createdAt: -1 });
```

### Monitoring & Analytics
```javascript
// Track key metrics
const DTMetrics = {
  // Performance
  nodeRenderTime: [],
  pathCalculationTime: [],
  sessionLoadTime: [],

  // User behavior
  averageNodesPerSession: 0,
  commonFailurePoints: {},
  pathCompletionRate: 0,

  // System health
  cacheHitRate: 0,
  apiResponseTime: [],
  errorRate: 0
};
```

## Conclusion

This decision tree quiz system will provide:
1. **Personalized Learning Paths**: Adaptive questioning based on responses
2. **Visual Learning**: Clear representation of concept relationships
3. **Detailed Analytics**: Track learning patterns and optimize content
4. **Scalable Architecture**: Handles complex quiz structures efficiently
5. **Seamless Integration**: Works alongside existing MCQ, flashcard, and table systems

The implementation leverages your existing infrastructure while adding powerful new capabilities for guided, adaptive learning experiences.