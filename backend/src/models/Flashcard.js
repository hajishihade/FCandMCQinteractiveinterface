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

flashcardSchema.statics.findByCardId = async function(cardId) {
  return await this.findOne({ cardId: cardId });
};

flashcardSchema.statics.findByCardIds = async function(cardIds) {
  return await this.find({ cardId: { $in: cardIds } });
};

flashcardSchema.statics.getAllFlashcards = async function() {
  return await this.find({});
};

const Flashcard = mongoose.model('Flashcard', flashcardSchema);

export default Flashcard;