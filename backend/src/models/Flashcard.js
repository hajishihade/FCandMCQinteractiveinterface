/**
 * Flashcard Model
 *
 * Represents study flashcards with front/back text pairs.
 * Used for spaced repetition and active recall studying.
 *
 * Features:
 * - Front/back card structure for Q&A format
 * - Subject/chapter/section categorization
 * - Notion integration via block IDs
 * - Unique cardId for referencing
 *
 * Indexes:
 * - cardId: Unique index for O(1) lookups
 *
 * Static methods:
 * - findByCardId: Fetch single card
 * - findByCardIds: Batch fetch multiple cards
 * - getAllFlashcards: Retrieve entire collection
 */

import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  frontText: {
    type: String,
    required: true
  },
  backText: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  chapter: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  notionBlockIds: [{
    type: String
  }],
  cardId: {
    type: Number,
    unique: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'flashcards'
});

/**
 * Find flashcard by unique card ID
 * @param {number} cardId - Unique flashcard identifier
 * @returns {Promise<Object|null>} Flashcard document or null
 */
flashcardSchema.statics.findByCardId = async function(cardId) {
  return await this.findOne({ cardId: cardId }).lean();  // Optimized for read-only
};

/**
 * Find multiple flashcards by card IDs
 * @param {Array<number>} cardIds - Array of flashcard IDs
 * @returns {Promise<Array>} Array of flashcard documents
 *
 * Used by session controllers to batch-load cards
 */
flashcardSchema.statics.findByCardIds = async function(cardIds) {
  return await this.find({ cardId: { $in: cardIds } }).lean();  // Optimized for read-only
};

/**
 * Get all flashcards from database
 * @returns {Promise<Array>} Complete flashcard collection
 *
 * Warning: Use with pagination in production
 */
flashcardSchema.statics.getAllFlashcards = async function() {
  return await this.find({}).lean();  // Optimized for read-only
};

const Flashcard = mongoose.model('Flashcard', flashcardSchema);

export default Flashcard;