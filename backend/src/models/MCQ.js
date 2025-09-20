/**
 * MCQ (Multiple Choice Question) Model
 *
 * Defines the schema for MCQ questions in the database.
 * Includes indexes for performance optimization and full-text search.
 *
 * Indexes:
 * - questionId: Unique identifier for fast lookups
 * - question: Text index for search functionality
 * - Compound indexes on subject/chapter/section for filtering
 */

import mongoose from 'mongoose';

const MCQSchema = new mongoose.Schema({
  // Unique identifier for each MCQ
  questionId: {
    type: Number,
    required: true,
    unique: true,
    index: true  // Index for O(1) lookups
  },
  // Question text - indexed for full-text search
  question: {
    type: String,
    required: true,
    index: true  // Enables $text search
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
    type: String
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