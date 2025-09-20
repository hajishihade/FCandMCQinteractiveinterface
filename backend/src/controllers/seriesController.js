import FlashcardSeries from '../models/FlashcardSeries.js';
import Flashcard from '../models/Flashcard.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const getAllFlashcardSeries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination || { page: 1, limit: 10, skip: 0 };
  const { status, search, subject, chapter, section } = req.query;

  let query = {};

  // Filter by status
  if (status && ['active', 'completed'].includes(status)) {
    query.status = status;
  }

  // Search by title
  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  let series = await FlashcardSeries.find(query).sort({ startedAt: -1 });

  // Content-based filtering (subject, chapter, section)
  if (subject || chapter || section) {
    console.log(`Filtering series by content: subject=${subject}, chapter=${chapter}, section=${section}`);

    // For each series, check if any of its sessions contain flashcards matching the criteria
    const filteredFlashcardSeries = [];

    for (const seriesItem of series) {
      // Extract all cardIds from all sessions in this series
      const allCardIds = [];
      seriesItem.sessions.forEach(session => {
        if (session.cards && Array.isArray(session.cards)) {
          session.cards.forEach(card => {
            if (typeof card.cardId === 'number') {
              allCardIds.push(card.cardId);
            }
          });
        }
      });

      if (allCardIds.length > 0) {
        // Remove duplicates
        const uniqueCardIds = [...new Set(allCardIds)];

        // Fetch flashcard metadata for these cardIds
        const flashcards = await Flashcard.findByCardIds(uniqueCardIds);

        // Check if any flashcard matches the filter criteria
        const hasMatchingContent = flashcards.some(flashcard => {
          let matches = true;

          if (subject) {
            matches = matches && flashcard.subject && flashcard.subject.toLowerCase().includes(subject.toLowerCase());
          }

          if (chapter) {
            matches = matches && flashcard.chapter && flashcard.chapter.toLowerCase().includes(chapter.toLowerCase());
          }

          if (section) {
            matches = matches && flashcard.section && flashcard.section.toLowerCase().includes(section.toLowerCase());
          }

          return matches;
        });

        if (hasMatchingContent) {
          filteredFlashcardSeries.push(seriesItem);
        }
      }
    }

    console.log(`Content filtering: ${series.length} total series → ${filteredFlashcardSeries.length} matching series`);
    series = filteredFlashcardSeries;
  }

  // Apply pagination to filtered results
  const total = series.length;
  const paginatedFlashcardSeries = series.slice(skip, skip + limit);

  // Add session count to each series
  const seriesWithCounts = paginatedFlashcardSeries.map(s => ({
    ...s.toObject(),
    sessionCount: s.sessions.length,
    completedSessions: s.sessions.filter(session => session.status === 'completed').length
  }));

  res.status(200).json({
    success: true,
    message: 'FlashcardSeries retrieved successfully',
    data: seriesWithCounts,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit
    },
    filters: {
      applied: { subject, chapter, section },
      totalBeforeFiltering: subject || chapter || section ? await FlashcardSeries.countDocuments(query) : total
    }
  });
});

const createFlashcardSeries = asyncHandler(async (req, res) => {
  const { title } = req.body;

  const seriesData = {
    title,
    sessions: [],
    status: 'active'
  };

  const series = new FlashcardSeries(seriesData);
  await series.save();

  res.status(201).json({
    success: true,
    message: 'FlashcardSeries created successfully',
    data: {
      seriesId: series._id,
      title: series.title,
      status: series.status,
      startedAt: series.startedAt,
      sessions: series.sessions
    }
  });
});

const getFlashcardSeries = asyncHandler(async (req, res) => {
  try {
    const { seriesId } = req.params;

    const series = await FlashcardSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'FlashcardSeries not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'FlashcardSeries retrieved successfully',
      data: series
    });

  } catch (error) {
    console.error('Error retrieving series:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

const startSession = asyncHandler(async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { cardIds, generatedFrom = null } = req.body;

    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Card IDs are required and must be a non-empty array'
      });
    }

    const series = await FlashcardSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'FlashcardSeries not found'
      });
    }

    const numericCardIds = cardIds.map(id => parseInt(id));
    const existingCards = await Flashcard.findByCardIds(numericCardIds);

    if (existingCards.length !== cardIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some card IDs are invalid'
      });
    }

    // ENFORCE: Only one active session per series
    // Complete any existing active sessions before creating new one
    const activeSessions = series.sessions.filter(s => s.status === 'active');
    if (activeSessions.length > 0) {
      activeSessions.forEach(session => {
        session.status = 'completed';
        session.completedAt = new Date();
      });
      await series.save();
    }

    // Create card objects without interactions initially
    const initialCards = numericCardIds.map(cardId => ({
      cardId: cardId,
      interaction: null // No interaction yet
    }));

    const sessionData = {
      cards: initialCards,
      status: 'active',
      generatedFrom
    };

    await series.addSession(sessionData);

    const newSession = series.sessions[series.sessions.length - 1];

    res.status(201).json({
      success: true,
      message: 'Session started successfully',
      data: {
        seriesId: series._id,
        sessionId: newSession.sessionId,
        startedAt: newSession.startedAt,
        status: newSession.status,
        generatedFrom: newSession.generatedFrom,
        selectedCards: existingCards.map(card => ({
          cardId: card.cardId,
          frontText: card.frontText,
          backText: card.backText,
          subject: card.subject
        }))
      }
    });

  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

