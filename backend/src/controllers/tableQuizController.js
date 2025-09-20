/**
 * Table Quiz Controller
 *
 * Manages table-based quiz content retrieval and filtering.
 * Provides endpoints for fetching table quizzes with search and statistics.
 *
 * Features:
 * - Advanced filtering with regex patterns
 * - Full-text search capability
 * - Batch fetching by multiple IDs
 * - Filter options extraction
 * - Statistical aggregations
 *
 * Performance optimizations:
 * - Uses .lean() for read-only operations
 * - Field projection to reduce payload
 * - Parallel aggregation queries
 *
 * ⚠️ IMPROVEMENT NEEDED: getByIds method missing .lean()
 */

import TableQuiz from '../models/TableQuiz.js';

class TableQuizController {

  /**
   * Get all table quizzes with filtering and pagination
   *
   * @route GET /api/table-quizzes
   * @query {number} limit - Items per page (default: 50)
   * @query {number} skip - Number of items to skip
   * @query {string} search - Full-text search term
   * @query {string} subject - Filter by subject
   * @query {string} chapter - Filter by chapter
   * @query {string} section - Filter by section
   * @query {string} tags - Comma-separated tags
   * @query {string} source - Filter by source
   *
   * @returns {Object} Paginated table quiz list
   */
  static async getAll(req, res) {
    try {
      const {
        limit = 50,
        skip = 0,
        search = '',
        subject = '',
        chapter = '',
        section = '',
        tags = '',
        source = ''
      } = req.query;

      // Build filter object
      const filter = {};

      // Text search
      if (search) {
        filter.$text = { $search: search };
      }

      // Category filters
      if (subject) filter.subject = new RegExp(subject, 'i');
      if (chapter) filter.chapter = new RegExp(chapter, 'i');
      if (section) filter.section = new RegExp(section, 'i');
      if (source) filter.source = new RegExp(source, 'i');

      // Tags filter
      if (tags) {
        const tagArray = tags.split(',').map(tag => new RegExp(tag.trim(), 'i'));
        filter.tags = { $in: tagArray };
      }

      const tableQuizzes = await TableQuiz.find(filter)
        .lean() // Returns plain objects
        .select('tableId name subject chapter section source tags') // Only needed fields
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .sort({ tableId: 1 });

      const total = await TableQuiz.countDocuments(filter);

      res.json({
        success: true,
        data: tableQuizzes,
        pagination: {
          total,
          skip: parseInt(skip),
          limit: parseInt(limit),
          hasNext: parseInt(skip) + parseInt(limit) < total
        }
      });

    } catch (error) {
      console.error('Error fetching table quizzes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch table quizzes',
        error: error.message
      });
    }
  }

  /**
   * Get single table quiz by ID
   *
   * @route GET /api/table-quizzes/:tableId
   * @param {number} tableId - Unique table quiz identifier
   *
   * @returns {Object} Complete table quiz object
   */
  static async getById(req, res) {
    try {
      const { tableId } = req.params;

      const tableQuiz = await TableQuiz.findOne({ tableId: parseInt(tableId) }).lean();

      if (!tableQuiz) {
        return res.status(404).json({
          success: false,
          message: 'Table quiz not found'
        });
      }

      res.json({
        success: true,
        data: tableQuiz
      });

    } catch (error) {
      console.error('Error fetching table quiz:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch table quiz',
        error: error.message
      });
    }
  }

  /**
   * Get multiple table quizzes by IDs (batch fetch)
   *
   * @route POST /api/table-quizzes/batch
   * @body {Array<number>} tableIds - Array of table quiz IDs
   *
   * @returns {Object} Array of table quiz objects
   *
   * ⚠️ PERFORMANCE: Should add .lean() to query
   */
  static async getByIds(req, res) {
    try {
      const { tableIds } = req.body;

      if (!Array.isArray(tableIds) || tableIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'tableIds must be a non-empty array'
        });
      }

      // IMPROVEMENT: Add .lean() for better performance
      const tableQuizzes = await TableQuiz.find({
        tableId: { $in: tableIds.map(id => parseInt(id)) }
      }).lean().sort({ tableId: 1 });

      // Ensure all requested table quizzes were found
      if (tableQuizzes.length !== tableIds.length) {
        const foundIds = tableQuizzes.map(table => table.tableId);
        const missingIds = tableIds.filter(id => !foundIds.includes(parseInt(id)));

        return res.status(404).json({
          success: false,
          message: 'Some table quizzes not found',
          missingIds
        });
      }

      res.json({
        success: true,
        data: tableQuizzes
      });

    } catch (error) {
      console.error('Error fetching table quizzes by IDs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch table quizzes',
        error: error.message
      });
    }
  }

  /**
   * Get available filter options from database
   *
   * @route GET /api/table-quizzes/filter-options
   *
   * @returns {Object} Available filter values for dropdowns
   *
   * Extracts distinct values for all filterable fields
   */
  static async getFilterOptions(req, res) {
    try {
      const [subjects, chapters, sections, sources, tags] = await Promise.all([
        TableQuiz.distinct('subject'),
        TableQuiz.distinct('chapter'),
        TableQuiz.distinct('section'),
        TableQuiz.distinct('source'),
        TableQuiz.distinct('tags')
      ]);

      res.json({
        success: true,
        data: {
          subjects: subjects.filter(s => s && s.trim().length > 0).sort(),
          chapters: chapters.filter(c => c && c.trim().length > 0).sort(),
          sections: sections.filter(s => s && s.trim().length > 0).sort(),
          sources: sources.filter(s => s && s.trim().length > 0).sort(),
          tags: tags.filter(t => t && t.trim().length > 0).sort()
        }
      });

    } catch (error) {
      console.error('Error fetching filter options:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch filter options',
        error: error.message
      });
    }
  }

  /**
   * Get statistical data about table quizzes
   *
   * @route GET /api/table-quizzes/stats
   *
   * @returns {Object} Statistics including counts by subject and source
   *
   * Uses MongoDB aggregation pipeline for efficient counting
   */
  static async getStats(req, res) {
    try {
      const [total, bySubject, bySource] = await Promise.all([
        TableQuiz.countDocuments(),
        TableQuiz.aggregate([
          { $group: { _id: '$subject', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        TableQuiz.aggregate([
          { $group: { _id: '$source', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      ]);

      res.json({
        success: true,
        data: {
          total,
          bySubject,
          bySource
        }
      });

    } catch (error) {
      console.error('Error fetching table quiz stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch table quiz stats',
        error: error.message
      });
    }
  }
}

export default TableQuizController;