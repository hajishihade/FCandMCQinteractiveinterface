import mongoose from 'mongoose';
import { seriesConnection } from '../../config/seriesDatabase.js';

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
MCQSeriesNewSchema.methods.getNextSessionId = function() {
  return this.sessions.length > 0
    ? Math.max(...this.sessions.map(s => s.sessionId)) + 1
    : 1;
};

MCQSeriesNewSchema.methods.getActiveSession = function() {
  return this.sessions.find(session => session.status === 'active') || null;
};

MCQSeriesNewSchema.methods.getCompletedSessions = function() {
  return this.sessions.filter(session => session.status === 'completed');
};

MCQSeriesNewSchema.methods.getTotalQuestions = function() {
  return this.sessions.reduce((total, session) => total + session.questions.length, 0);
};

MCQSeriesNewSchema.methods.getTotalCorrect = function() {
  return this.sessions.reduce((total, session) => {
    return total + session.questions.filter(q =>
      q.interaction && q.interaction.isCorrect
    ).length;
  }, 0);
};

MCQSeriesNewSchema.methods.getSuccessRate = function() {
  const total = this.getTotalQuestions();
  if (total === 0) return 0;
  return Math.round((this.getTotalCorrect() / total) * 100);
};

const MCQSeriesNew = seriesConnection.model('MCQSeriesNew', MCQSeriesNewSchema);

export default MCQSeriesNew;