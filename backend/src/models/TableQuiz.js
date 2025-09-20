import mongoose from 'mongoose';

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
TableQuizSchema.methods.getHeaderCells = function() {
  return this.cells.filter(cell => cell.isHeader);
};

TableQuizSchema.methods.getContentCells = function() {
  return this.cells.filter(cell => !cell.isHeader);
};

TableQuizSchema.methods.getTotalContentCells = function() {
  return this.getContentCells().length;
};

// Use main mongoose connection for content database → collection: "table"
export default mongoose.model('table', TableQuizSchema);