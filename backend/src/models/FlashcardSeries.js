/**
 * Flashcard Series Model
 *
 * Manages flashcard study series with embedded sessions and interactions.
 * Similar architecture to MCQSeries but for flashcard content.
 *
 * Schema hierarchy:
 * - FlashcardSeries (root)
 *   - Sessions (embedded array)
 *     - Cards with interactions (embedded array)
 *
 * Features:
 * - Session-based studying with progress tracking
 * - Card interaction recording (right/wrong, difficulty, confidence)
 * - Time tracking per card
 * - Auto-incrementing session IDs
 * - Atomic operations via embedded documents
 *
 * Performance:
 * - Uses separate seriesConnection for isolation
 * - Embedded structure reduces database queries
 * - Methods for direct data manipulation
 */

import mongoose from 'mongoose';
import { seriesConnection } from '../../config/seriesDatabase.js';

/**
 * Schema for flashcard interaction data
 * Records user performance on individual cards
 */
const cardInteractionSchema = new mongoose.Schema({
  cardId: {
    type: Number,
    required: true
  },
  interaction: {
    result: {
      type: String,
      enum: ['Right', 'Wrong'],
      required: false
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: false
    },
    confidenceWhileSolving: {
      type: String,
      enum: ['High', 'Low'],
      required: false
    },
    timeSpent: {
      type: Number,
      required: false,
      min: 0
    }
  }
}, { _id: false });

/**
 * Schema for flashcard study session
 * Contains cards studied and completion status
 */
const flashcardSessionSchema = new mongoose.Schema({
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
  cards: [cardInteractionSchema],
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
 * Root schema for flashcard study series
 * Manages multiple sessions with overall progress
 */
const flashcardSeriesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  sessions: [flashcardSessionSchema],
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  collection: 'flashcards'
});

// Static and Instance methods

/**
 * Create new flashcard series
 * @static
 * @param {Object} seriesData - Series initialization data
 * @returns {Promise<Object>} Created series document
 */
flashcardSeriesSchema.statics.createSeries = async function(seriesData) {
  const series = new this(seriesData);
  return await series.save();
};

/**
 * Add new session to series
 * @param {Object} sessionData - Session configuration
 * @returns {Promise<Object>} Updated series document
 *
 * Auto-generates sequential session ID
 */
flashcardSeriesSchema.methods.addSession = function(sessionData) {
  const nextSessionId = this.sessions.length + 1;
  const newSession = {
    sessionId: nextSessionId,
    ...sessionData
  };
  this.sessions.push(newSession);
  return this.save();
};

/**
 * Get session by ID
 * @param {number} sessionId - Session identifier
 * @returns {Object|undefined} Session object or undefined
 */
flashcardSeriesSchema.methods.getSession = function(sessionId) {
  return this.sessions.find(session => session.sessionId === sessionId);
};

/**
 * Record card interaction within session
 * @param {number} sessionId - Target session ID
 * @param {number} cardId - Flashcard ID
 * @param {Object} interactionData - Interaction details (result, difficulty, confidence, time)
 * @returns {Promise<Object>} Updated series document
 * @throws {Error} If session not found
 *
 * Updates existing card or adds new card interaction
 */
flashcardSeriesSchema.methods.addCardInteraction = function(sessionId, cardId, interactionData) {
  const session = this.getSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const existingCardIndex = session.cards.findIndex(card => card.cardId === cardId);

  if (existingCardIndex !== -1) {
    session.cards[existingCardIndex].interaction = interactionData;
  } else {
    const cardInteraction = {
      cardId: cardId,
      interaction: interactionData
    };
    session.cards.push(cardInteraction);
  }

  return this.save();
};

/**
 * Mark session as completed
 * @param {number} sessionId - Session to complete
 * @returns {Promise<Object>} Updated series document
 * @throws {Error} If session not found
 */
flashcardSeriesSchema.methods.completeSession = function(sessionId) {
  const session = this.getSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.status = 'completed';
  session.completedAt = new Date();
  return this.save();
};

/**
 * Mark entire series as completed
 * @returns {Promise<Object>} Updated series document
 *
 * Sets completion timestamp and status
 */
flashcardSeriesSchema.methods.completeSeries = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

const FlashcardSeries = seriesConnection.model('FlashcardSeries', flashcardSeriesSchema);

export default FlashcardSeries;