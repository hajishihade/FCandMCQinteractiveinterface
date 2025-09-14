import Flashcard from '../models/Flashcard.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const getAllFlashcards = asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination || { page: 1, limit: 10, skip: 0 };
  const { search, subject, difficulty } = req.query;

  let query = {};

  // Search functionality
  if (search) {
    query.$or = [
      { frontText: { $regex: search, $options: 'i' } },
      { backText: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by subject
  if (subject) {
    query.subject = { $regex: subject, $options: 'i' };
  }

  // Get total count for pagination
  const total = await Flashcard.countDocuments(query);

  // Get paginated results
  const flashcards = await Flashcard.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ cardId: 1 });

  res.status(200).json({
    success: true,
    message: 'Flashcards retrieved successfully',
    data: flashcards,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit
    }
  });
});

const getFlashcardByCardId = asyncHandler(async (req, res) => {
  const { cardId } = req.params;

  const flashcard = await Flashcard.findByCardId(parseInt(cardId));
  if (!flashcard) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: 'Flashcard not found',
      timestamp: new Date().toISOString()
    });
  }

  res.status(200).json({
    success: true,
    message: 'Flashcard retrieved successfully',
    data: flashcard
  });
});

const getFlashcardsByCardIds = asyncHandler(async (req, res) => {
  const { cardIds } = req.body;

  const numericCardIds = cardIds.map(id => parseInt(id));
  const flashcards = await Flashcard.findByCardIds(numericCardIds);

  const foundCardIds = flashcards.map(card => card.cardId);
  const missingCardIds = numericCardIds.filter(cardId => !foundCardIds.includes(cardId));

  if (missingCardIds.length > 0) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: 'Some flashcards not found',
      missingCardIds,
      timestamp: new Date().toISOString()
    });
  }

  res.status(200).json({
    success: true,
    message: 'Flashcards retrieved successfully',
    count: flashcards.length,
    data: flashcards
  });
});

export {
  getAllFlashcards,
  getFlashcardByCardId,
  getFlashcardsByCardIds
};