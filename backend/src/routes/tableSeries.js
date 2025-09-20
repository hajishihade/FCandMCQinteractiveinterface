import express from 'express';
import TableSeriesController from '../controllers/tableSeriesController.js';

const router = express.Router();

/**
 * @route   GET /api/table-series
 * @desc    Get all table series with pagination
 * @access  Public
 * @params  ?limit=10&skip=0
 */
router.get('/', TableSeriesController.getAll);

/**
 * @route   POST /api/table-series
 * @desc    Create a new table series
 * @access  Public
 * @body    { title: "Series Title" }
 */
router.post('/', TableSeriesController.createValidation, TableSeriesController.create);

/**
 * @route   GET /api/table-series/:seriesId
 * @desc    Get table series by ID
 * @access  Public
 */
router.get('/:seriesId', TableSeriesController.getById);

/**
 * @route   PUT /api/table-series/:seriesId/complete
 * @desc    Mark table series as completed
 * @access  Public
 */
router.put('/:seriesId/complete', TableSeriesController.completeSeries);

/**
 * @route   POST /api/table-series/:seriesId/sessions
 * @desc    Start a new table session
 * @access  Public
 * @body    { tableIds: [1, 2, 3], generatedFrom?: 1 }
 */
router.post('/:seriesId/sessions',
  TableSeriesController.startSessionValidation,
  TableSeriesController.startSession
);

/**
 * @route   POST /api/table-series/:seriesId/sessions/:sessionId/interactions
 * @desc    Record a table interaction (placement results)
 * @access  Public
 * @body    {
 *            tableId: 1,
 *            userGrid: [["cell1", "cell2"], ["cell3", "cell4"]],
 *            results: {
 *              correctPlacements: 3,
 *              totalCells: 4,
 *              accuracy: 75,
 *              wrongPlacements: [...]
 *            },
 *            difficulty: "Medium",
 *            confidenceWhileSolving: "High",
 *            timeSpent: 120
 *          }
 */
router.post('/:seriesId/sessions/:sessionId/interactions',
  TableSeriesController.recordInteractionValidation,
  TableSeriesController.recordInteraction
);

/**
 * @route   PUT /api/table-series/:seriesId/sessions/:sessionId/complete
 * @desc    Mark table session as completed
 * @access  Public
 */
router.put('/:seriesId/sessions/:sessionId/complete', TableSeriesController.completeSession);

/**
 * @route   DELETE /api/table-series/:seriesId/sessions/:sessionId
 * @desc    Delete a table session (only if active)
 * @access  Public
 */
router.delete('/:seriesId/sessions/:sessionId', TableSeriesController.deleteSession);

/**
 * @route   DELETE /api/table-series/:seriesId
 * @desc    Delete entire table series
 * @access  Public
 */
router.delete('/:seriesId', TableSeriesController.deleteSeries);

export default router;