import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mcqSeriesAPI, mcqSessionAPI } from '../services/mcqApi';
import MCQSessionRecipeModal from '../components/MCQSessionRecipeModal';
import SessionStatsModal from '../components/SessionStatsModal';
import './BrowseMCQSeries.css';

const BrowseMCQSeries = () => {
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
      const response = await mcqSeriesAPI.getAll({ limit: 50 });

      // Validate API response structure to prevent crashes
      if (response && response.data && Array.isArray(response.data)) {
        setSeries(response.data);
      } else {
        console.error('Invalid MCQ API response format:', response);
        setSeries([]); // Safe fallback
      }
    } catch (error) {
      console.error('Failed to fetch MCQ series:', error);
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
      navigate('/mcq-study', {
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
    e.stopPropagation();
    const sessionQuestions = session.questions?.map(q => q.questionId) || [];

    setModalState({
      type: 'recipe',
      isOpen: true,
      selectedSeries: {
        ...seriesData,
        editingSessionId: session.sessionId,
        existingQuestions: sessionQuestions
      },
      selectedSession: session
    });
  }, []);

  const handleCreateCustomSession = useCallback(async (questionIds, sessionId = null, action = 'create') => {
    try {
      if (action === 'delete' && sessionId) {
        await mcqSessionAPI.delete(modalState.selectedSeries._id, sessionId);
        fetchSeries();
      } else if (sessionId) {
        await mcqSessionAPI.delete(modalState.selectedSeries._id, sessionId);
        if (questionIds.length > 0) {
          const response = await mcqSessionAPI.start(modalState.selectedSeries._id, questionIds);
          navigate('/mcq-study', {
            state: {
              seriesId: modalState.selectedSeries._id,
              sessionId: response.data.sessionId,
              selectedQuestions: questionIds,
              mode: 'new'
            }
          });
        } else {
          fetchSeries();
        }
      } else {
        const response = await mcqSessionAPI.start(modalState.selectedSeries._id, questionIds);
        navigate('/mcq-study', {
          state: {
            seriesId: modalState.selectedSeries._id,
            sessionId: response.data.sessionId,
            selectedQuestions: questionIds,
            mode: 'new'
          }
        });
      }
    } catch (error) {
      alert('Failed to update MCQ session. Please try again.');
    }
    closeModal();
  }, [modalState.selectedSeries, navigate, fetchSeries]);

  const closeModal = useCallback(() => {
    setModalState({ type: null, isOpen: false, selectedSeries: null, selectedSession: null });
  }, []);

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
        <h1 className="page-title">Your MCQ Series</h1>

        <div className="mode-toggle">
          <button
            className="toggle-btn"
            onClick={() => navigate('/')}
          >
            Flashcards
          </button>
          <button
            className="toggle-btn active"
            onClick={() => {}}
          >
            MCQ
          </button>
        </div>

        <div className="empty-container">
          <h2>No MCQ Series Yet</h2>
          <p>Create your first MCQ series to start studying</p>
          <button onClick={() => navigate('/create-mcq-series')} className="primary-btn">
            Create MCQ Series
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-container">
      <h1 className="page-title">Your MCQ Series</h1>

      <div className="mode-toggle">
        <button
          className="toggle-btn"
          onClick={() => navigate('/')}
        >
          Flashcards
        </button>
        <button
          className="toggle-btn active"
          onClick={() => {}}
        >
          MCQ
        </button>
      </div>

      <div className="create-new-section">
        <button onClick={() => navigate('/create-mcq-series')} className="create-new-btn">
          + Create New MCQ Series
        </button>
      </div>

      {processedSeries.length > 0 && <div className="series-divider"></div>}

      <div className="series-list">
        {processedSeries.map((seriesItem, index) => {
          const { sessions, _id: seriesId, title, status, completedCount, activeSession } = seriesItem;

          return (
            <React.Fragment key={seriesItem._id}>
              {index > 0 && <div className="series-divider"></div>}

              <div className="series-item">
              <div className="series-header">
                <h2>{seriesItem.title} <span className="series-progress">({completedCount}/{seriesItem.sessions.length})</span></h2>
              </div>

              <div className="sessions-row">
                {seriesItem.sessions.map((session) => {
                  // Calculate MCQ session stats
                  const questions = session.questions || [];
                  const answeredQuestions = questions.filter(q => q.interaction).length;
                  const correctQuestions = questions.filter(q => q.interaction?.isCorrect).length;
                  const accuracy = answeredQuestions > 0 ? Math.round((correctQuestions / answeredQuestions) * 100) : 0;

                  const totalTime = questions.reduce((sum, q) => sum + (q.interaction?.timeSpent || 0), 0);
                  const avgTime = answeredQuestions > 0 ? Math.round(totalTime / answeredQuestions) : 0;

                  const sessionDate = session.completedAt || session.startedAt;
                  const dateStr = sessionDate ? new Date(sessionDate).toLocaleDateString() : '';

                  return (
                    <button
                      key={session.sessionId}
                      className={`session-btn ${session.status}`}
                      onClick={() => handleSessionClick(seriesItem._id, session.sessionId, session.status, session, seriesItem)}
                      title={session.status === 'completed' ? 'Click to view stats' : session.status === 'active' ? 'Click to continue' : ''}
                    >
                      <div className="session-number">#{session.sessionId}</div>

                      {session.status === 'completed' && (
                        <div className="session-stats">
                          <span>{accuracy}% accuracy</span>
                          <span>{answeredQuestions}/{questions.length} questions</span>
                          <span>{avgTime}s avg time</span>
                          <span>{dateStr}</span>
                        </div>
                      )}

                      {session.status === 'active' && (
                        <>
                          <div className="session-stats">
                            <span>In Progress</span>
                            <span>{answeredQuestions}/{questions.length} done</span>
                            {answeredQuestions > 0 && <span>{accuracy}% so far</span>}
                            {avgTime > 0 && <span>{avgTime}s avg</span>}
                          </div>
                          <button
                            className="edit-session-btn"
                            onClick={(e) => handleEditSession(seriesItem._id, session, seriesItem, e)}
                            title="Edit session - Add/Remove questions"
                          >
                            ⚙
                          </button>
                        </>
                      )}
                    </button>
                  );
                })}

                {seriesItem.status === 'active' && !activeSession && (
                  <button
                    className="session-btn new"
                    onClick={() => handleNewSession(seriesItem._id, seriesItem)}
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
        <MCQSessionRecipeModal
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
          isFlashcard={false}
        />
      )}
    </div>
  );
};

export default BrowseMCQSeries;