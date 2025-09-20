import MCQ from '../models/MCQ.js';

class MCQController {

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

      const mcqs = await MCQ.find(filter)
        .lean() // Returns plain objects instead of Mongoose documents
        .select('questionId question subject chapter section source tags correctAnswer') // Only return needed fields
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .sort({ questionId: 1 });

      const total = await MCQ.countDocuments(filter);

      res.json({
        success: true,
        data: mcqs,
        pagination: {
          total,
          skip: parseInt(skip),
          limit: parseInt(limit),
          hasNext: parseInt(skip) + parseInt(limit) < total
        }
      });

    } catch (error) {
      console.error('Error fetching MCQs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch MCQs',
        error: error.message
      });
    }
  }

  static async getById(req, res) {
    try {
      const { questionId } = req.params;

      const mcq = await MCQ.findOne({ questionId: parseInt(questionId) }).lean();

      if (!mcq) {
        return res.status(404).json({
          success: false,
          message: 'MCQ not found'
        });
      }

      res.json({
        success: true,
        data: mcq
      });

    } catch (error) {
      console.error('Error fetching MCQ:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch MCQ',
        error: error.message
      });
    }
  }

  static async getByIds(req, res) {
    try {
      const { questionIds } = req.body;

      if (!Array.isArray(questionIds) || questionIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'questionIds must be a non-empty array'
        });
      }

      const mcqs = await MCQ.find({
        questionId: { $in: questionIds.map(id => parseInt(id)) }
      }).lean().sort({ questionId: 1 });

      // Ensure all requested MCQs were found
      if (mcqs.length !== questionIds.length) {
        const foundIds = mcqs.map(mcq => mcq.questionId);
        const missingIds = questionIds.filter(id => !foundIds.includes(parseInt(id)));

        return res.status(404).json({
          success: false,
          message: 'Some MCQs not found',
          missingIds
        });
      }

      res.json({
        success: true,
        data: mcqs
      });

    } catch (error) {
      console.error('Error fetching MCQs by IDs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch MCQs',
        error: error.message
      });
    }
  }

  static async getFilterOptions(req, res) {
    try {
      const [subjects, chapters, sections, sources, tags] = await Promise.all([
        MCQ.distinct('subject'),
        MCQ.distinct('chapter'),
        MCQ.distinct('section'),
        MCQ.distinct('source'),
        MCQ.distinct('tags')
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
        MCQ.countDocuments(),
        MCQ.aggregate([
          { $group: { _id: '$subject', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        MCQ.aggregate([
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
      console.error('Error fetching MCQ stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch MCQ stats',
        error: error.message
      });
    }
  }
}

export default MCQController;