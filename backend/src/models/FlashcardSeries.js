import mongoose from 'mongoose';
import { seriesConnection } from '../../config/seriesDatabase.js';

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

// Instance methods
flashcardSeriesSchema.statics.createSeries = async function(seriesData) {
  const series = new this(seriesData);
  return await series.save();
};

flashcardSeriesSchema.methods.addSession = function(sessionData) {
  const nextSessionId = this.sessions.length + 1;
  const newSession = {
    sessionId: nextSessionId,
    ...sessionData
  };
  this.sessions.push(newSession);
  return this.save();
};

flashcardSeriesSchema.methods.getSession = function(sessionId) {
  return this.sessions.find(session => session.sessionId === sessionId);
};

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

flashcardSeriesSchema.methods.completeSession = function(sessionId) {
  const session = this.getSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.status = 'completed';
  session.completedAt = new Date();
  return this.save();
};

flashcardSeriesSchema.methods.completeSeries = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

const FlashcardSeries = seriesConnection.model('FlashcardSeries', flashcardSeriesSchema);

export default FlashcardSeries;