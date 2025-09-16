import Series from '../models/Series.js';
import Flashcard from '../models/Flashcard.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const getAllSeries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination || { page: 1, limit: 10, skip: 0 };
  const { status, search } = req.query;

  let query = {};

  // Filter by status
  if (status && ['active', 'completed'].includes(status)) {
    query.status = status;
  }

  // Search by title
  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  const total = await Series.countDocuments(query);

  const series = await Series.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ startedAt: -1 });

  // Add session count to each series
  const seriesWithCounts = series.map(s => ({
    ...s.toObject(),
    sessionCount: s.sessions.length,
    completedSessions: s.sessions.filter(session => session.status === 'completed').length
  }));

  res.status(200).json({
    success: true,
    message: 'Series retrieved successfully',
    data: seriesWithCounts,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit
    }
  });
});

const createSeries = asyncHandler(async (req, res) => {
  const { title } = req.body;

  const seriesData = {
    title,
    sessions: [],
    status: 'active'
  };

  const series = await Series.createSeries(seriesData);

  res.status(201).json({
    success: true,
    message: 'Series created successfully',
    data: {
      seriesId: series._id,
      title: series.title,
      status: series.status,
      startedAt: series.startedAt,
      sessions: series.sessions
    }
  });
});

const getSeries = asyncHandler(async (req, res) => {
  try {
    const { seriesId } = req.params;

    const series = await Series.findById(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Series retrieved successfully',
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

    const series = await Series.findById(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
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

    const series = await Series.findById(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
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

    const series = await Series.findById(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
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

    const series = await Series.findById(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
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
      await Series.findByIdAndDelete(series._id);

      res.status(200).json({
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

const deleteSeries = asyncHandler(async (req, res) => {
  try {
    const { seriesId } = req.params;

    const series = await Series.findById(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
      });
    }

    // Delete the entire series
    await Series.findByIdAndDelete(seriesId);

    res.status(200).json({
      success: true,
      message: 'Series deleted successfully',
      data: {
        deletedSeriesId: seriesId
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

const completeSeries = asyncHandler(async (req, res) => {
  try {
    const { seriesId } = req.params;

    const series = await Series.findById(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
      });
    }

    if (series.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Series is already completed'
      });
    }

    await series.completeSeries();

    res.status(200).json({
      success: true,
      message: 'Series completed successfully',
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

export {
  getAllSeries,
  createSeries,
  getSeries,
  startSession,
  recordInteraction,
  completeSession,
  deleteSession,
  deleteSeries,
  completeSeries
};