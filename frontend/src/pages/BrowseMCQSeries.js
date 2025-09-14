import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { mcqSeriesAPI, mcqSessionAPI } from '../services/mcqApi';
import './BrowseSeries.css';

const BrowseMCQSeries = () => {
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSeries = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit: 50 };

      const response = await mcqSeriesAPI.getAll(params);
      setSeries(response.data);
    } catch (error) {
      console.error('Error fetching MCQ series:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const handleSessionClick = (seriesId, sessionId, sessionStatus) => {
    if (sessionStatus === 'completed') {
      alert(`MCQ Session ${sessionId} is completed. Stats are displayed in the square.`);
      return;
    }

    if (sessionStatus === 'active') {
      // Continue studying
      navigate('/mcq-study', {
        state: {
          seriesId,
          sessionId,
          mode: 'continue'
        }
      });
    }
  };

  const handleNewSessionClick = (seriesData) => {
    // Check if there's already an active session
    const hasActiveSession = seriesData.sessions.some(s => s.status === 'active');

    if (hasActiveSession) {
      alert('Please complete the current active MCQ session before creating a new one.');
      return;
    }

    // For now, redirect to create new series
    alert('Create new MCQ session functionality would redirect to MCQ series creation. For now, use Create New MCQ Series from the dashboard.');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateSessionStats = (session) => {
    if (!session.questions || session.questions.length === 0) {
      return {
        correctCount: 0,
        totalQuestions: 0,
        avgTime: 0,
        totalTime: 0,
        successRate: 0,
        completedQuestions: 0,
        formattedTotalTime: '0s'
      };
    }

    // Filter questions that have interactions (not null)
    const questionsWithInteractions = session.questions.filter(q => q.interaction && q.interaction.selectedAnswer);

    const correctCount = questionsWithInteractions.filter(q => q.interaction.isCorrect).length;
    const totalQuestions = session.questions.length; // Total questions in session
    const completedQuestions = questionsWithInteractions.length; // Questions with interactions
    const totalTime = questionsWithInteractions.reduce((sum, q) => sum + q.interaction.timeSpent, 0);
    const avgTime = completedQuestions > 0 ? Math.round(totalTime / completedQuestions) : 0;
    const successRate = completedQuestions > 0 ? Math.round((correctCount / completedQuestions) * 100) : 0;

    const formattedTotalTime = totalTime >= 60
      ? `${Math.floor(totalTime / 60)}m ${totalTime % 60}s`
      : `${totalTime}s`;

    return {
      correctCount,
      totalQuestions,
      avgTime,
      totalTime,
      formattedTotalTime,
      successRate,
      completedQuestions
    };
  };

  if (loading) {
    return (
      <div className="browse-loading">
        <div className="loading-text">Loading your MCQ series...</div>
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
              No MCQ series created yet
            </div>
            <button
              onClick={() => navigate('/create-mcq-series')}
              className="create-series-btn"
            >
              Create Your First MCQ Series
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
                    <span>sessions: {seriesItem.sessions.filter(s => s.status === 'completed').length}/{seriesItem.sessions.length}</span>
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
                        title={`MCQ Session ${session.sessionId} - ${session.status}`}
                      >
                        <div className="session-number">#{session.sessionId}</div>

                        {session.questions && session.questions.length > 0 ? (
                          <div className="session-stats">
                            <div className="stat-line">
                              <span className="stat-label">Questions:</span>
                              <span className="stat-value">{sessionStats.totalQuestions}</span>
                            </div>
                            <div className="stat-line">
                              <span className="stat-label">Finished:</span>
                              <span className="stat-value">{sessionStats.completedQuestions}</span>
                            </div>
                            <div className="stat-line">
                              <span className="stat-label">Score:</span>
                              <span className="stat-value">{sessionStats.correctCount}/{sessionStats.totalQuestions}</span>
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
                            <div className="session-meta">MCQ Session {session.sessionId}</div>
                            <div className="session-meta">Ready to start</div>
                          </div>
                        )}

                        {session.generatedFrom && (
                          <div className="generated-indicator">•</div>
                        )}
                      </div>
                    );
                  })}

                  {seriesItem.status === 'active' &&
                   seriesItem.sessions.length <= 8 &&
                   !seriesItem.sessions.some(s => s.status === 'active') && (
                    <div
                      className="session-square empty"
                      title="Create custom MCQ session"
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
    </div>
  );
};

export default BrowseMCQSeries;