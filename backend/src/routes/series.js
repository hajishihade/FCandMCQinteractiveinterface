import express from 'express';
import {
  getAllFlashcardSeries as getAllSeries,
  createFlashcardSeries as createSeries,
  getFlashcardSeries as getSeries,
  startSession,
  recordInteraction,
  completeSession,
  deleteSession,
  deleteFlashcardSeries as deleteSeries,
  completeFlashcardSeries as completeSeries,
  getFilterOptions
} from '../controllers/seriesController.js';
import {
  validateSeriesTitle,
  validateCardIds,
  validateInteraction,
  validatePagination
} from '../middleware/validation.js';

const router = express.Router();

router.get('/', validatePagination, getAllSeries);

router.get('/filter-options', getFilterOptions);

router.post('/', validateSeriesTitle, createSeries);

router.get('/:seriesId', getSeries);

router.post('/:seriesId/sessions', validateCardIds, startSession);

router.post('/:seriesId/sessions/:sessionId/interactions', validateInteraction, recordInteraction);

router.put('/:seriesId/sessions/:sessionId/complete', completeSession);

router.delete('/:seriesId/sessions/:sessionId', deleteSession);

router.delete('/:seriesId', deleteSeries);

router.put('/:seriesId/complete', completeSeries);

export default router;