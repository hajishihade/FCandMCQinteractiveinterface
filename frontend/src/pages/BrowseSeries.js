import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { seriesAPI, sessionAPI } from '../services/api';
import SessionRecipeModal from '../components/SessionRecipeModal';
import './BrowseSeries.css';

const BrowseSeries = () => {
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState(null);

  const fetchSeries = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit: 50 };

      const response = await seriesAPI.getAll(params);
      setSeries(response.data.data);
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const handleSessionClick = (seriesId, sessionId, sessionStatus) => {
    if (sessionStatus === 'completed') {
      alert(`Session ${sessionId} is completed. Stats are displayed in the square.`);
      return;
    }

    if (sessionStatus === 'active') {
      // Continue studying
      navigate('/study', {
        state: {
          seriesId,
          sessionId,
          mode: 'continue'
        }
      });
    }
  };

  const editActiveSession = (seriesData, sessionId) => {
    // Find the session and get its cards (now includes all cards from creation)
    const session = seriesData.sessions.find(s => s.sessionId === sessionId);
    const existingCardIds = session?.cards?.map(card => card.cardId) || [];

    // Pass the existing session data to the modal
    setSelectedSeries({
      ...seriesData,
      editingSessionId: sessionId,
      existingCards: existingCardIds
    });
    setShowRecipeModal(true);
  };


  const handleNewSessionClick = (seriesData) => {
    // Check if there's already an active session
    const hasActiveSession = seriesData.sessions.some(s => s.status === 'active');

    if (hasActiveSession) {
      alert('Please complete the current active session before creating a new one.');
      return;
    }

    setSelectedSeries(seriesData);
    setShowRecipeModal(true);
  };

  const handleCreateCustomSession = async (cardIds, sessionId = null, action = 'create') => {
    try {
      if (action === 'delete') {
        // Delete session
        await sessionAPI.delete(selectedSeries._id, sessionId);
        await fetchSeries();
        return;
      }

      if (sessionId) {
        // Edit mode - update existing session
        // For now, we'll delete the old session and create a new one
        await sessionAPI.delete(selectedSeries._id, sessionId);
      }

      // Create new session (for both create and edit modes)
      const lastSessionId = selectedSeries.sessions.length > 0
        ? Math.max(...selectedSeries.sessions.map(s => s.sessionId))
        : null;

      await sessionAPI.start(selectedSeries._id, cardIds, lastSessionId);

      // Refresh series list to show updated session
      await fetchSeries();

    } catch (error) {
      console.error('Error with session operation:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateSessionStats = (session) => {
    if (!session.cards || session.cards.length === 0) {
      return {
        correctCount: 0,
        totalCards: 0,
        avgTime: 0,
        totalTime: 0,
        successRate: 0,
        completedCards: 0,
        formattedTotalTime: '0s'
      };
    }

    // Filter cards that have interactions (not null)
    const cardsWithInteractions = session.cards.filter(card => card.interaction && card.interaction.result);

    const correctCount = cardsWithInteractions.filter(card => card.interaction.result === 'Right').length;
    const totalCards = session.cards.length; // Total cards in session
    const completedCards = cardsWithInteractions.length; // Cards with interactions
    const totalTime = cardsWithInteractions.reduce((sum, card) => sum + card.interaction.timeSpent, 0);
    const avgTime = completedCards > 0 ? Math.round(totalTime / completedCards) : 0;
    const successRate = completedCards > 0 ? Math.round((correctCount / completedCards) * 100) : 0;

    const formattedTotalTime = totalTime >= 60
      ? `${Math.floor(totalTime / 60)}m ${totalTime % 60}s`
      : `${totalTime}s`;

    return {
      correctCount,
      totalCards,
      avgTime,
      totalTime,
      formattedTotalTime,
      successRate,
      completedCards
    };
  };

  if (loading) {
    return (
      <div className="browse-loading">
        <div className="loading-text">Loading your series...</div>
      </div>
    );
  }

  return (
    <div className="browse-container">
      <div className="browse-header">
        <button
          onClick={() => navigate('/')}
          className="back-btn"
        >
          ←
        </button>
      </div>

      <div className="series-list">
        {series.length === 0 ? (
          <div className="empty-state">
            <div className="empty-text">
              No series created yet
            </div>
            <button
              onClick={() => navigate('/create-series')}
              className="create-series-btn"
            >
              Create Your First Series
            </button>
          </div>
        ) : (
          series.map((seriesItem) => (
            <div key={seriesItem._id} className="series-card">
              <div className="series-header">
                <div className="series-title-group">
                  <h3 className="series-title">{seriesItem.title}</h3>
                  <div className="series-meta">
                    <span>started: {formatDate(seriesItem.startedAt)}</span>
                    <span>sessions: {seriesItem.completedSessions || 0}/{seriesItem.sessionCount}</span>
                  </div>
                </div>
              </div>

              <div className="sessions-container">
                <div className="sessions-grid">
                  {seriesItem.sessions.map((session) => {
                    const sessionStats = calculateSessionStats(session);

                    return (
                      <div
                        key={`${seriesItem._id}-${session.sessionId}`}
                        className={`session-square ${session.status}`}
                        onClick={() => handleSessionClick(seriesItem._id, session.sessionId, session.status)}
                        title={`Session ${session.sessionId} - ${session.status}`}
                      >
                        <div className="session-number">#{session.sessionId}</div>

                        {session.cards && session.cards.length > 0 ? (
                          <div className="session-stats">
                            <div className="stat-line">
                              <span className="stat-label">Cards:</span>
                              <span className="stat-value">{sessionStats.totalCards}</span>
                            </div>
                            <div className="stat-line">
                              <span className="stat-label">Finished:</span>
                              <span className="stat-value">{sessionStats.completedCards}</span>
                            </div>
                            <div className="stat-line">
                              <span className="stat-label">Score:</span>
                              <span className="stat-value">{sessionStats.correctCount}/{sessionStats.totalCards}</span>
                            </div>
                            <div className="stat-line">
                              <span className="stat-label">Success:</span>
                              <span className="stat-value">{sessionStats.successRate}%</span>
                            </div>
                            <div className="stat-line">
                              <span className="stat-label">Total Time:</span>
                              <span className="stat-value">{sessionStats.formattedTotalTime}</span>
                            </div>
                            {session.status === 'active' && (
                              <div className="session-continue-indicator">
                                <div className="continue-text">← Click to Continue</div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="session-status-text">
                            <div className="continue-text">Click to Continue</div>
                            <div className="session-meta">Session {session.sessionId}</div>
                            <div className="session-meta">Ready to start</div>
                          </div>
                        )}

                        {session.generatedFrom && (
                          <div className="generated-indicator">•</div>
                        )}

                        {session.status === 'active' && (
                          <button
                            className="edit-session-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              editActiveSession(seriesItem, session.sessionId);
                            }}
                            title="Edit session"
                          >
                            ✎
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {seriesItem.status === 'active' &&
                   seriesItem.sessions.length <= 8 &&
                   !seriesItem.sessions.some(s => s.status === 'active') && (
                    <div
                      className="session-square empty"
                      title="Create custom session"
                      onClick={() => handleNewSessionClick(seriesItem)}
                    >
                      <div className="empty-icon">+</div>
                      <div className="empty-text">Custom Session</div>
                      <div className="empty-subtext">Click to configure</div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      <SessionRecipeModal
        isOpen={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        onCreateSession={handleCreateCustomSession}
        seriesData={selectedSeries}
      />
    </div>
  );
};

export default BrowseSeries;