/**
 * Table Quiz Model
 *
 * Represents table-based quiz content with grid structure.
 * Stores table data with cells organized by rows and columns.
 *
 * Features:
 * - Grid-based table structure
 * - Header cell differentiation
 * - Cell-level Notion integration
 * - Same categorization as MCQ for consistency
 *
 * Schema structure:
 * - TableQuiz (root)
 *   - Cells (embedded array with row/column positioning)
 *
 * Indexes:
 * - tableId: Unique identifier
 * - name: Text search
 * - Compound indexes for filtering
 *
 * ⚠️ IMPROVEMENT: Model name 'table' should match schema name
 */

import mongoose from 'mongoose';

/**
 * Schema for individual table cell
 */
const TableCellSchema = new mongoose.Schema({
  row: {
    type: Number,
    required: true
  },
  column: {
    type: Number,
    required: true
  },
  text: {
    type: String,
    default: ''
  },
  isHeader: {
    type: Boolean,
    required: true,
    default: false
  },
  notionBlockIds: [String]
}, { _id: false });

/**
 * Main table quiz schema
 * Defines grid structure with embedded cells
 */
const TableQuizSchema = new mongoose.Schema({
  tableId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  rows: {
    type: Number,
    required: true,
    min: 2
  },
  columns: {
    type: Number,
    required: true,
    min: 2
  },
  cells: [TableCellSchema],

  // Categorization fields (same as MCQ)
  subject: {
    type: String,
    default: '',
    index: true
  },
  chapter: {
    type: String,
    default: '',
    index: true
  },
  section: {
    type: String,
    default: '',
    index: true
  },
  tags: [{
    type: String
  }],

  // Additional metadata (same as MCQ)
  source: {
    type: String,
    default: ''
  },
  paragraph: {
    type: String,
    default: ''
  },
  point: {
    type: String,
    default: ''
  },
  subpoint: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound indexes for efficient filtering (same as MCQ)
TableQuizSchema.index({ subject: 1, chapter: 1 });
TableQuizSchema.index({ subject: 1, chapter: 1, section: 1 });
TableQuizSchema.index({ tags: 1 });
TableQuizSchema.index({ source: 1 });

// Instance methods for table processing

/**
 * Get all header cells from table
 * @returns {Array} Array of header cell objects
 */
TableQuizSchema.methods.getHeaderCells = function() {
  return this.cells.filter(cell => cell.isHeader);
};

/**
 * Get all non-header content cells
 * @returns {Array} Array of content cell objects
 */
TableQuizSchema.methods.getContentCells = function() {
  return this.cells.filter(cell => !cell.isHeader);
};

/**
 * Count total content cells (excluding headers)
 * @returns {number} Count of content cells
 */
TableQuizSchema.methods.getTotalContentCells = function() {
  return this.getContentCells().length;
};

// Use main mongoose connection for content database
// Fixed: Model name now matches schema naming convention
export default mongoose.model('TableQuiz', TableQuizSchema);