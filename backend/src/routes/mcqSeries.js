import express from 'express';
import MCQSeriesController from '../controllers/mcqSeriesController.js';

const router = express.Router();

/**
 * @route   GET /api/mcq-series
 * @desc    Get all MCQ series with pagination
 * @access  Public
 * @params  ?limit=10&skip=0
 */
router.get('/', MCQSeriesController.getAll);

/**
 * @route   POST /api/mcq-series
 * @desc    Create a new MCQ series
 * @access  Public
 * @body    { title: "Series Title" }
 */
router.post('/', MCQSeriesController.createValidation, MCQSeriesController.create);

/**
 * @route   GET /api/mcq-series/:seriesId
 * @desc    Get MCQ series by ID
 * @access  Public
 */
router.get('/:seriesId', MCQSeriesController.getById);

/**
 * @route   PUT /api/mcq-series/:seriesId/complete
 * @desc    Mark MCQ series as completed
 * @access  Public
 */
router.put('/:seriesId/complete', MCQSeriesController.completeSeries);

/**
 * @route   POST /api/mcq-series/:seriesId/sessions
 * @desc    Start a new MCQ session
 * @access  Public
 * @body    { questionIds: [1, 2, 3], generatedFrom?: 1 }
 */
router.post('/:seriesId/sessions',
  MCQSeriesController.startSessionValidation,
  MCQSeriesController.startSession
);

/**
 * @route   POST /api/mcq-series/:seriesId/sessions/:sessionId/interactions
 * @desc    Record an MCQ interaction (answer)
 * @access  Public
 * @body    {
 *            questionId: 1,
 *            selectedAnswer: "A",
 *            correctAnswer: "B",
 *            difficulty: "Medium",
 *            confidenceWhileSolving: "High",
 *            timeSpent: 45
 *          }
 */
router.post('/:seriesId/sessions/:sessionId/interactions',
  MCQSeriesController.recordInteractionValidation,
  MCQSeriesController.recordInteraction
);

/**
 * @route   PUT /api/mcq-series/:seriesId/sessions/:sessionId/complete
 * @desc    Mark MCQ session as completed
 * @access  Public
 */
router.put('/:seriesId/sessions/:sessionId/complete', MCQSeriesController.completeSession);

/**
 * @route   DELETE /api/mcq-series/:seriesId/sessions/:sessionId
 * @desc    Delete an MCQ session (only if active)
 * @access  Public
 */
router.delete('/:seriesId/sessions/:sessionId', MCQSeriesController.deleteSession);

/**
 * @route   DELETE /api/mcq-series/:seriesId
 * @desc    Delete entire MCQ series
 * @access  Public
 */
router.delete('/:seriesId', MCQSeriesController.deleteSeries);

export default router;