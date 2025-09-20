import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mcqAPI, mcqSeriesAPI, mcqSessionAPI } from '../services/mcqApi';
import { sessionPersistence } from '../utils/sessionPersistence';

// Study Components (UI only - no complex state management)
import {
  MCQDisplay,
  ConfidenceSelector,
  DifficultySelector,
  StudyNavigation,
  SessionSummary
} from '../components/study';

import './MCQSession.css';

const NewMCQSession = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Original state pattern - simple, direct useState hooks
  const [seriesId, setSeriesId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [confidence, setConfidence] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Original initialization logic (unchanged)
  useEffect(() => {
    const sessionInfo = location.state;

    if (!sessionInfo || !sessionInfo.seriesId) {
      navigate('/browse-mcq-series');
      return;
    }

    if (sessionInfo.mode === 'continue') {
      continueExistingSession(sessionInfo);
    } else {
      initializeSession(sessionInfo);
    }
  }, [location.state, navigate]);

  const continueExistingSession = async (sessionInfo) => {
    try {
      setLoading(true);

      const seriesResponse = await mcqSeriesAPI.getById(sessionInfo.seriesId);
      const seriesData = seriesResponse.data.data || seriesResponse.data;

      if (!seriesData || !seriesData.sessions) {
        throw new Error('MCQ Series data not found or invalid format');
      }

      const session = seriesData.sessions.find(s => s.sessionId === sessionInfo.sessionId);

      if (!session) {
        throw new Error('MCQ Session not found in series');
      }

      const selectedQuestions = session.questions && session.questions.length > 0
        ? session.questions.map(q => q.questionId)
        : [1, 2, 3];

      const response = await mcqAPI.getByIds(selectedQuestions);
      const mcqs = response.data;

      setSeriesId(sessionInfo.seriesId);
      setSessionId(sessionInfo.sessionId);
      setQuestions(mcqs);
      setStartTime(Date.now());

    } catch (error) {
      console.error('Error continuing session:', error);
      setError(`Failed to continue study session: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const initializeSession = async (seriesInfo) => {
    try {
      setLoading(true);

      const response = await mcqAPI.getByIds(seriesInfo.selectedQuestions);
      const mcqs = response.data;

      setSeriesId(seriesInfo.seriesId);
      setSessionId(seriesInfo.sessionId);
      setQuestions(mcqs);
      setStartTime(Date.now());

    } catch (error) {
      console.error('Error initializing session:', error);
      setError(`Failed to start study session: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Original selection handlers with useCallback optimization
  const handleConfidenceSelect = useCallback((level) => {
    setConfidence(level);
    if (selectedAnswer && difficulty && level) {
      setTimeout(() => setShowingAnswer(true), 300);
    }
  }, [selectedAnswer, difficulty]);

  const handleDifficultySelect = useCallback((level) => {
    setDifficulty(level);
    if (selectedAnswer && confidence && level) {
      setTimeout(() => setShowingAnswer(true), 300);
    }
  }, [selectedAnswer, confidence]);

  const handleAnswerSelect = useCallback((answer) => {
    setSelectedAnswer(answer);
    if (confidence && difficulty) {
      setTimeout(() => setShowingAnswer(true), 300);
    }
  }, [confidence, difficulty]);

  // Original next question logic (unchanged)
  const handleResult = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    const currentResult = {
      questionId: currentQuestion.questionId,
      question: currentQuestion.question,
      selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      subject: currentQuestion.subject,
      difficulty,
      confidenceWhileSolving: confidence,
      timeSpent,
      explanation: currentQuestion.explanation
    };

    try {
      await mcqSessionAPI.recordInteraction(seriesId, sessionId, {
        questionId: currentQuestion.questionId,
        selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        difficulty,
        confidenceWhileSolving: confidence,
        timeSpent
      });

      setSessionResults(prev => [...prev, currentResult]);

      if (currentQuestionIndex + 1 < questions.length) {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
          resetQuestionState();
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

  // Original timer effect (unchanged)
  useEffect(() => {
    if (startTime) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [startTime]);

  // Original reset function (unchanged)
  const resetQuestionState = () => {
    setSelectedAnswer('');
    setShowingAnswer(false);
    setConfidence('');
    setDifficulty('');
    setStartTime(Date.now());
    setElapsedTime(0);
  };

  const finishSessionWithSummary = async () => {
    try {
      await mcqSessionAPI.complete(seriesId, sessionId);
      setSessionComplete(true);
    } catch (error) {
      console.error('Error completing session:', error);
      setError('Session finished but there was an error saving.');
    }
  };

  // Original utility functions (unchanged)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateSummaryStats = () => {
    const correctCount = sessionResults.filter(r => r.isCorrect).length;
    const totalTime = sessionResults.reduce((sum, r) => sum + r.timeSpent, 0);
    const avgTime = totalTime / sessionResults.length;
    const successRate = (correctCount / sessionResults.length) * 100;

    return {
      correctCount,
      totalQuestions: sessionResults.length,
      successRate: Math.round(successRate),
      totalTime: formatTime(totalTime),
      avgTime: Math.round(avgTime)
    };
  };

  // Navigation handlers with useCallback optimization
  const handleNavigateToSeries = useCallback(() => navigate('/browse-mcq-series'), [navigate]);
  const handleNavigateToDashboard = useCallback(() => navigate('/'), [navigate]);

  // Original loading state (unchanged)
  if (loading) {
    return (
      <div className="mcq-loading">
        <div className="loading-text">Starting your MCQ session...</div>
      </div>
    );
  }

  // Original error state (unchanged)
  if (error) {
    return (
      <div className="mcq-error">
        <div className="error-text">{error}</div>
        <StudyNavigation
          onNavigateToSeries={handleNavigateToSeries}
          onNavigateToDashboard={handleNavigateToDashboard}
          studyType="mcq"
        />
      </div>
    );
  }

  // Original empty state (unchanged)
  if (!questions || questions.length === 0) {
    return (
      <div className="mcq-empty">
        <div className="empty-text">No questions to study</div>
        <StudyNavigation
          onNavigateToSeries={handleNavigateToSeries}
          onNavigateToDashboard={handleNavigateToDashboard}
          studyType="mcq"
        />
      </div>
    );
  }

  const currentQuestion = questions?.[currentQuestionIndex];

  // Original session complete state with component
  if (sessionComplete) {
    const stats = calculateSummaryStats();

    return (
      <SessionSummary
        sessionResults={sessionResults}
        summaryStats={stats}
        studyType="mcq"
        onNavigateToSeries={handleNavigateToSeries}
        onNavigateToDashboard={handleNavigateToDashboard}
      />
    );
  }

  // Main MCQ interface with components but original state
  return (
    <div className="mcq-container">
      {/* Original header structure with timer */}
      <div className="mcq-header">
        <div className="timer-section">
          <div className="timer">{formatTime(elapsedTime)}</div>
        </div>
        <div className="progress-section">
          <div className="progress-numbers">
            {currentQuestionIndex + 1} / {questions?.length || 0}
          </div>
        </div>
      </div>

      {/* Enhanced MCQ Display Component */}
      <MCQDisplay
        question={currentQuestion}
        selectedAnswer={selectedAnswer}
        onAnswerSelect={handleAnswerSelect}
        showingAnswer={showingAnswer}
        isTransitioning={isTransitioning}
      />

      {/* Original conditional rendering with components */}
      {!showingAnswer ? (
        <div className="mcq-controls">
          <ConfidenceSelector
            confidence={confidence}
            onConfidenceChange={handleConfidenceSelect}
          />
          <DifficultySelector
            difficulty={difficulty}
            onDifficultyChange={handleDifficultySelect}
          />
        </div>
      ) : (
        <div className="result-controls">
          <h3>Ready for next question?</h3>
          <div className="result-buttons">
            <button
              className="continue-btn"
              onClick={handleResult}
              title="Continue to next question"
            >
              {currentQuestionIndex + 1 < (questions?.length || 0) ? 'Next Question →' : 'Finish Session →'}
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Navigation Component */}
      <StudyNavigation
        onNavigateToSeries={handleNavigateToSeries}
        onNavigateToDashboard={handleNavigateToDashboard}
        studyType="mcq"
      />
    </div>
  );
};

export default NewMCQSession;