const recordInteraction = asyncHandler(async (req, res) => {
  try {
    const { seriesId, sessionId } = req.params;
    const { cardId, result, difficulty, confidenceWhileSolving, timeSpent } = req.body;

    if (cardId === undefined || !result || !difficulty || !confidenceWhileSolving || timeSpent === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All interaction fields are required: cardId, result, difficulty, confidenceWhileSolving, timeSpent'
      });
    }

    const series = await FlashcardSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'FlashcardSeries not found'
      });
    }

    const session = series.getSession(parseInt(sessionId));
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot record interaction on completed session'
      });
    }

    const interactionData = {
      result,
      difficulty,
      confidenceWhileSolving,
      timeSpent: parseInt(timeSpent)
    };

    await series.addCardInteraction(parseInt(sessionId), parseInt(cardId), interactionData);

    res.status(200).json({
      success: true,
      message: 'Interaction recorded successfully',
      data: {
        seriesId: series._id,
        sessionId: parseInt(sessionId),
        cardId: parseInt(cardId),
        interaction: interactionData
      }
    });

  } catch (error) {
    console.error('Error recording interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

const completeSession = asyncHandler(async (req, res) => {
  try {
    const { seriesId, sessionId } = req.params;

    const series = await FlashcardSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'FlashcardSeries not found'
      });
    }

    const session = series.getSession(parseInt(sessionId));
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session is already completed'
      });
    }

    await series.completeSession(parseInt(sessionId));

    const updatedSession = series.getSession(parseInt(sessionId));

    res.status(200).json({
      success: true,
      message: 'Session completed successfully',
      data: {
        seriesId: series._id,
        sessionId: updatedSession.sessionId,
        status: updatedSession.status,
        startedAt: updatedSession.startedAt,
        completedAt: updatedSession.completedAt,
        totalCards: updatedSession.cards.length
      }
    });

  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

const deleteSession = asyncHandler(async (req, res) => {
  try {
    const { seriesId, sessionId } = req.params;

    const series = await FlashcardSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'FlashcardSeries not found'
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
      await FlashcardSeries.findByIdAndDelete(series._id);

      res.status(200).json({
        success: true,
        message: 'Session deleted and series removed (no sessions remaining)',
        data: {
          deletedFlashcardSeriesId: series._id,
          deletedSessionId: parseInt(sessionId),
          seriesDeleted: true
        }
      });
    } else {
      // Save the series with remaining sessions
      await series.save();

      res.status(200).json({
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
      message: 'Internal server error'
    });
  }
});

const deleteFlashcardSeries = asyncHandler(async (req, res) => {
  try {
    const { seriesId } = req.params;

    const series = await FlashcardSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'FlashcardSeries not found'
      });
    }

    // Delete the entire series
    await FlashcardSeries.findByIdAndDelete(seriesId);

    res.status(200).json({
      success: true,
      message: 'FlashcardSeries deleted successfully',
      data: {
        deletedFlashcardSeriesId: seriesId
      }
    });

  } catch (error) {
    console.error('Error deleting series:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

const completeFlashcardSeries = asyncHandler(async (req, res) => {
  try {
    const { seriesId } = req.params;

    const series = await FlashcardSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'FlashcardSeries not found'
      });
    }

    if (series.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'FlashcardSeries is already completed'
      });
    }

    await series.completeFlashcardSeries();

    res.status(200).json({
      success: true,
      message: 'FlashcardSeries completed successfully',
      data: {
        seriesId: series._id,
        status: series.status,
        startedAt: series.startedAt,
        completedAt: series.completedAt,
        totalSessions: series.sessions.length
      }
    });

  } catch (error) {
    console.error('Error completing series:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

const getFilterOptions = asyncHandler(async (req, res) => {
  try {
    // Get all unique subjects, chapters, and sections from flashcards
    const [subjects, chapters, sections] = await Promise.all([
      Flashcard.distinct('subject'),
      Flashcard.distinct('chapter'),
      Flashcard.distinct('section')
    ]);

    res.status(200).json({
      success: true,
      message: 'Filter options retrieved successfully',
      data: {
        subjects: subjects.filter(s => s && s.trim().length > 0).sort(),
        chapters: chapters.filter(c => c && c.trim().length > 0).sort(),
        sections: sections.filter(s => s && s.trim().length > 0).sort()
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
});

export {
  getAllFlashcardSeries,
  createFlashcardSeries,
  getFlashcardSeries,
  startSession,
  recordInteraction,
  completeSession,
  deleteSession,
  deleteFlashcardSeries,
  completeFlashcardSeries,
  getFilterOptions
};