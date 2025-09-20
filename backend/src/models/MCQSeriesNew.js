/**
 * MCQ Series Model (New Architecture)
 *
 * Manages MCQ study series with embedded sessions and interactions.
 * Uses a separate database connection for series data.
 *
 * Schema hierarchy:
 * - MCQSeries (root)
 *   - Sessions (embedded array)
 *     - Questions (embedded array)
 *       - Interactions (embedded subdocument)
 *
 * Features:
 * - Embedded document structure for atomic operations
 * - Session tracking with status management
 * - Interaction recording with performance metrics
 * - Success rate calculation
 * - Auto-incrementing session IDs
 *
 * Performance considerations:
 * - Uses separate seriesConnection to isolate series operations
 * - Embedded documents reduce join operations
 * - Methods for calculating statistics without aggregation
 */

import mongoose from 'mongoose';
import { seriesConnection } from '../../config/seriesDatabase.js';

/**
 * Schema for user interaction with MCQ question
 * Tracks answer selection and performance metrics
 */
const MCQInteractionSchema = new mongoose.Schema({
  selectedAnswer: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D', 'E']
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  },
  confidenceWhileSolving: {
    type: String,
    required: true,
    enum: ['High', 'Low']
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 1
  }
}, { _id: false });

/**
 * Schema for individual question within session
 * Links to MCQ by questionId with optional interaction
 */
const MCQSessionCardSchema = new mongoose.Schema({
  questionId: {
    type: Number,
    required: true
  },
  interaction: {
    type: MCQInteractionSchema,
    default: null
  }
}, { _id: false });

/**
 * Schema for study session within series
 * Contains questions and tracks completion status
 */
const MCQSessionSchema = new mongoose.Schema({
  sessionId: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  generatedFrom: {
    type: Number,
    default: null
  },
  questions: [MCQSessionCardSchema],
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { _id: false });

/**
 * Root schema for MCQ study series
 * Contains multiple sessions with progress tracking
 */
const MCQSeriesNewSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  sessions: [MCQSessionSchema],
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'mcqs'
});

// Instance methods

/**
 * Get next available session ID
 * @returns {number} Next sequential session ID
 */
MCQSeriesNewSchema.methods.getNextSessionId = function() {
  return this.sessions.length > 0
    ? Math.max(...this.sessions.map(s => s.sessionId)) + 1
    : 1;
};

/**
 * Find currently active session
 * @returns {Object|null} Active session or null
 */
MCQSeriesNewSchema.methods.getActiveSession = function() {
  return this.sessions.find(session => session.status === 'active') || null;
};

/**
 * Get all completed sessions
 * @returns {Array} Array of completed session objects
 */
MCQSeriesNewSchema.methods.getCompletedSessions = function() {
  return this.sessions.filter(session => session.status === 'completed');
};

/**
 * Calculate total questions across all sessions
 * @returns {number} Total question count
 */
MCQSeriesNewSchema.methods.getTotalQuestions = function() {
  return this.sessions.reduce((total, session) => total + session.questions.length, 0);
};

/**
 * Calculate total correct answers across all sessions
 * @returns {number} Count of correct answers
 */
MCQSeriesNewSchema.methods.getTotalCorrect = function() {
  return this.sessions.reduce((total, session) => {
    return total + session.questions.filter(q =>
      q.interaction && q.interaction.isCorrect
    ).length;
  }, 0);
};

/**
 * Calculate overall success rate percentage
 * @returns {number} Success rate (0-100)
 */
MCQSeriesNewSchema.methods.getSuccessRate = function() {
  const total = this.getTotalQuestions();
  if (total === 0) return 0;
  return Math.round((this.getTotalCorrect() / total) * 100);
};

const MCQSeriesNew = seriesConnection.model('MCQSeriesNew', MCQSeriesNewSchema);

export default MCQSeriesNew;