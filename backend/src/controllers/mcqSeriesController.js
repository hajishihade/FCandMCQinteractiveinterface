/**
 * MCQ Series Controller
 *
 * Manages MCQ study series with session tracking and progress monitoring.
 * Handles the lifecycle of MCQ series from creation to completion.
 *
 * Features:
 * - Series creation and management
 * - Session lifecycle (start, interact, complete)
 * - Question interaction recording
 * - Progress tracking per session
 * - Session validation and cleanup
 *
 * Architecture:
 * - Class-based controller with static methods
 * - Built-in validation middleware
 * - Lean queries for performance
 * - Atomic operations for data consistency
 *
 * Performance optimizations:
 * - .lean() for read-only operations
 * - Field projection to reduce payload
 * - Sorted by updatedAt for recent items first
 */

import MCQSeriesNew from '../models/MCQSeriesNew.js';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';

class MCQSeriesNewController {

  /**
   * Get all MCQ series with pagination
   *
   * @route GET /api/mcq-series
   * @query {number} limit - Items per page (default: 10)
   * @query {number} skip - Number of items to skip
   *
   * @returns {Object} Paginated series list with session counts
   *
   * @example
   * GET /api/mcq-series?limit=20&skip=0
   */
  static async getAll(req, res) {
    try {
      const { limit = 10, skip = 0 } = req.query;

      const series = await MCQSeriesNew.find()
        .lean() // Returns plain objects
        .select('title status sessions startedAt updatedAt completedAt') // Only needed fields
        .sort({ updatedAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit));

      const total = await MCQSeriesNew.countDocuments();

      res.json({
        success: true,
        data: series,
        pagination: {
          total,
          skip: parseInt(skip),
          limit: parseInt(limit),
          hasNext: parseInt(skip) + parseInt(limit) < total
        }
      });

    } catch (error) {
      logger.error('Error fetching MCQ series:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch MCQ series',
        error: error.message
      });
    }
  }

  /**
   * Get single MCQ series by ID
   *
   * @route GET /api/mcq-series/:seriesId
   * @param {string} seriesId - MongoDB ObjectId of series
   *
   * @returns {Object} Complete series object with sessions
   */
  static async getById(req, res) {
    try {
      const { seriesId } = req.params;

      const series = await MCQSeriesNew.findById(seriesId).lean(); // Safe - read-only operation

      if (!series) {
        return res.status(404).json({
          success: false,
          message: 'MCQ series not found'
        });
      }

      res.json({
        success: true,
        data: series
      });

    } catch (error) {
      logger.error('Error fetching MCQ series:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch MCQ series',
        error: error.message
      });
    }
  }

  /**
   * Create new MCQ series
   *
   * @route POST /api/mcq-series
   * @body {string} title - Series title (1-200 chars)
   *
   * @returns {Object} Created series with ID
   *
   * @example
   * POST /api/mcq-series
   * Body: { "title": "Biology Chapter 5 Review" }
   */
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { title } = req.body;

      const series = new MCQSeriesNew({ title });
      await series.save();

      res.status(201).json({
        success: true,
        message: 'MCQ series created successfully',
        data: {
          seriesId: series._id,
          title: series.title,
          status: series.status,
          startedAt: series.startedAt
        }
      });

    } catch (error) {
      logger.error('Error creating MCQ series:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create MCQ series',
        error: error.message
      });
    }
  }

  /**
   * Start new study session within series
   *
   * @route POST /api/mcq-series/:seriesId/sessions
   * @param {string} seriesId - Series ID
   * @body {Array<number>} questionIds - MCQ question IDs for session
   * @body {number} generatedFrom - Optional source question ID
   *
   * @returns {Object} Session ID and question count
   *
   * Enforces single active session per series
   */
  static async startSession(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { seriesId } = req.params;
      const { questionIds, generatedFrom } = req.body;

      const series = await MCQSeriesNew.findById(seriesId); // Cannot use .lean() - needs instance methods

      if (!series) {
        return res.status(404).json({
          success: false,
          message: 'MCQ series not found'
        });
      }

      // Check for existing active session
      const activeSession = series.getActiveSession();
      if (activeSession) {
        return res.status(400).json({
          success: false,
          message: 'An active session already exists for this series'
        });
      }

      // Create new session with questions
      const sessionId = series.getNextSessionId();
      const newSession = {
        sessionId,
        generatedFrom: generatedFrom || null,
        questions: questionIds.map(questionId => ({
          questionId: parseInt(questionId),
          interaction: null
        })),
        startedAt: new Date()
      };

      series.sessions.push(newSession);
      await series.save();

      res.status(201).json({
        success: true,
        message: 'MCQ session started successfully',
        data: {
          sessionId,
          questionCount: questionIds.length
        }
      });

    } catch (error) {
      logger.error('Error starting MCQ session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start MCQ session',
        error: error.message
      });
    }
  }

  /**
   * Record user interaction with question
   *
   * @route POST /api/mcq-series/:seriesId/sessions/:sessionId/interactions
   * @param {string} seriesId - Series ID
   * @param {number} sessionId - Session ID
   * @body {number} questionId - Question being answered
   * @body {string} selectedAnswer - User's answer (A-E)
   * @body {string} correctAnswer - Correct answer (A-E)
   * @body {string} difficulty - Perceived difficulty (Easy/Medium/Hard)
   * @body {string} confidenceWhileSolving - Confidence level (High/Low)
   * @body {number} timeSpent - Time in seconds
   *
   * @returns {Object} Correctness result
   *
   * Used for analytics and progress tracking
   */
  static async recordInteraction(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { seriesId, sessionId } = req.params;
      const {
        questionId,
        selectedAnswer,
        correctAnswer,
        difficulty,
        confidenceWhileSolving,
        timeSpent
      } = req.body;

      const series = await MCQSeriesNew.findById(seriesId); // Cannot use .lean() - modifies document

      if (!series) {
        return res.status(404).json({
          success: false,
          message: 'MCQ series not found'
        });
      }

      const session = series.sessions.find(s => s.sessionId === parseInt(sessionId));
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (session.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot record interaction on completed session'
        });
      }

      const question = session.questions.find(q => q.questionId === parseInt(questionId));
      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found in session'
        });
      }

      if (question.interaction) {
        return res.status(400).json({
          success: false,
          message: 'Interaction already recorded for this question'
        });
      }

      // Record the interaction
      const isCorrect = selectedAnswer === correctAnswer;

      question.interaction = {
        selectedAnswer,
        isCorrect,
        difficulty,
        confidenceWhileSolving,
        timeSpent
      };

      await series.save();

      res.json({
        success: true,
        message: 'Interaction recorded successfully',
        data: {
          isCorrect,
          correctAnswer
        }
      });

    } catch (error) {
      logger.error('Error recording interaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record interaction',
        error: error.message
      });
    }
  }

  /**
   * Complete active study session
   *
   * @route POST /api/mcq-series/:seriesId/sessions/:sessionId/complete
   * @param {string} seriesId - Series ID
   * @param {number} sessionId - Session ID
   *
   * @returns {Object} Success confirmation
   *
   * Validates all questions have been answered
   */
  static async completeSession(req, res) {
    try {
      const { seriesId, sessionId } = req.params;

      const series = await MCQSeriesNew.findById(seriesId); // Cannot use .lean() - modifies document

      if (!series) {
        return res.status(404).json({
          success: false,
          message: 'MCQ series not found'
        });
      }

      const session = series.sessions.find(s => s.sessionId === parseInt(sessionId));
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (session.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Session already completed'
        });
      }

      // Check if all questions have interactions
      const unansweredQuestions = session.questions.filter(q => !q.interaction);
      if (unansweredQuestions.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot complete session with unanswered questions',
          unansweredCount: unansweredQuestions.length
        });
      }

      session.status = 'completed';
      session.completedAt = new Date();

      await series.save();

      res.json({
        success: true,
        message: 'Session completed successfully'
      });

    } catch (error) {
      logger.error('Error completing session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete session',
        error: error.message
      });
    }
  }

  static async completeSeries(req, res) {
    try {
      const { seriesId } = req.params;

      const series = await MCQSeriesNew.findById(seriesId); // Cannot use .lean() - modifies document

      if (!series) {
        return res.status(404).json({
          success: false,
          message: 'MCQ series not found'
        });
      }

      if (series.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Series already completed'
        });
      }

      series.status = 'completed';
      series.completedAt = new Date();

      await series.save();

      res.json({
        success: true,
        message: 'Series completed successfully'
      });

    } catch (error) {
      logger.error('Error completing series:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete series',
        error: error.message
      });
    }
  }

  /**
   * Delete incomplete session
   *
   * @route DELETE /api/mcq-series/:seriesId/sessions/:sessionId
   * @param {string} seriesId - Series ID
   * @param {number} sessionId - Session ID
   *
   * @returns {Object} Deletion status and remaining sessions
   *
   * Deletes series if last session removed
   * Cannot delete completed sessions
   */
  static async deleteSession(req, res) {
    try {
      const { seriesId, sessionId } = req.params;

      const series = await MCQSeriesNew.findById(seriesId); // Cannot use .lean() - modifies document

      if (!series) {
        return res.status(404).json({
          success: false,
          message: 'MCQ series not found'
        });
      }

      const sessionIndex = series.sessions.findIndex(s => s.sessionId === parseInt(sessionId));
      if (sessionIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      const session = series.sessions[sessionIndex];
      if (session.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete completed session'
        });
      }

      // Remove the session from the array
      series.sessions.splice(sessionIndex, 1);

      // If this was the last session, delete the entire series
      if (series.sessions.length === 0) {
        await MCQSeriesNew.findByIdAndDelete(series._id);

        res.json({
          success: true,
          message: 'Session deleted and series removed (no sessions remaining)',
          data: {
            deletedSeriesId: series._id,
            deletedSessionId: parseInt(sessionId),
            seriesDeleted: true
          }
        });
      } else {
        // Save the series with remaining sessions
        await series.save();

        res.json({
          success: true,
          message: 'Session deleted successfully',
          data: {
            seriesId: series._id,
            deletedSessionId: parseInt(sessionId),
            remainingSessions: series.sessions.length,
            seriesDeleted: false
          }
        });
      }

    } catch (error) {
      logger.error('Error deleting session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete session',
        error: error.message
      });
    }
  }

  /**
   * Delete entire MCQ series
   *
   * @route DELETE /api/mcq-series/:seriesId
   * @param {string} seriesId - Series ID to delete
   *
   * @returns {Object} Deletion confirmation
   *
   * Removes series and all associated sessions
   */
  static async deleteSeries(req, res) {
    try {
      const { seriesId } = req.params;

      const series = await MCQSeriesNew.findById(seriesId).lean(); // Safe - only checking existence
      if (!series) {
        return res.status(404).json({
          success: false,
          message: 'MCQ series not found'
        });
      }

      // Delete the entire series
      await MCQSeriesNew.findByIdAndDelete(seriesId);

      res.json({
        success: true,
        message: 'MCQ series deleted successfully',
        data: {
          deletedSeriesId: seriesId
        }
      });

    } catch (error) {
      logger.error('Error deleting series:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete series',
        error: error.message
      });
    }
  }
}

