import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { flashcardAPI, sessionAPI, seriesAPI } from '../services/api';
import './StudySession.css';

const StudySession = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [seriesId, setSeriesId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const [showingFront, setShowingFront] = useState(true);
  const [confidence, setConfidence] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionInfo = location.state;

    if (!sessionInfo || !sessionInfo.seriesId) {
      navigate('/');
      return;
    }

    if (sessionInfo.mode === 'continue') {
      // Continue existing session
      continueExistingSession(sessionInfo);
    } else {
      // Start new session (from CreateSeries)
      initializeSession(sessionInfo);
    }
  }, [location.state, navigate]);

  const continueExistingSession = async (sessionInfo) => {
    try {
      setLoading(true);

      // Get the session data to find which cards to continue with
      const seriesResponse = await seriesAPI.getById(sessionInfo.seriesId);
      const session = seriesResponse.data.data.sessions.find(s => s.sessionId === sessionInfo.sessionId);

      // Use the existing session's cards - same as new session logic
      const selectedCards = session.cards && session.cards.length > 0
        ? session.cards.map(card => card.cardId)
        : [0, 1, 2]; // Fallback to some cards if empty

      // Use exact same logic as CreateSeries -> StudySession
      const response = await flashcardAPI.getByIds(selectedCards);
      const flashcards = response.data.data;

      setSeriesId(sessionInfo.seriesId);
      setSessionId(sessionInfo.sessionId); // Use existing session
      setCards(flashcards);
      setStartTime(Date.now());

    } catch (error) {
      console.error('Error continuing session:', error);
      setError('Failed to continue study session');
    } finally {
      setLoading(false);
    }
  };

  const initializeSession = async (seriesInfo) => {
    try {
      setLoading(true);

      const response = await flashcardAPI.getByIds(seriesInfo.selectedCards);
      const flashcards = response.data.data;

      setSeriesId(seriesInfo.seriesId);
      setCards(flashcards);
      setStartTime(Date.now());

      const sessionResponse = await sessionAPI.start(seriesInfo.seriesId, seriesInfo.selectedCards);
      setSessionId(sessionResponse.data.data.sessionId);

    } catch (error) {
      console.error('Error initializing session:', error);
      setError('Failed to start study session');
    } finally {
      setLoading(false);
    }
  };

  const handleConfidenceSelect = (level) => {
    setConfidence(level);
    if (difficulty && level) {
      setTimeout(() => setShowingFront(false), 300);
    }
  };

  const handleDifficultySelect = (level) => {
    setDifficulty(level);
    if (confidence && level) {
      setTimeout(() => setShowingFront(false), 300);
    }
  };


  const handleResult = async (result) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const currentCard = cards[currentCardIndex];

    const currentResult = {
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

      setSessionResults(prev => [...prev, currentResult]);

      if (currentCardIndex + 1 < cards.length) {
        // Trigger slide out animation
        setIsTransitioning(true);

        setTimeout(() => {
          setCurrentCardIndex(prev => prev + 1);
          resetCardState();
          setIsTransitioning(false);
        }, 500);
      } else {
        finishSessionWithSummary();
      }

    } catch (error) {
      console.error('Error recording interaction:', error);
      setError('Failed to record your answer');
    }
  };

  // Timer effect
  useEffect(() => {
    if (startTime) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [startTime]);

  const resetCardState = () => {
    setShowingFront(true);
    setConfidence('');
    setDifficulty('');
    setStartTime(Date.now());
    setElapsedTime(0);
  };

  const finishSession = async () => {
    try {
      await sessionAPI.complete(seriesId, sessionId);
      alert('Session completed successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Session finished but there was an error saving. Returning home...');
      navigate('/');
    }
  };

  const finishSessionWithSummary = async () => {
    try {
      await sessionAPI.complete(seriesId, sessionId);
      setSessionComplete(true);
    } catch (error) {
      console.error('Error completing session:', error);
      setError('Session finished but there was an error saving.');
    }
  };

  if (loading) {
    return (
      <div className="study-loading">
        <div className="loading-text">Starting your study session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="study-error">
        <div className="error-text">{error}</div>
        <button onClick={() => navigate('/')} className="home-btn">
          Return Home
        </button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="study-empty">
        <div className="empty-text">No cards to study</div>
        <button onClick={() => navigate('/')} className="home-btn">
          Return Home
        </button>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / cards.length) * 100;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateSummaryStats = () => {
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
  };

  if (sessionComplete) {
    const stats = calculateSummaryStats();

    return (
      <div className="study-container">
        <div className="summary-header">
          <div className="summary-title">session complete!</div>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">score</span>
              <span className="stat-value">{stats.correctCount}/{stats.totalCards}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">success</span>
              <span className="stat-value">{stats.successRate}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">time</span>
              <span className="stat-value">{stats.totalTime}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">avg/card</span>
              <span className="stat-value">{stats.avgTime}s</span>
            </div>
          </div>
        </div>

        <div className="results-list">
          {sessionResults.map((result, index) => (
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
          <button onClick={() => navigate('/')} className="home-btn">
            ← back to series
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="study-container">
      {/* Timer at top */}
      <div className="timer-section">
        <div className="timer">{formatTime(elapsedTime)}</div>
      </div>

      {/* Progress indicator */}
      <div className="progress-section">
        <div className="progress-numbers">
          {currentCardIndex + 1} / {cards.length}
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
                onClick={() => handleConfidenceSelect('High')}
                title="High Confidence"
              >
                ↑
              </button>
              <button
                className={`minimal-btn ${confidence === 'Low' ? 'selected' : ''}`}
                onClick={() => handleConfidenceSelect('Low')}
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
                onClick={() => handleDifficultySelect('Easy')}
                title="Easy"
              >
                −
              </button>
              <button
                className={`minimal-btn ${difficulty === 'Medium' ? 'selected' : ''}`}
                onClick={() => handleDifficultySelect('Medium')}
                title="Medium"
              >
                =
              </button>
              <button
                className={`minimal-btn ${difficulty === 'Hard' ? 'selected' : ''}`}
                onClick={() => handleDifficultySelect('Hard')}
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
        <button onClick={() => navigate('/')} className="exit-btn">
          Exit Session
        </button>
      </div>
    </div>
  );
};

export default StudySession;