import TableSeries from '../models/TableSeries.js';
import { body, validationResult } from 'express-validator';

class TableSeriesController {

  static async getAll(req, res) {
    try {
      const { limit = 10, skip = 0 } = req.query;

      const series = await TableSeries.find()
        .sort({ updatedAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit));

      const total = await TableSeries.countDocuments();

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
      console.error('Error fetching table series:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch table series',
        error: error.message
      });
    }
  }

  /**
   * Get single table series by ID
   *
   * @route GET /api/table-series/:seriesId
   * @param {string} seriesId - MongoDB ObjectId
   *
   * @returns {Object} Complete series with sessions
   */
  static async getById(req, res) {
    try {
      const { seriesId } = req.params;

      // ⚠️ IMPROVEMENT: Should add .lean() for read-only operation
      const series = await TableSeries.findById(seriesId).lean();

      if (!series) {
        return res.status(404).json({
          success: false,
          message: 'Table series not found'
        });
      }

      res.json({
        success: true,
        data: series
      });

    } catch (error) {
      console.error('Error fetching table series:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch table series',
        error: error.message
      });
    }
  }

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

      const series = new TableSeries({ title });
      await series.save();

      res.status(201).json({
        success: true,
        message: 'Table series created successfully',
        data: {
          seriesId: series._id,
          title: series.title,
          status: series.status,
          startedAt: series.startedAt
        }
      });

    } catch (error) {
      console.error('Error creating table series:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create table series',
        error: error.message
      });
    }
  }

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
      const { tableIds, generatedFrom } = req.body;

      const series = await TableSeries.findById(seriesId);

      if (!series) {
        return res.status(404).json({
          success: false,
          message: 'Table series not found'
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

      // Create new session with tables
      const sessionId = series.getNextSessionId();
      const newSession = {
        sessionId,
        generatedFrom: generatedFrom || null,
        tables: tableIds.map(tableId => ({
          tableId: parseInt(tableId),
          interaction: null
        })),
        startedAt: new Date()
      };

      series.sessions.push(newSession);
      await series.save();

      res.status(201).json({
        success: true,
        message: 'Table session started successfully',
        data: {
          sessionId,
          tableCount: tableIds.length
        }
      });

    } catch (error) {
      console.error('Error starting table session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start table session',
        error: error.message
      });
    }
  }

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
        tableId,
        userGrid,
        results,
        difficulty,
        confidenceWhileSolving,
        timeSpent
      } = req.body;

      const series = await TableSeries.findById(seriesId);

      if (!series) {
        return res.status(404).json({
          success: false,
          message: 'Table series not found'
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

      const table = session.tables.find(t => t.tableId === parseInt(tableId));
      if (!table) {
        return res.status(404).json({
          success: false,
          message: 'Table not found in session'
        });
      }

      if (table.interaction) {
        return res.status(400).json({
          success: false,
          message: 'Interaction already recorded for this table'
        });
      }

      // Record the interaction
      table.interaction = {
        userGrid,
        results,
        difficulty,
        confidenceWhileSolving,
        timeSpent
      };

      await series.save();

      res.json({
        success: true,
        message: 'Interaction recorded successfully',
        data: {
          accuracy: results.accuracy,
          correctPlacements: results.correctPlacements,
          totalCells: results.totalCells
        }
      });

    } catch (error) {
      console.error('Error recording interaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record interaction',
        error: error.message
      });
    }
  }

  static async completeSession(req, res) {
    try {
      const { seriesId, sessionId } = req.params;

      const series = await TableSeries.findById(seriesId);

      if (!series) {
        return res.status(404).json({
          success: false,
          message: 'Table series not found'
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

      // Check if all tables have interactions
      const unansweredTables = session.tables.filter(t => !t.interaction);
      if (unansweredTables.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot complete session with unanswered tables',
          unansweredCount: unansweredTables.length
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
      console.error('Error completing session:', error);
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

      const series = await TableSeries.findById(seriesId);

      if (!series) {
        return res.status(404).json({
          success: false,
          message: 'Table series not found'
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
      console.error('Error completing series:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete series',
        error: error.message
      });
    }
  }

  static async deleteSession(req, res) {
    try {
      const { seriesId, sessionId } = req.params;

      const series = await TableSeries.findById(seriesId);

      if (!series) {
        return res.status(404).json({
          success: false,
          message: 'Table series not found'
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
        await TableSeries.findByIdAndDelete(series._id);

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
      console.error('Error deleting session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete session',
        error: error.message
      });
    }
  }

  static async deleteSeries(req, res) {
    try {
      const { seriesId } = req.params;

      const series = await TableSeries.findById(seriesId);
      if (!series) {
        return res.status(404).json({
          success: false,
          message: 'Table series not found'
        });
      }

      // Delete the entire series
      await TableSeries.findByIdAndDelete(seriesId);

      res.json({
        success: true,
        message: 'Table series deleted successfully',
        data: {
          deletedSeriesId: seriesId
        }
      });

    } catch (error) {
      console.error('Error deleting series:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete series',
        error: error.message
      });
    }
  }
}

// Validation middleware
TableSeriesController.createValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .notEmpty()
    .withMessage('Title is required')
];

TableSeriesController.startSessionValidation = [
  body('tableIds')
    .isArray({ min: 1 })
    .withMessage('tableIds must be a non-empty array'),
  body('tableIds.*')
    .custom((value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 0) {
        throw new Error('Each tableId must be a non-negative integer');
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

TableSeriesController.recordInteractionValidation = [
  body('tableId')
    .isInt({ min: 0 })
    .withMessage('tableId must be a non-negative integer'),
  body('userGrid')
    .isArray()
    .withMessage('userGrid must be an array'),
  body('results.correctPlacements')
    .isInt({ min: 0 })
    .withMessage('results.correctPlacements must be a non-negative integer'),
  body('results.totalCells')
    .isInt({ min: 1 })
    .withMessage('results.totalCells must be a positive integer'),
  body('results.accuracy')
    .isInt({ min: 0, max: 100 })
    .withMessage('results.accuracy must be between 0 and 100'),
  body('results.wrongPlacements')
    .isArray()
    .withMessage('results.wrongPlacements must be an array'),
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

export default TableSeriesController;