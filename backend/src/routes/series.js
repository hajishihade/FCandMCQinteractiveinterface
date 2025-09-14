import express from 'express';
import {
  getAllSeries,
  createSeries,
  getSeries,
  startSession,
  recordInteraction,
  completeSession,
  deleteSession,
  deleteSeries,
  completeSeries
} from '../controllers/seriesController.js';
import {
  validateSeriesTitle,
  validateCardIds,
  validateInteraction,
  validatePagination
} from '../middleware/validation.js';

const router = express.Router();

router.get('/', validatePagination, getAllSeries);

router.post('/', validateSeriesTitle, createSeries);

router.get('/:seriesId', getSeries);

router.post('/:seriesId/sessions', validateCardIds, startSession);

router.post('/:seriesId/sessions/:sessionId/interactions', validateInteraction, recordInteraction);

router.put('/:seriesId/sessions/:sessionId/complete', completeSession);

router.delete('/:seriesId/sessions/:sessionId', deleteSession);

router.delete('/:seriesId', deleteSeries);

router.put('/:seriesId/complete', completeSeries);

export default router;