// Validation middleware
MCQSeriesNewController.createValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .notEmpty()
    .withMessage('Title is required')
];

MCQSeriesNewController.startSessionValidation = [
  body('questionIds')
    .isArray({ min: 1 })
    .withMessage('questionIds must be a non-empty array'),
  body('questionIds.*')
    .custom((value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 0) {
        throw new Error('Each questionId must be a non-negative integer');
      }
      return true;
    }),
  body('generatedFrom')
    .optional()
    .custom((value) => {
      if (value !== null && value !== undefined) {
        const num = parseInt(value);
        if (isNaN(num) || num < 1) {
          throw new Error('generatedFrom must be a positive integer');
        }
      }
      return true;
    })
];

MCQSeriesNewController.recordInteractionValidation = [
  body('questionId')
    .isInt({ min: 0 })
    .withMessage('questionId must be a non-negative integer'),
  body('selectedAnswer')
    .isIn(['A', 'B', 'C', 'D', 'E'])
    .withMessage('selectedAnswer must be one of A, B, C, D, E'),
  body('correctAnswer')
    .isIn(['A', 'B', 'C', 'D', 'E'])
    .withMessage('correctAnswer must be one of A, B, C, D, E'),
  body('difficulty')
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('difficulty must be Easy, Medium, or Hard'),
  body('confidenceWhileSolving')
    .isIn(['High', 'Low'])
    .withMessage('confidenceWhileSolving must be High or Low'),
  body('timeSpent')
    .isInt({ min: 1 })
    .withMessage('timeSpent must be a positive integer')
];

export default MCQSeriesNewController;