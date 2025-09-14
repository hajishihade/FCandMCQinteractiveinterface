import express from 'express';
import {
  getAllFlashcards,
  getFlashcardByCardId,
  getFlashcardsByCardIds
} from '../controllers/flashcardController.js';
import { validateCardIds, validatePagination } from '../middleware/validation.js';

const router = express.Router();

router.get('/', validatePagination, getAllFlashcards);

router.get('/:cardId', getFlashcardByCardId);

router.post('/batch', validateCardIds, getFlashcardsByCardIds);

export default router;