import express from 'express';
import TableQuizController from '../controllers/tableQuizController.js';

const router = express.Router();

/**
 * @route   GET /api/table-quizzes
 * @desc    Get all table quizzes with filtering and pagination
 * @access  Public
 * @params  ?limit=50&skip=0&search=&subject=&chapter=&section=&tags=&source=
 */
router.get('/', TableQuizController.getAll);

/**
 * @route   GET /api/table-quizzes/stats
 * @desc    Get table quiz statistics
 * @access  Public
 */
router.get('/stats', TableQuizController.getStats);

/**
 * @route   GET /api/table-quizzes/filter-options
 * @desc    Get available filter options (subjects, chapters, etc.)
 * @access  Public
 */
router.get('/filter-options', TableQuizController.getFilterOptions);

/**
 * @route   POST /api/table-quizzes/batch
 * @desc    Get multiple table quizzes by table IDs
 * @access  Public
 * @body    { tableIds: [1, 2, 3] }
 */
router.post('/batch', TableQuizController.getByIds);

/**
 * @route   GET /api/table-quizzes/:tableId
 * @desc    Get single table quiz by table ID
 * @access  Public
 */
router.get('/:tableId', TableQuizController.getById);

export default router;