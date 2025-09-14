import mongoose from 'mongoose';

const MCQSchema = new mongoose.Schema({
  questionId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  question: {
    type: String,
    required: true,
    index: true
  },
  options: {
    A: {
      text: { type: String, required: true },
      notionBlockIds: [String],
      relatedNotionBlockIds: [String]
    },
    B: {
      text: { type: String, required: true },
      notionBlockIds: [String],
      relatedNotionBlockIds: [String]
    },
    C: {
      text: { type: String, required: true },
      notionBlockIds: [String],
      relatedNotionBlockIds: [String]
    },
    D: {
      text: { type: String, required: true },
      notionBlockIds: [String],
      relatedNotionBlockIds: [String]
    },
    E: {
      text: { type: String, required: true },
      notionBlockIds: [String],
      relatedNotionBlockIds: [String]
    }
  },
  correctAnswer: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D', 'E', 'unknown'],
    default: 'unknown'
  },
  explanation: {
    type: String,
    required: true
  },

  // Categorization fields
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
    type: String,
    index: true
  }],

  // Additional metadata
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

// Compound indexes for efficient filtering
MCQSchema.index({ subject: 1, chapter: 1 });
MCQSchema.index({ subject: 1, chapter: 1, section: 1 });
MCQSchema.index({ tags: 1 });
MCQSchema.index({ source: 1 });

export default mongoose.model('MCQ', MCQSchema);