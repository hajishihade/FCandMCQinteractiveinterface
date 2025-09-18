import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { flashcardAPI, sessionAPI, seriesAPI } from '../services/api';
import { sessionPersistence } from '../utils/sessionPersistence';
import './StudySession.css';

const StudySession = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Core session state
  const [sessionState, setSessionState] = useState({
    seriesId: null,
    sessionId: null,
    cards: [],
    currentCardIndex: 0,
    sessionComplete: false,
    sessionResults: []
  });

  // UI state
  const [uiState, setUiState] = useState({
    showingFront: true,
    confidence: '',
    difficulty: '',
    isTransitioning: false,
    loading: true,
    error: ''
  });

  // Timer state
  const [timerState, setTimerState] = useState({
    startTime: null,
    elapsedTime: 0
  });

  // Unified session initialization
  const initializeSession = useCallback(async (sessionInfo) => {
    try {
      setUiState(prev => ({ ...prev, loading: true, error: '' }));

      let cards, sessionId;

      if (sessionInfo.mode === 'continue') {
        // Continue existing session
        const seriesResponse = await seriesAPI.getById(sessionInfo.seriesId);
        const seriesData = seriesResponse.data.data || seriesResponse.data;

        if (!seriesData || !seriesData.sessions) {
          throw new Error('Series data not found or invalid format');
        }

        const session = seriesData.sessions.find(s => s.sessionId === sessionInfo.sessionId);

        if (!session) {
          throw new Error('Session not found in series');
        }

        const selectedCards = session.cards?.length > 0
          ? session.cards.map(card => card.cardId)
          : [];

        if (selectedCards.length === 0) {
          throw new Error('No cards found in session');
        }

        const response = await flashcardAPI.getByIds(selectedCards);

        // Validate API response to prevent crashes
        if (response && (response.data.data || response.data)) {
          cards = response.data.data || response.data;
          if (!Array.isArray(cards) || cards.length === 0) {
            throw new Error('No valid cards returned from API');
          }
        } else {
          throw new Error('Invalid flashcard API response');
        }

        sessionId = sessionInfo.sessionId;
      } else if (sessionInfo.selectedCards) {
        // Has selectedCards - either from CreateSeries or from modal
        const response = await flashcardAPI.getByIds(sessionInfo.selectedCards);

        // Validate API response to prevent crashes
        if (response && (response.data.data || response.data)) {
          cards = response.data.data || response.data;
          if (!Array.isArray(cards) || cards.length === 0) {
            throw new Error('No valid cards returned for session');
          }
        } else {
          throw new Error('Invalid cards API response');
        }

        if (sessionInfo.sessionId) {
          // Session already created (from modal)
          sessionId = sessionInfo.sessionId;
        } else {
          // Need to create session (from CreateSeries)
          const sessionResponse = await sessionAPI.start(sessionInfo.seriesId, sessionInfo.selectedCards);
          sessionId = sessionResponse.data.data.sessionId;
        }
      } else {
        throw new Error('Invalid session information - no selectedCards or continue mode');
      }

      setSessionState(prev => ({
        ...prev,
        seriesId: sessionInfo.seriesId,
        sessionId,
        cards
      }));

      setTimerState({ startTime: Date.now(), elapsedTime: 0 });

      // Save session state for persistence (completely safe - purely additive)
      sessionPersistence.saveSession({
        seriesId: sessionInfo.seriesId,
        sessionId,
        currentCardIndex: 0,
        mode: sessionInfo.mode || 'study'
      });

    } catch (error) {
      console.error('Error initializing session:', error);
      setUiState(prev => ({
        ...prev,
        error: sessionInfo.mode === 'continue' ? 'Failed to continue study session' : 'Failed to start study session'
      }));
    } finally {
      setUiState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    const sessionInfo = location.state;
    if (!sessionInfo?.seriesId) {
      navigate('/');
      return;
    }
    initializeSession(sessionInfo);
  }, [location.state, navigate, initializeSession]);

  // Reset card state for next card
  const resetCardState = useCallback(() => {
    setUiState(prev => ({
      ...prev,
      showingFront: true,
      confidence: '',
      difficulty: ''
    }));
    setTimerState({ startTime: Date.now(), elapsedTime: 0 });
  }, []);

  // Finish session
  const finishSession = useCallback(async () => {
    try {
      await sessionAPI.complete(sessionState.seriesId, sessionState.sessionId);
      setSessionState(prev => ({ ...prev, sessionComplete: true }));

      // Clear saved session data when completed (safe cleanup)
      sessionPersistence.clearSession();
    } catch (error) {
      console.error('Error completing session:', error);
      setUiState(prev => ({ ...prev, error: 'Session finished but there was an error saving.' }));
    }
  }, [sessionState.seriesId, sessionState.sessionId]);

  // Unified selection handler
  const handleSelectionChange = useCallback((type, value) => {
    setUiState(prev => {
      const newState = { ...prev, [type]: value };

      // Auto-advance when both selections are made
      if (newState.confidence && newState.difficulty) {
        setTimeout(() => setUiState(current => ({ ...current, showingFront: false })), 300);
      }

      return newState;
    });
  }, []);

  // Handle result submission
  const handleResult = useCallback(async (result) => {
    const { seriesId, sessionId, cards, currentCardIndex } = sessionState;
    const { confidence, difficulty } = uiState;
    const { startTime } = timerState;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const currentCard = cards[currentCardIndex];

    const resultData = {
      cardId: currentCard.cardId,
      frontText: currentCard.frontText,
      backText: currentCard.backText,
      subject: currentCard.subject,
      result,
      difficulty,
      confidenceWhileSolving: confidence,
      timeSpent
    };

    try {
      await sessionAPI.recordInteraction(seriesId, sessionId, {
        cardId: currentCard.cardId,
        result,
        difficulty,
        confidenceWhileSolving: confidence,
        timeSpent
      });

      setSessionState(prev => ({
        ...prev,
        sessionResults: [...prev.sessionResults, resultData]
      }));

      // Advance to next card or finish session
      if (currentCardIndex + 1 < cards.length) {
        setUiState(prev => ({ ...prev, isTransitioning: true }));

        setTimeout(() => {
          setSessionState(prev => {
            const newState = { ...prev, currentCardIndex: prev.currentCardIndex + 1 };

            // Save progress (completely safe - just saves state)
            sessionPersistence.saveSession({
              seriesId: prev.seriesId,
              sessionId: prev.sessionId,
              currentCardIndex: newState.currentCardIndex,
              mode: 'study'
            });

            return newState;
          });
          resetCardState();
          setUiState(prev => ({ ...prev, isTransitioning: false }));
        }, 500);
      } else {
        finishSession();
      }

    } catch (error) {
      console.error('Error recording interaction:', error);
      setUiState(prev => ({ ...prev, error: 'Failed to record your answer' }));
    }
  }, [sessionState, uiState, timerState, resetCardState, finishSession]);

  // Timer effect
  useEffect(() => {
    if (timerState.startTime) {
      const timer = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          elapsedTime: Math.floor((Date.now() - prev.startTime) / 1000)
        }));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timerState.startTime]);

  // Utility functions
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const summaryStats = useMemo(() => {
    const { sessionResults } = sessionState;
    if (sessionResults.length === 0) return null;

    const correctCount = sessionResults.filter(r => r.result === 'Right').length;
    const totalTime = sessionResults.reduce((sum, r) => sum + r.timeSpent, 0);
    const avgTime = totalTime / sessionResults.length;
    const successRate = (correctCount / sessionResults.length) * 100;

    return {
      correctCount,
      totalCards: sessionResults.length,
      successRate: Math.round(successRate),
      totalTime: formatTime(totalTime),
      avgTime: Math.round(avgTime)
    };
  }, [sessionState, formatTime]);

  // Early returns for different states
  if (uiState.loading) {
    return (
      <div className="study-loading">
        <div className="loading-text">Starting your study session...</div>
      </div>
    );
  }

  if (uiState.error) {
    return (
      <div className="study-error">
        <div className="error-text">{uiState.error}</div>
        <button onClick={() => navigate('/browse-series')} className="home-btn">
          Return Home
        </button>
      </div>
    );
  }

  if (sessionState.cards.length === 0) {
    return (
      <div className="study-empty">
        <div className="empty-text">No cards to study</div>
        <button onClick={() => navigate('/browse-series')} className="home-btn">
          Return Home
        </button>
      </div>
    );
  }

  const { cards, currentCardIndex, sessionComplete, sessionResults } = sessionState;
  const { showingFront, confidence, difficulty, isTransitioning } = uiState;
  const { elapsedTime } = timerState;
  const currentCard = cards[currentCardIndex];

  // Session complete summary
  if (sessionComplete) {
    return (
      <div className="study-container">
        <div className="summary-header">
          <div className="summary-title">session complete!</div>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">score</span>
              <span className="stat-value">{summaryStats.correctCount}/{summaryStats.totalCards}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">success</span>
              <span className="stat-value">{summaryStats.successRate}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">time</span>
              <span className="stat-value">{summaryStats.totalTime}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">avg/card</span>
              <span className="stat-value">{summaryStats.avgTime}s</span>
            </div>
          </div>
        </div>

        <div className="results-list">
          {sessionResults.map((result) => (
            <div key={result.cardId} className="result-item">
              <div className="result-header">
                <span className="card-number">#{result.cardId}</span>
                <span className={`result-badge ${result.result.toLowerCase()}`}>
                  {result.result === 'Right' ? '✓' : '✗'}
                </span>
              </div>

              <div className="result-content">
                <div className="result-question">{result.frontText}</div>
                <div className="result-answer">{result.backText}</div>
              </div>

              <div className="result-meta">
                <div className="meta-item">
                  {result.confidenceWhileSolving === 'High' ? '↑' : '↓'}
                </div>
                <div className="meta-item">
                  {result.difficulty === 'Easy' ? '−' : result.difficulty === 'Medium' ? '=' : '≡'}
                </div>
                <div className="meta-item">
                  {result.result === 'Right' ? '✓' : '✗'}
                </div>
                <div className="meta-item">
                  {result.timeSpent}s
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="summary-footer">
          <button onClick={() => navigate('/browse-series')} className="home-btn">
            ← back to series
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="study-container">
      {/* Header section */}
      <div className="study-header">
        <div className="timer-section">
          <div className="timer">{formatTime(elapsedTime)}</div>
        </div>
        <div className="progress-section">
          <div className="progress-numbers">
            {currentCardIndex + 1} / {cards.length}
          </div>
        </div>
      </div>

      {/* Floating text design */}
      <div className="card-section">
        <div className="card-meta">
          ID: {currentCard.cardId} • {currentCard.subject}
        </div>

        <div className={`floating-content ${isTransitioning ? 'card-transition-out' : 'card-transition-in'}`}>
          <div className="question-text">
            {currentCard.frontText}
          </div>

          {!showingFront && (
            <div className="answer-section">
              <div className="divider-line"></div>
              <div className="answer-text">
                {currentCard.backText}
              </div>
            </div>
          )}
        </div>
      </div>

      {showingFront ? (
        <div className="study-controls">
          {/* Confidence selection */}
          <div className="control-row">
            <span className="control-label">confidence</span>
            <div className="minimal-buttons">
              <button
                className={`minimal-btn ${confidence === 'High' ? 'selected' : ''}`}
                onClick={() => handleSelectionChange('confidence', 'High')}
                title="High Confidence"
              >
                ↑
              </button>
              <button
                className={`minimal-btn ${confidence === 'Low' ? 'selected' : ''}`}
                onClick={() => handleSelectionChange('confidence', 'Low')}
                title="Low Confidence"
              >
                ↓
              </button>
            </div>
          </div>

          {/* Difficulty selection */}
          <div className="control-row">
            <span className="control-label">difficulty</span>
            <div className="minimal-buttons">
              <button
                className={`minimal-btn ${difficulty === 'Easy' ? 'selected' : ''}`}
                onClick={() => handleSelectionChange('difficulty', 'Easy')}
                title="Easy"
              >
                −
              </button>
              <button
                className={`minimal-btn ${difficulty === 'Medium' ? 'selected' : ''}`}
                onClick={() => handleSelectionChange('difficulty', 'Medium')}
                title="Medium"
              >
                =
              </button>
              <button
                className={`minimal-btn ${difficulty === 'Hard' ? 'selected' : ''}`}
                onClick={() => handleSelectionChange('difficulty', 'Hard')}
                title="Hard"
              >
                ≡
              </button>
            </div>
          </div>

        </div>
      ) : (
        <div className="result-controls">
          <h3>was your answer correct?</h3>
          <div className="result-buttons">
            <button
              className="result-btn wrong-btn"
              onClick={() => handleResult('Wrong')}
              title="Wrong"
            >
              ✗
            </button>
            <button
              className="result-btn right-btn"
              onClick={() => handleResult('Right')}
              title="Right"
            >
              ✓
            </button>
          </div>
        </div>
      )}

      <div className="session-info">
        <button onClick={() => navigate('/browse-series')} className="exit-btn">
          Exit Session
        </button>
      </div>
    </div>
  );
};

export default StudySession;