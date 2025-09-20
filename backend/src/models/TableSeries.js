import mongoose from 'mongoose';
import { seriesConnection } from '../../config/seriesDatabase.js';

const TablePlacementSchema = new mongoose.Schema({
  cellText: String,
  placedAtRow: Number,
  placedAtColumn: Number,
  correctRow: Number,
  correctColumn: Number,
  correctCellText: String
}, { _id: false });

const TableInteractionSchema = new mongoose.Schema({
  userGrid: [[String]], // 2D array of cell text placements
  results: {
    correctPlacements: {
      type: Number,
      required: true
    },
    totalCells: {
      type: Number,
      required: true
    },
    accuracy: {
      type: Number,
      required: true
    },
    wrongPlacements: [TablePlacementSchema]
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

const TableSessionCardSchema = new mongoose.Schema({
  tableId: {
    type: Number,
    required: true
  },
  interaction: {
    type: TableInteractionSchema,
    default: null
  }
}, { _id: false });

const TableSessionSchema = new mongoose.Schema({
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
  tables: [TableSessionCardSchema],
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { _id: false });

const TableSeriesSchema = new mongoose.Schema({
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
  sessions: [TableSessionSchema],
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Instance methods (following exact MCQ pattern)
TableSeriesSchema.methods.getNextSessionId = function() {
  return this.sessions.length > 0
    ? Math.max(...this.sessions.map(s => s.sessionId)) + 1
    : 1;
};

TableSeriesSchema.methods.getActiveSession = function() {
  return this.sessions.find(session => session.status === 'active') || null;
};

TableSeriesSchema.methods.getCompletedSessions = function() {
  return this.sessions.filter(session => session.status === 'completed');
};

TableSeriesSchema.methods.getTotalTables = function() {
  return this.sessions.reduce((total, session) => total + session.tables.length, 0);
};

TableSeriesSchema.methods.getTotalCorrectCells = function() {
  return this.sessions.reduce((total, session) => {
    return total + session.tables.reduce((sessionTotal, table) => {
      return sessionTotal + (table.interaction ? table.interaction.results.correctPlacements : 0);
    }, 0);
  }, 0);
};

TableSeriesSchema.methods.getTotalCells = function() {
  return this.sessions.reduce((total, session) => {
    return total + session.tables.reduce((sessionTotal, table) => {
      return sessionTotal + (table.interaction ? table.interaction.results.totalCells : 0);
    }, 0);
  }, 0);
};

TableSeriesSchema.methods.getSuccessRate = function() {
  const totalCells = this.getTotalCells();
  if (totalCells === 0) return 0;
  return Math.round((this.getTotalCorrectCells() / totalCells) * 100);
};

// Use series database connection → collection: "tables"
const TableSeries = seriesConnection.model('tables', TableSeriesSchema);

export default TableSeries;