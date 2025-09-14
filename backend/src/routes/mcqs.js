import express from 'express';
import MCQController from '../controllers/mcqController.js';

const router = express.Router();

/**
 * @route   GET /api/mcqs
 * @desc    Get all MCQs with filtering and pagination
 * @access  Public
 * @params  ?limit=50&skip=0&search=&subject=&chapter=&section=&tags=&source=
 */
router.get('/', MCQController.getAll);

/**
 * @route   GET /api/mcqs/stats
 * @desc    Get MCQ statistics
 * @access  Public
 */
router.get('/stats', MCQController.getStats);

/**
 * @route   GET /api/mcqs/filter-options
 * @desc    Get available filter options (subjects, chapters, etc.)
 * @access  Public
 */
router.get('/filter-options', MCQController.getFilterOptions);

/**
 * @route   POST /api/mcqs/batch
 * @desc    Get multiple MCQs by question IDs
 * @access  Public
 * @body    { questionIds: [1, 2, 3] }
 */
router.post('/batch', MCQController.getByIds);

/**
 * @route   GET /api/mcqs/:questionId
 * @desc    Get single MCQ by question ID
 * @access  Public
 */
router.get('/:questionId', MCQController.getById);

export default router;