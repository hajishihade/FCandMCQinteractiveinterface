import TableQuiz from '../models/TableQuiz.js';

class TableQuizController {

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

  static async getByIds(req, res) {
    try {
      const { tableIds } = req.body;

      if (!Array.isArray(tableIds) || tableIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'tableIds must be a non-empty array'
        });
      }

      const tableQuizzes = await TableQuiz.find({
        tableId: { $in: tableIds.map(id => parseInt(id)) }
      }).sort({ tableId: 1 });

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