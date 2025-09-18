import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { seriesAPI, sessionAPI } from '../services/api';
import SessionRecipeModal from '../components/SessionRecipeModal';
import SessionStatsModal from '../components/SessionStatsModal';
import './BrowseSeries.css';

// Constants
const SERIES_FETCH_LIMIT = 50;

const BrowseSeries = () => {
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({
    type: null, // 'recipe' | 'stats' | null
    isOpen: false,
    selectedSeries: null,
    selectedSession: null
  });

  const fetchSeries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await seriesAPI.getAll({ limit: SERIES_FETCH_LIMIT });

      // Validate API response structure to prevent crashes
      if (response && response.data && Array.isArray(response.data.data)) {
        setSeries(response.data.data);
      } else {
        console.error('Invalid API response format:', response);
        setSeries([]); // Safe fallback
      }
    } catch (error) {
      console.error('Failed to fetch series:', error);
      setSeries([]); // Safe fallback prevents crashes
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const handleSessionClick = useCallback((seriesId, sessionId, sessionStatus, session, seriesItem) => {
    if (sessionStatus === 'active') {
      navigate('/study', {
        state: { seriesId, sessionId, mode: 'continue' }
      });
    } else if (sessionStatus === 'completed') {
      setModalState({
        type: 'stats',
        isOpen: true,
        selectedSeries: seriesItem,
        selectedSession: session
      });
    }
  }, [navigate]);

  const handleNewSession = useCallback((seriesId, seriesData) => {
    setModalState({
      type: 'recipe',
      isOpen: true,
      selectedSeries: seriesData,
      selectedSession: null
    });
  }, []);

  const handleEditSession = useCallback((seriesId, session, seriesData, e) => {
    e.stopPropagation(); // Prevent session click
    const sessionCards = session.cards?.map(card => card.cardId) || [];

    setModalState({
      type: 'recipe',
      isOpen: true,
      selectedSeries: {
        ...seriesData,
        editingSessionId: session.sessionId,
        existingCards: sessionCards
      },
      selectedSession: session
    });
  }, []);

  const handleCreateCustomSession = useCallback(async (cardIds, sessionId = null, action = 'create') => {
    try {
      if (action === 'delete' && sessionId) {
        // Delete session
        await sessionAPI.delete(modalState.selectedSeries._id, sessionId);
        fetchSeries();
      } else if (sessionId) {
        // Update existing session - delete and recreate
        await sessionAPI.delete(modalState.selectedSeries._id, sessionId);
        if (cardIds.length > 0) {
          const response = await sessionAPI.start(modalState.selectedSeries._id, cardIds, sessionId);

          navigate('/study', {
            state: {
              seriesId: modalState.selectedSeries._id,
              sessionId: response.data.data.sessionId,
              selectedCards: cardIds
            }
          });
        } else {
          fetchSeries(); // Just refresh if no cards selected
        }
      } else {
        // Create new session
        const response = await sessionAPI.start(modalState.selectedSeries._id, cardIds);

        navigate('/study', {
          state: {
            seriesId: modalState.selectedSeries._id,
            sessionId: response.data.data.sessionId,
            selectedCards: cardIds
          }
        });
      }
    } catch (error) {
      alert('Failed to update session. Please try again.');
    }
    closeModal();
  }, [modalState.selectedSeries, navigate, fetchSeries]);

  const closeModal = useCallback(() => {
    setModalState({ type: null, isOpen: false, selectedSeries: null, selectedSession: null });
  }, []);


  // No-op function to avoid creating new functions on each render
  const noOp = useCallback(() => {}, []);

  // Pre-process expensive calculations once instead of in render loop
  const processedSeries = useMemo(() =>
    series.map(seriesItem => ({
      ...seriesItem,
      completedCount: seriesItem.sessions.filter(s => s.status === 'completed').length,
      activeSession: seriesItem.sessions.find(s => s.status === 'active')
    })), [series]
  );

  if (loading) {
    return (
      <div className="browse-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="browse-container">
        <h1 className="page-title">Your Study Series</h1>

        <div className="mode-toggle">
          <button
            className="toggle-btn active"
            onClick={noOp}
          >
            Flashcards
          </button>
          <button
            className="toggle-btn"
            onClick={() => navigate('/browse-mcq-series')}
          >
            MCQ
          </button>
        </div>

        <div className="empty-container">
          <h2>No Series Yet</h2>
          <p>Create your first flashcard series to start studying</p>
          <button onClick={() => navigate('/create-series')} className="primary-btn">
            Create Flashcard Series
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-container">
      <h1 className="page-title">Your Study Series</h1>

      <div className="mode-toggle">
        <button
          className="toggle-btn active"
          onClick={() => {}}
        >
          Flashcards
        </button>
        <button
          className="toggle-btn"
          onClick={() => navigate('/browse-mcq-series')}
        >
          MCQ
        </button>
      </div>

      <div className="create-new-section">
        <button onClick={() => navigate('/create-series')} className="create-new-btn">
          + Create New Flashcard Series
        </button>
      </div>

      {processedSeries.length > 0 && <div className="series-divider"></div>}

      <div className="series-list">
        {processedSeries.map((seriesItem, index) => {
          const { sessions, _id: seriesId, title, status, completedCount, activeSession } = seriesItem;

          return (
            <React.Fragment key={seriesId}>
              {index > 0 && <div className="series-divider"></div>}

              <div className="series-item">
                <div className="series-header">
                  <h2>{title} <span className="series-progress">({completedCount}/{sessions.length})</span></h2>
                </div>

                <div className="sessions-row">
                  {sessions.map((session) => {
                    // Calculate comprehensive session stats
                    const cards = session.cards || [];
                    const completedCards = cards.filter(card => card.interaction).length;
                    const correctCards = cards.filter(card => card.interaction?.result === 'Right').length;
                    const accuracy = completedCards > 0 ? Math.round((correctCards / completedCards) * 100) : 0;

                    const totalTime = cards.reduce((sum, card) => sum + (card.interaction?.timeSpent || 0), 0);
                    const avgTime = completedCards > 0 ? Math.round(totalTime / completedCards) : 0;


                    const sessionDate = session.completedAt || session.startedAt;
                    const dateStr = sessionDate ? new Date(sessionDate).toLocaleDateString() : '';

                    return (
                      <button
                        key={session.sessionId}
                        className={`session-btn ${session.status}`}
                        onClick={() => handleSessionClick(seriesId, session.sessionId, session.status, session, seriesItem)}
                        title={session.status === 'completed' ? 'Click to view stats' : session.status === 'active' ? 'Click to continue' : ''}
                      >
                        <div className="session-number">#{session.sessionId}</div>

                        {session.status === 'completed' && (
                          <div className="session-stats">
                            <span>{accuracy}% accuracy</span>
                            <span>{completedCards}/{cards.length} cards</span>
                            <span>{avgTime}s avg time</span>
                            <span>{dateStr}</span>
                          </div>
                        )}

                        {session.status === 'active' && (
                          <>
                            <div className="session-stats">
                              <span>In Progress</span>
                              <span>{completedCards}/{cards.length} done</span>
                              {completedCards > 0 && <span>{accuracy}% so far</span>}
                              {avgTime > 0 && <span>{avgTime}s avg</span>}
                            </div>
                            <button
                              className="edit-session-btn"
                              onClick={(e) => handleEditSession(seriesId, session, seriesItem, e)}
                              title="Edit session - Add/Remove cards"
                            >
                              ⚙
                            </button>
                          </>
                        )}
                      </button>
                    );
                  })}

                  {status === 'active' && !activeSession && (
                    <button
                      className="session-btn new"
                      onClick={() => handleNewSession(seriesId, seriesItem)}
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {modalState.type === 'recipe' && (
        <SessionRecipeModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onCreateSession={handleCreateCustomSession}
          seriesData={modalState.selectedSeries}
        />
      )}

      {modalState.type === 'stats' && (
        <SessionStatsModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          sessionData={modalState.selectedSession}
          seriesTitle={modalState.selectedSeries?.title}
          isFlashcard={true}
        />
      )}
    </div>
  );
};

export default BrowseSeries;