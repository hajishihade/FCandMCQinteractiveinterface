import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { flashcardAPI, sessionAPI, seriesAPI } from '../services/api';
import { sessionPersistence } from '../utils/sessionPersistence';

// Study Components (UI only - no complex state management)
import {
  FlashcardDisplay,
  ConfidenceSelector,
  DifficultySelector,
  StudyNavigation,
  SessionSummary
} from '../components/study';

import './StudySession.css';

const NewStudySession = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Original state pattern - simple, direct useState hooks
  const [sessionState, setSessionState] = useState({
    seriesId: null,
    sessionId: null,
    cards: [],
    currentCardIndex: 0,
    sessionComplete: false,
    sessionResults: []
  });

  const [uiState, setUiState] = useState({
    showingFront: true,
    confidence: '',
    difficulty: '',
    isTransitioning: false,
    loading: true,
    error: ''
  });

  const [timerState, setTimerState] = useState({
    startTime: null,
    elapsedTime: 0
  });

  // Original initialization logic (unchanged)
  const initializeSession = useCallback(async (sessionInfo) => {
    try {
      setUiState(prev => ({ ...prev, loading: true, error: '' }));

      let cards, sessionId;

      if (sessionInfo.mode === 'continue') {
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
        const response = await flashcardAPI.getByIds(sessionInfo.selectedCards);

        if (response && (response.data.data || response.data)) {
          cards = response.data.data || response.data;
          if (!Array.isArray(cards) || cards.length === 0) {
            throw new Error('No valid cards returned for session');
          }
        } else {
          throw new Error('Invalid cards API response');
        }

        if (sessionInfo.sessionId) {
          sessionId = sessionInfo.sessionId;
        } else {
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

  useEffect(() => {
    const sessionInfo = location.state;
    if (!sessionInfo?.seriesId) {
      navigate('/');
      return;
    }
    initializeSession(sessionInfo);
  }, [location.state, navigate, initializeSession]);

  // Original card state reset
  const resetCardState = useCallback(() => {
    setUiState(prev => ({
      ...prev,
      showingFront: true,
      confidence: '',
      difficulty: ''
    }));
    setTimerState({ startTime: Date.now(), elapsedTime: 0 });
  }, []);

  // Original finish session
  const finishSession = useCallback(async () => {
    try {
      await sessionAPI.complete(sessionState.seriesId, sessionState.sessionId);
      setSessionState(prev => ({ ...prev, sessionComplete: true }));
      sessionPersistence.clearSession();
    } catch (error) {
      console.error('Error completing session:', error);
      setUiState(prev => ({ ...prev, error: 'Session finished but there was an error saving.' }));
    }
  }, [sessionState.seriesId, sessionState.sessionId]);

  // Original selection change handler
  const handleSelectionChange = useCallback((type, value) => {
    setUiState(prev => {
      const newState = { ...prev, [type]: value };

      if (newState.confidence && newState.difficulty) {
        setTimeout(() => setUiState(current => ({ ...current, showingFront: false })), 300);
      }

      return newState;
    });
  }, []);

  // Original result handler
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

      if (currentCardIndex + 1 < cards.length) {
        setUiState(prev => ({ ...prev, isTransitioning: true }));

        setTimeout(() => {
          setSessionState(prev => {
            const newState = { ...prev, currentCardIndex: prev.currentCardIndex + 1 };

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

  // Original timer effect
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

  // Original utility functions
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

  // Navigation handlers
  const handleNavigateToSeries = () => navigate('/browse-series');
  const handleNavigateToDashboard = () => navigate('/');

  // Original early returns
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
        <button onClick={handleNavigateToSeries} className="home-btn">
          Return Home
        </button>
      </div>
    );
  }

  if (sessionState.cards.length === 0) {
    return (
      <div className="study-empty">
        <div className="empty-text">No cards to study</div>
        <button onClick={handleNavigateToSeries} className="home-btn">
          Return Home
        </button>
      </div>
    );
  }

  const { cards, currentCardIndex, sessionComplete, sessionResults } = sessionState;
  const { showingFront, confidence, difficulty, isTransitioning } = uiState;
  const { elapsedTime } = timerState;
  const currentCard = cards[currentCardIndex];

  // Session complete with enhanced component
  if (sessionComplete) {
    return (
      <SessionSummary
        sessionResults={sessionResults}
        summaryStats={summaryStats}
        studyType="flashcard"
        onNavigateToSeries={handleNavigateToSeries}
        onNavigateToDashboard={handleNavigateToDashboard}
      />
    );
  }

  // Main study interface with components but original state
  return (
    <div className="study-container">
      {/* Original header structure */}
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

      {/* Enhanced Flashcard Display Component */}
      <FlashcardDisplay
        card={currentCard}
        showingFront={showingFront}
        isTransitioning={isTransitioning}
      />

      {/* Original conditional rendering with components */}
      {showingFront ? (
        <div className="study-controls">
          <ConfidenceSelector
            confidence={confidence}
            onConfidenceChange={(value) => handleSelectionChange('confidence', value)}
          />
          <DifficultySelector
            difficulty={difficulty}
            onDifficultyChange={(value) => handleSelectionChange('difficulty', value)}
          />
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

      {/* Enhanced Navigation Component */}
      <StudyNavigation
        onNavigateToSeries={handleNavigateToSeries}
        onNavigateToDashboard={handleNavigateToDashboard}
        studyType="flashcard"
      />
    </div>
  );
};

export default NewStudySession;